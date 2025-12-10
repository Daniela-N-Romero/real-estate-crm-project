const propertyService = require('../services/propertyService');

class PropertyController {

    // POST /properties
    async create(req, res) {
        try {
            // Llamamos al servicio para crear la propiedad
            const newProperty = await propertyService.createProperty(req.body, req.files);
            console.log('Propiedad creada con ID:', newProperty.id);
            res.status(201).json(newProperty);
        } catch (error) {
            console.error('Error en propertyController.create:', error);
            res.status(500).json({ message: 'Error al crear la propiedad'});

            /** Soy consciente de que si la BD falla, quedan archivos temporales. 
             * En una versión 2.0 implementaría un Cron Job para limpieza automática 
             * o una transacción compensatoria en el controlador.*/
        }
    }

    // PUT /properties/:id
    async update(req, res) {
        try {
            // LLlama al servicio para actualizar la propiedad
            const updatedProperty = await propertyService.updateProperty(req.params.id, req.body, req.files);
            if (!updatedProperty) {
                return res.status(404).json({ message: 'Propiedad no encontrada para actualizar.' });
            }
            res.json(updatedProperty);

        } catch (error) {
            console.error('!!! [Controller] Error en update:', error.message);
            res.status(500).json({ message: 'Error al actualizar la propiedad' });
        }
    }

    // DELETE /properties/:id
    async delete(req, res) {
        try {
            // Llama al servicio para eliminar la propiedad
            const result = await propertyService.deleteProperty(req.params.id);
            if (!result) {
                return res.status(404).json({ message: 'Propiedad no encontrada para eliminar.' });
            }
            res.status(204).send(); // 204 significa "Éxito, pero no tengo nada que mostrarte (ya lo borré)"
            
        } catch (error) {
            console.error('!!! [Controller] Error en delete:', error.message);
            res.status(500).json({ message: 'Error al eliminar la propiedad' });
        }
    }

    // GET /properties/all-for-map
    async getAllForMap(req, res) {
        try {
            const data = await propertyService.getAllForMap();
            res.json(data);
        } catch (error) {
            console.error('Error en getAllForMap:', error);
            res.status(500).json({ message: 'Error al obtener datos del mapa' });
        }
    }

    // GET /properties/search
    async search(req, res) {
        try {
            // Pasamos req.query (lo que viene en la URL) al servicio. Por ejemplo: /properties/search?type=house&minPrice=100000
            const results = await propertyService.searchProperties(req.query);
            res.json(results);
        } catch (error) {
            console.error('Error en search:', error);
            res.status(500).json({ message: 'Error al buscar' });
        }
    }

    // GET /properties
    async getAll(req, res) {
        try {
            const properties = await propertyService.getAllProperties();
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener propiedades' });
        }
    }

    // GET /properties/:id
    async getById(req, res) {
        try {
            const property = await propertyService.getPropertyById(req.params.id);
            if (!property) return res.status(404).json({ message: 'No encontrada' });
            res.json(property);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener propiedad' });
        }
    }

    // GET /public-suggestions
    async getPublicSuggestions(req, res) {
        try {
            const suggestions = await propertyService.getPublicSuggestions(req.query);
            res.json(suggestions);
        } catch (error) {
            console.error('Error en getPublicSuggestions:', error);
            res.status(500).json({ message: 'Error al obtener sugerencias' });
        }
    }

    // GET /public-localities
    async getLocalities(req, res) {
        try {
            const list = await propertyService.getUniqueValues('locality');
            res.json(list);
        } catch (e) { res.status(500).json({ message: 'Error al obtener localidades' }); }
    }

    // GET /public-categories
    async getCategories(req, res) {
        try {
            const list = await propertyService.getUniqueValues('category');
            res.json(list);
        } catch (e) { res.status(500).json({ message: 'Error al obtener categorías' }); }
    }

    // GET /public-types
    async getTypes(req, res) {
        try {
            const list = await propertyService.getUniqueValues('type');
            res.json(list);
        } catch (e) { res.status(500).json({ message: 'Error al obtener tipos' }); }
    }

    // GET /public-subtypes
    async getSubtypes(req, res) {
        try {
            const list = await propertyService.getPublicSubtypes(req.query.type);
            res.json(list);
        } catch (e) { res.status(500).json({ message: 'Error al obtener subtipos' }); }
    }

    // GET /public-properties/:id/similar
    async getSimilar(req, res) {
        try {
            const list = await propertyService.getSimilarProperties(req.params.id);
            res.json(list);
        } catch (e) { res.status(500).json({ message: 'Error al obtener similares' }); }
    }

    // PUT /properties/:id/toggle-published
    async togglePublished(req, res) {
        try {
            const result = await propertyService.togglePublished(req.params.id, req.body.isPublished);
            
            if (!result) return res.status(404).json({ message: 'No encontrada' });
            
            res.json({ message: 'Estado actualizado', newStatus: result.isPublished });
        } catch (error) {
            res.status(500).json({ message: 'Error al cambiar estado' });
        }
    }

}

module.exports = new PropertyController();