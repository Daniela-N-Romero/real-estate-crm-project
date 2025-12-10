// Impotamos los modelos de la base de datos y sequelize 
const { Property, Colleague } = require('../config/database');
const { Op } = require('sequelize'); //
// Librerías necesarias
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
// Importamos la ruta de uploads desde el middleware
const { uploadsDir } = require('../middlewares/uploadMiddleware');

sharp.cache(false);

class PropertyService {

    // ==========================================
    // MÉTODOS DE LECTURA (GETs)
    // ==========================================

    async getAllProperties() {
        return await Property.findAll();
    }

    async getPropertyById(id) {
        return await Property.findByPk(id);
    }

    async getAllForMap() {
        // Traemos datos ligeros
        const properties = await Property.findAll({
            attributes: [
                'id', 'name', 'price', 'currency', 'latitude', 'longitude', 
                'propertySource', 'images', 'isPublished', 'address', 
                'category', 'pdfUrl', 'type', 'subtype', 'totalSurface'
            ],
            include: [
               { model: Colleague, as: 'sourceColleague', attributes: ['agencyName','fullName'] }
            ]
        });
        
        // Filtramos (podríamos hacerlo por SQL, pero mantenemos tu lógica JS por ahora)
        return properties.filter(p => p.latitude && p.longitude);
    }

    async searchProperties(filters) {
        const { q, category, type } = filters;
        let whereCondition = { isPublished: true };

        if (q) {
            whereCondition[Op.or] = [
                { locality: { [Op.iLike]: `%${q}%` } },
                { neighbourhood: { [Op.iLike]: `%${q}%` } },
                { address: { [Op.iLike]: `%${q}%` } }
            ];
        }
        if (category) whereCondition.category = category;
        if (type) whereCondition.type = type;

        return await Property.findAll({ where: whereCondition });
    }

    async togglePublished(id, newStatus) {
        const property = await Property.findByPk(id);
        if (!property) return null;

        return await property.update({ isPublished: newStatus });
    }

    /**
     * Obtiene listas de valores únicos para los filtros del frontend.
     * Campo puede ser 'locality', 'category', 'type', 'subtype'.
     */
    async getUniqueValues(field) {
        // Buscamos solo en publicadas
        const properties = await Property.findAll({
            where: { isPublished: true },
            attributes: [field],
            group: [field], // Agrupamos para que sean únicos
            order: [[field, 'ASC']]
        });
        
        // Mapeamos para devolver un array simple de strings: ["Casa", "Departamento"]
        // Filtramos Boolean para quitar nulos o vacíos
        return properties.map(p => p[field]).filter(Boolean);
    }

    /**
     * Obtiene subtipos, opcionalmente filtrados por un tipo padre.
     */
    async getPublicSubtypes(typeFilter) {
        const whereClause = { isPublished: true };
        if (typeFilter) whereClause.type = typeFilter;

        const properties = await Property.findAll({
            where: whereClause,
            attributes: ['subtype'],
            group: ['subtype'],
            order: [['subtype', 'ASC']]
        });

        return properties.map(p => p.subtype).filter(Boolean);
    }

    /**
     * Busca propiedades similares basadas en tipo y ubicación.
     */
    async getSimilarProperties(id) {
        const currentProperty = await Property.findByPk(id);
        if (!currentProperty) return [];

        const baseAttributes = ['id', 'name', 'locality', 'price', 'currency', 'images', 'category', 'type'];

        // 1. Intento: Mismo tipo + Misma localidad (excluyendo la actual)
        let similar = await Property.findAll({
            where: {
                type: currentProperty.type,
                locality: currentProperty.locality,
                isPublished: true,
                id: { [Op.ne]: id } // Not Equal
            },
            limit: 3,
            attributes: baseAttributes
        });

        // 2. Relleno: Si hay menos de 3, buscamos mismo tipo en OTRAS localidades
        if (similar.length < 3) {
            const excludeIds = [id, ...similar.map(p => p.id)];
            const needed = 3 - similar.length;

            const extra = await Property.findAll({
                where: {
                    type: currentProperty.type,
                    isPublished: true,
                    id: { [Op.notIn]: excludeIds }
                },
                limit: needed,
                attributes: baseAttributes
            });
            similar = [...similar, ...extra];
        }

        return similar;
    }

