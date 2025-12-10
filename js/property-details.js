// js/property-details.js

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. LÓGICA PARA OBTENER EL ID ---
    let propertyId = null;
    const urlPath = window.location.pathname; // Esto nos da /propiedad/42/casa-en-venta
    const pathParts = urlPath.split('/');     // Esto lo divide en ["", "propiedad", "42", "casa-en-venta"]

    // Verificamos si estamos en la URL amigable
    if (pathParts[1] === 'propiedad' && pathParts[2]) {
        // El ID es ahora la tercera parte del path
        propertyId = pathParts[2];
    } else {
        // Si no, mantenemos la lógica antigua por si acaso (fallback)
        propertyId = new URLSearchParams(window.location.search).get('id');
    }

    if (!propertyId) {
        // Si no hay ID en la URL, muestra un error en el contenedor principal
        const mainContainer = document.querySelector('.container');
        if(mainContainer) {
            mainContainer.innerHTML = '<div class="alert alert-danger mt-5">No se especificó una propiedad para mostrar.</div>';
        }
        return;
    }

    // --- 2. RESTO DE LAS FUNCIONES (Definidas dentro del DOMContentLoaded) ---
    
    /**
     * Genera el HTML para la galería de imágenes usando el Carrusel de Bootstrap.
     */
    function renderGallery(images) {
        if (!images || images.length === 0) {
            return '<img src="/assets/images/placeholder.jpg" class="img-fluid rounded" alt="Imagen no disponible">';
        }

        const indicators = images.map((_, index) => `
            <button 
                type="button" 
                data-bs-target="#propertyGalleryCarousel" 
                data-bs-slide-to="${index}" 
                class="${index === 0 ? 'active' : ''}" 
                aria-current="${index === 0 ? 'true' : 'false'}" 
                aria-label="Slide ${index + 1}">
            </button>
        `).join('');

        const slides = images.map((imgUrl, index) => `
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${imgUrl}" class="d-block w-100" alt="Imagen de la propiedad ${index + 1}">
            </div>
        `).join('');

        return `
            <div id="propertyGalleryCarousel" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-indicators">
                    ${indicators}
                </div>
                <div class="carousel-inner rounded">
                    ${slides}
                </div>
                <button class="carousel-control-prev" type="button" data-bs-target="#propertyGalleryCarousel" data-bs-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Previous</span>
                </button>
                <button class="carousel-control-next" type="button" data-bs-target="#propertyGalleryCarousel" data-bs-slide="next">
                    <span class="carousel-control-next-icon" aria-hidden="true"></span>
                    <span class="visually-hidden">Next</span>
                </button>
            </div>
        `;
    }

    /**
     * Muestra todos los detalles de la propiedad en la página.
     */
    function displayPropertyDetails(property) {
        document.title = `${property.name} - MS Propiedades`;

        // Llenar la columna de información
        document.getElementById('property-header').textContent = `${property.type} en ${property.category}`;
        document.getElementById('property-title').textContent = property.name;
        
        // --- CÓDIGO DE GOOGLE ANALYTICS (Movemos el page_view aquí) ---
        if (typeof gtag === 'function') {
            const virtualPath = `/propiedad/${property.id}/${property.name.toLowerCase().replace(/\s+/g, '-')}`;
            gtag('event', 'page_view', {
                page_title: property.name,
                page_location: window.location.href,
                page_path: virtualPath
            });
        }

        document.getElementById('property-price').innerHTML = property.price 
            ? `${property.currency} <span class="fw-bold">${new Intl.NumberFormat('es-AR').format(property.price)}</span>`
            : 'Consultar';

        // Llenar características principales
        const featuresContainer = document.getElementById('property-main-features');
        let featuresHtml = '';
        const sc = property.specificCharacteristics || {}; // sc = specific characteristics

        // Características Generales
        if (property.totalSurface) featuresHtml += `<div class="feature-item"><i class="bi bi-rulers text-muted"></i> ${property.totalSurface} m² totales</div>`;
        if (property.coveredSurface && property.coveredSurface > 0) featuresHtml += `<div class="feature-item"><i class="bi bi-building text-muted"></i> ${property.coveredSurface} m² cubiertos</div>`;
        
        // Características de Vivienda
        if (sc.ambientes) featuresHtml += `<div class="feature-item"><i class="bi bi-door-open text-muted"></i> ${sc.ambientes} ambientes</div>`;
        if (sc.dormitorios) featuresHtml += `<div class="feature-item"><i class="bi bi-person-workspace text-muted"></i> ${sc.dormitorios} dormitorios</div>`;
        if (sc.banos && property.type === 'vivienda') featuresHtml += `<div class="feature-item"><i class="bi bi-droplet text-muted"></i> ${sc.banos} baño(s)</div>`;

        // (Aquí iría el resto de tu lógica para 'lote', 'industrial', etc. si la tienes)

        featuresContainer.innerHTML = featuresHtml;
        
        // Botón de WhatsApp
        const contactButtonsContainer = document.getElementById('property-contact-buttons');
        const contactNumber = property.contactPhone || '5491136358302'; // Número de fallback
        let buttonsHtml = `
            <a href="https://api.whatsapp.com/send?phone=${contactNumber}&text=Hola,%20me%20interesa%20la%20propiedad%20'${encodeURIComponent(property.name)}'" class="btn btn-success btn-lg" target="_blank">
                <i class="bi bi-whatsapp"></i> Contactar por WhatsApp</a>
        `;
        if (property.pdfUrl) {
            buttonsHtml += `
                <a href="${property.pdfUrl}" class="btn btn-outline-secondary btn-lg" target="_blank" download>
                    <i class="bi bi-file-earmarked-pdf"></i> Descargar Folleto PDF
                </a>
            `;
        }
        contactButtonsContainer.innerHTML = buttonsHtml;
            
        // Llenar la galería de fotos
        document.getElementById('property-gallery').innerHTML = renderGallery(property.images);

        // Llenar la sección de abajo
        document.getElementById('property-description').innerHTML = property.description ? property.description.replace(/\n/g, '<br>') : 'No hay descripción disponible.';
        
        let amenitiesHtml = '';
        if (property.amenities && property.amenities.length > 0) {
            const cleanedAmenities = property.amenities.flatMap(item => {
                if (typeof item === 'string' && item.startsWith('[')) {
                    try { return JSON.parse(item); } catch (e) { return []; }
                }
                return item;
            });
            const uniqueAmenities = [...new Set(cleanedAmenities)];
            if (uniqueAmenities.length > 0) {
                amenitiesHtml = `
                    <hr class="my-4">
                    <h4>Comodidades</h4>
                    <ul class="list-inline">${uniqueAmenities.map(item => `<li class="list-inline-item me-3"><i class="bi bi-check-circle-fill text-primary me-2"></i>${item}</li>`).join('')}</ul>
                `;
            }
        }
        document.getElementById('property-amenities').innerHTML = amenitiesHtml;
        
        if (property.videoUrl) {
            document.getElementById('property-video').innerHTML = `
                <div class="property-details-card">
                    <h3>Video de la propiedad</h3>
                    <div class="ratio ratio-16x9">
                        <iframe src="${property.videoUrl.replace('watch?v=', 'embed/')}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>`;
        }


// LÓGICA DE MAPA PÚBLICO (Leaflet)
    if (property.latitude && property.longitude) {
        const lat = parseFloat(property.latitude);
        const lng = parseFloat(property.longitude);

        const map = L.map('publicMap').setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Pin personalizado (opcional, o usa el azul por defecto)
        L.marker([lat, lng]).addTo(map)
            .bindPopup(property.address || property.name)
            .openPopup();
    } else {
        // Fallback por si alguna quedó sin coordenadas
        document.getElementById('publicMap').innerHTML = '<p class="text-muted">Ubicación no disponible.</p>';
    }


        // Inicializar el carrusel de Bootstrap (si existe)
        const propertyCarousel = document.getElementById('propertyGalleryCarousel');
        if (propertyCarousel) {
            new bootstrap.Carousel(propertyCarousel);
        }
    }

    /**
     * Crea la tarjeta para una propiedad similar.
     */
    function createSimilarPropertyCard(property) {
        const imageUrl = (property.images && property.images.length > 0) ? property.images[0] : '/assets/images/placeholder.jpg';
        const formattedPrice = property.price ? `${property.currency} ${new Intl.NumberFormat('es-AR').format(property.price)}` : 'Consultar';

        // --- Lógica para crear el slug ---
        const slug = property.name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
            .replace(/[^a-z0-9\s-]/g, ' ') // Quitar caracteres raros
            .replace(/[\s-]+/g, '-')     // Unir espacios y guiones
            .replace(/^-+|-+$/g, '');   // Quitar guiones al inicio/final
        
        const newUrl = `/propiedad/${property.id}/${slug}`;
        // --- Fin de la lógica ---

        return `
            <div class="property-card">
                <img src="${imageUrl}" alt="Imagen de ${property.name}" class="property-card-img">
                <div class="property-card-body">
                    <span class="property-card-category ${property.category.toLowerCase()}">${property.category}</span>
                    <h3 class="property-card-title">${property.name}</h3>
                    <p class="property-card-location">${property.locality}</p>
                    <p class="property-card-price">${formattedPrice}</p>
                    <a href="${newUrl}" class="btn btn-outline-primary mt-auto" target="_blank" rel="noopener noreferrer">Ver detalles</a>
                </div>
            </div>
        `;
    }

    /**
     * Inicia la carga de datos de la propiedad desde la API.
     */
    async function fetchProperty() {
        try {
            const response = await fetch(`/api/properties/public-properties/${propertyId}`);
            if (!response.ok) {
                if(response.status === 404) {
                   throw new Error('Propiedad no encontrada o no disponible.');
                }
                throw new Error('No se pudo cargar la propiedad.');
            }
            const property = await response.json();
            displayPropertyDetails(property);

            // 2. Después de cargar la principal, buscar las similares
            const similarResponse = await fetch(`/api/properties/public-properties/${propertyId}/similar`);
            if (similarResponse.ok) {
                const similarProperties = await similarResponse.json();
                
                if (similarProperties.length > 0) {
                    const similarGrid = document.getElementById('similar-properties-grid');
                    const similarSection = document.getElementById('similar-properties-section');
                    
                    similarGrid.innerHTML = similarProperties.map(createSimilarPropertyCard).join('');
                    similarSection.style.display = 'block'; 
                }
            }
            
        } catch (error) {
            const mainContainer = document.querySelector('.container');
            if(mainContainer) {
                mainContainer.innerHTML = `<div class="alert alert-danger mt-5">${error.message}</div>`;
            }
        }
    }

    // --- 3. EJECUTAR LA LÓGICA ---
    fetchProperty();
});