    // ==========================================
    // MÉTODOS DE ESCRITURA (CREATE, UPDATE, DELETE)
    // ==========================================

    /**
     * Crea una nueva propiedad.
     */
    async createProperty(data, files) {
   
        // 1. Procesar imágenes y PDF
        const processedImagePaths = await this._processNewImages(files); 
        const pdfPath = this._extractPdfPath(files);

        // 2. Preparar datos
        const propertyData = this._prepareDataForDB(data, processedImagePaths, pdfPath);

        try {
            // 3. Guardar propiedad en la base de datos
            console.log("   > Creando nueva propiedad en la base de datos...");
            const newProperty = await Property.create(propertyData);
            return newProperty;
        } catch (error) {
            console.error("   > !!! Error creando propiedad:", error.message);
            throw error; // Re-lanzamos el error para que el controller lo capture
        }
    }

/**
     * Actualiza una propiedad existente.
     * Fíjate qué limpio quedó este método ahora.
     */
    async updateProperty(id, data, files) {

        // 1. Validar existencia
        const property = await Property.findByPk(id);
        if (!property) return null;

        // 2. Limpieza física: Borrar archivos que el usuario marcó para eliminar
        this._handlePhysicalDeletions(data.filesToDelete);

        // 3. Resolver lista final de imágenes (Viejas + Nuevas)
        const finalImagePaths = await this._resolveFinalImages(data, files);

        // 4. Resolver PDF final (Nuevo vs Viejo vs Borrado)
        const finalPdfUrl = this._resolveFinalPdf(property, data, files);

        // 5. Preparar datos y actualizar en la base de datos
        const updateData = this._prepareDataForDB(data, finalImagePaths, finalPdfUrl);
        await property.update(updateData);
        return await property.reload();
    }

    /**
     * Elimina una propiedad y sus archivos asociados.
     */
    async deleteProperty(id) {
        // 1. Buscar la propiedad para saber qué archivos borrar
        const property = await Property.findByPk(id);
        
        if (!property) {
            console.warn(`   > Propiedad ${id} no encontrada. No se puede borrar.`);
            return false; // Indicamos que no se borró nada
        }

        // 2. Recopilar todos los archivos físicos (Imágenes + PDF)
        const images = property.images || [];
        const pdf = property.pdfUrl;
        
        // Unimos todo en una sola lista, filtrando nulos
        const filesToDelete = [...images, pdf].filter(Boolean);

        // 3. Borrado Físico
        if (filesToDelete.length > 0) {
            this._deletePhysicalFiles(filesToDelete);
        }

        // 4. Borrado Lógico (Base de Datos)
        await property.destroy();
        return true; // Éxito
    }
    
    /**
     * Algoritmo de Sugerencias Inteligentes (Relajación escalonada).
     * Intenta encontrar coincidencias exactas y va quitando filtros si no encuentra nada.
     */
    async getPublicSuggestions(filters) {
        const { category, type, locality } = filters;
        let suggestions = [];

        // Configuración base
        const baseWhere = { isPublished: true };
        // Traemos solo lo necesario para la tarjeta de la propiedad
        const baseAttributes = [ 'id', 'name', 'locality', 'price', 'currency', 'images', 'category', 'type' ];
        const baseOrder = [['createdAt', 'DESC']];
        const baseLimit = 3;

        // Helper interno para construir el filtro de localidad (que puede ser array o string)
        const buildLocalityWhere = () => {
            if (!locality) return {};
            if (Array.isArray(locality)) {
                return { locality: { [Op.or]: locality.map(loc => ({ [Op.iLike]: loc })) } };
            }
            return { locality: { [Op.iLike]: `%${locality}%` } };
        };

        // INTENTO 1: Coincidencia Exacta (Categoría + Tipo + Localidad)
        if (category && type && locality) {
            suggestions = await Property.findAll({
                where: { 
                    ...baseWhere, 
                    category: { [Op.iLike]: category }, 
                    type: { [Op.iLike]: type },
                    ...buildLocalityWhere()
                },
                attributes: baseAttributes, order: baseOrder, limit: baseLimit
            });
        }

        // INTENTO 2: Misma Categoría + Localidad (Ignoramos el Tipo)
        if (suggestions.length === 0 && category && locality) {
            suggestions = await Property.findAll({
                where: { 
                    ...baseWhere, 
                    category: { [Op.iLike]: category },
                    ...buildLocalityWhere()
                },
                attributes: baseAttributes, order: baseOrder, limit: baseLimit
            });
        }

        // INTENTO 3: Misma Categoría + Tipo (Ignoramos la Localidad)
        if (suggestions.length === 0 && category && type) {
            suggestions = await Property.findAll({
                where: { 
                    ...baseWhere, 
                    category: { [Op.iLike]: category }, 
                    type: { [Op.iLike]: type } 
                },
                attributes: baseAttributes, order: baseOrder, limit: baseLimit
            });
        }

        // INTENTO 4: Solo Categoría (Trae cualquier cosa de esa operación)
        if (suggestions.length === 0 && category) {
            suggestions = await Property.findAll({
                where: { 
                    ...baseWhere, 
                    category: { [Op.iLike]: category }
                },
                attributes: baseAttributes, order: baseOrder, limit: baseLimit
            });
        }

        // INTENTO 5: Fallback Total (Trae las últimas 3 publicadas)
        if (suggestions.length === 0) {
            suggestions = await Property.findAll({
                where: baseWhere,
                attributes: baseAttributes, order: baseOrder, limit: baseLimit
            });
        }

        // Filtrar duplicados por ID (por si acaso)
        const uniqueSuggestions = suggestions.filter(
            (s, index, self) => index === self.findIndex((t) => t.id === s.id)
        );

        return uniqueSuggestions;
    }

    // ==========================================
    // MÉTODOS PRIVADOS (LOS OBREROS)
    // ==========================================

    //PROCESAMIENTO DE IMÁGENES

    /**
     * Procesa SOLO las imágenes nuevas que vienen en req.files con Sharp.
     */
    async _processNewImages(files) {
        let paths = [];
        if (!files || !files.images) return paths;

        for (const file of files.images) {
            const newFilename = `${path.parse(file.filename).name}.webp`;
            const newFilePath = path.join(uploadsDir, newFilename);
            const newFileUrl = `/uploads/${newFilename}`;

            try {
                await sharp(file.path)
                    .resize({ width: 1200, withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toFile(newFilePath);

                paths.push(newFileUrl);
                fs.unlinkSync(file.path); // Borrar original
            } catch (err) {
                console.error("   > !!! Error Sharp:", err.message);
                paths.push(`/uploads/${file.filename}`);
            }
        }
        return paths;
    }

    /**
     * Combina las imágenes que se quedan con las nuevas que llegan.
     */
    async _resolveFinalImages(data, files) {
        // 1. Imágenes nuevas procesadas (Sharp)
        const newImagePaths = await this._processNewImages(files);
        
        // 2. Imágenes viejas que el usuario quiere conservar
        const existingImageUrlsToKeep = this._safeParse(data.existingImageUrlsToKeep) || [];
        
        // 3. Unimos ambas listas
        return [...existingImageUrlsToKeep, ...newImagePaths];
    }

    // PROCESAMIENTO DE PDF

    /**
     * Extrae ruta del PDF nuevo si existe en files.
     */
    _extractPdfPath(files) {
        return (files && files.pdf && files.pdf[0]) ? `/uploads/${files.pdf[0].filename}` : null;
    }

    /**
     * Lógica compleja para decidir qué PDF queda en la base de datos.
     * Maneja el borrado físico del PDF viejo si es reemplazado.
     */
    _resolveFinalPdf(currentProperty, newData, files) {
        const newPdfPath = this._extractPdfPath(files);
        const filesToDelete = this._safeParse(newData.filesToDelete) || [];

        // CASO A: Subieron un PDF nuevo
        if (newPdfPath) {
            // Si ya había uno viejo, lo borramos físicamente para no acumular basura
            if (currentProperty.pdfUrl) {
                this._deletePhysicalFiles([currentProperty.pdfUrl]);
            }
            return newPdfPath;
        }

        // CASO B: El usuario pidió borrar el PDF existente (y no subió uno nuevo)
        if (filesToDelete.includes(currentProperty.pdfUrl)) {
            console.log('   > [PDF] Eliminado por el usuario.');
            return null;
        }

        // CASO C: No se tocó nada, mantenemos el que estaba
        return currentProperty.pdfUrl;
    }

    // PROCESAMIENTO DE BORRADOS FÍSICOS

    /**
     * Parsea la lista de borrados y ejecuta el borrado físico.
     */
    _handlePhysicalDeletions(filesToDeleteRaw) {
        const filesToDelete = this._safeParse(filesToDeleteRaw) || [];
        if (filesToDelete.length > 0) {
            console.log(`   > [Disk] Borrando ${filesToDelete.length} archivos físicos...`);
            this._deletePhysicalFiles(filesToDelete);
        }
    }

    /**
     * Borra archivos del disco dado un array de URLs relativas.
     */
    _deletePhysicalFiles(relativePaths) {
        relativePaths.forEach(filePath => {
            if (!filePath) return;
            const filename = path.basename(filePath); 
            const fullPath = path.join(uploadsDir, filename);
            if (fs.existsSync(fullPath)) {
                try { fs.unlinkSync(fullPath); } catch (e) { console.error(`Error borrando ${filename}`); }
            }
        });
    }


    // PROCESAMIENTO DE DATOS PARA LA DB

    /**
     * Mapeo centralizado de datos para la DB.
     * Sirve tanto para Create como para Update.
     */
    _prepareDataForDB(data, imagePaths, pdfPath) {
        return {
            name: data.name,
            address: data.address,
            locality: data.locality,
            neighbourhood: data.neighbourhood,
            description: data.description,
            type: data.type,
            subtype: data.subtype,
            category: data.category,
            currency: data.currency,
            propertySource: data.propertySource || 'propia',
            privateNotes: data.privateNotes || null,
            
            // Numéricos
            price: data.price ? parseFloat(data.price) : null,
            totalSurface: data.totalSurface ? parseFloat(data.totalSurface) : null,
            coveredSurface: data.coveredSurface ? parseFloat(data.coveredSurface) : null,
            latitude: data.latitude ? parseFloat(data.latitude) : null,
            longitude: data.longitude ? parseFloat(data.longitude) : null,
            ownerId: data.ownerId ? parseInt(data.ownerId) : null,
            agentId: data.agentId ? parseInt(data.agentId) : null,
            colleagueId: data.colleagueId ? parseInt(data.colleagueId) : null,
            
            isPublished: data.isPublished === 'true',
            
            // Archivos Finales
            images: imagePaths,
            pdfUrl: pdfPath,
            
            // Transformaciones
            videoUrl: this._transformYoutubeLink(data.videoUrl),
            specificCharacteristics: this._safeParse(data.specificCharacteristics) || {},
            amenities: this._safeParse(data.amenities) || [],
            internalDocsUrls: this._safeParse(data.internalDocsUrls) || [],
        };
    }

    // --- Helpers Utilitarios ---
    _safeParse(value) {
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            try { return JSON.parse(value); } catch (e) { return value.startsWith('{') ? {} : []; }
        }
        return value;
    }

    _transformYoutubeLink(url) {
        const defaultVideo = 'https://www.youtube.com/embed/TU_VIDEO_POR_DEFECTO';
        if (!url || typeof url !== 'string') return defaultVideo;
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|v\/|embed\/|watch\?v=|shorts\/)|youtu\.be\/)([^"&?\/ ]{11})/;
        const match = url.match(regex);
        return match && match[1] ? `https://www.youtube.com/embed/${match[1]}` : defaultVideo;
    }

}

module.exports = new PropertyService();