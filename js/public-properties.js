// js/public-properties.js

document.addEventListener('DOMContentLoaded', () => {
    const filterForm = document.getElementById('filter-form');
    const gridContainer = document.getElementById('properties-grid');
    const noResultsMessage = document.getElementById('no-results-message');
    const resultsTitle = document.getElementById('results-title');
    const locationSelect = document.getElementById('filter-locality'); // Referencia al nuevo dropdown
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const suggestionsSection = document.getElementById('suggestions-section');
    const suggestionsGrid = document.getElementById('suggestions-grid');
    /**
     * NUEVA FUNCIÓN: Carga las localidades desde la API y las añade al dropdown.
     */
    async function populateLocationFilter() {
        try {
            const response = await fetch('/api/properties/public-localities');
            if (!response.ok) throw new Error('No se pudieron cargar las localidades.');

            const localities = await response.json();

            localities.forEach(locality => {
                const option = document.createElement('option');
                option.value = locality;
                option.textContent = locality;
                locationSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al poblar el filtro de localidades:', error);
            // Opcional: deshabilitar el filtro si falla la carga
            locationSelect.disabled = true;
        }
    }

    /**
     * Genera el HTML para una sola tarjeta de propiedad.
     */
function createPropertyCard(property) {
    const imageUrl = (property.images && property.images.length > 0)
        ? property.images[0]
        : '/assets/images/placeholder.jpg';

    const formattedPrice = property.price
        ? `${property.currency} ${new Intl.NumberFormat('es-AR').format(property.price)}`
        : 'Consultar precio';

    return `
        <div class="property-card">
            <img src="${imageUrl}" alt="Imagen de ${property.name}" class="property-card-img">
            <div class="property-card-body">
                <span class="property-card-category ${property.category.toLowerCase()}">${property.category}</span>
                <h3 class="property-card-title">${property.name}</h3>
                <p class="property-card-location">${property.locality}</p>
                <p class="property-card-price">${formattedPrice}</p>
                <a href="/pages/inmobiliaria/property-template.html?id=${property.id}" class="btn btn-outline-primary mt-auto" target="_blank" rel="noopener noreferrer">Ver detalles</a>
            </div>
        </div>
    `;
}
    
    /**
     * Busca y muestra propiedades de sugerencia.
     */
    async function fetchAndDisplaySuggestions(type, category) {
        suggestionsSection.style.display = 'none';
        let suggestions = [];

        try {
            // --- NEW WATERFALL LOGIC ---
            // 1. First, try to find suggestions by the same TYPE
            if (type) {
                const response = await fetch(`/api/properties/public-properties?type=${type}`);
                if (response.ok) {
                    suggestions = await response.json();
                }
            }

            // 2. If no suggestions were found by type, try by CATEGORY
            if (suggestions.length === 0 && category) {
                const response = await fetch(`/api/properties/public-properties?category=${category}`);
                if (response.ok) {
                    suggestions = await response.json();
                }
            }
            // 3. Filter out properties that are already displayed in the main results
            const mainResultIds = Array.from(gridContainer.querySelectorAll('.property-card'))
                                       .map(card => card.querySelector('a').href.split('id=')[1]);

            const filteredSuggestions = suggestions.filter(s => !mainResultIds.includes(String(s.id))).slice(0, 3);
            // --- FIN DEL CAMBIO ---

            // Display the filtered suggestions
            if (filteredSuggestions.length > 0) {
                const cardsHtml = filteredSuggestions.map(createPropertyCard).join('');
                suggestionsGrid.innerHTML = cardsHtml;
                suggestionsSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
        }
    }

    /**
     * Lógica principal para buscar y mostrar propiedades.
     */
    async function fetchAndDisplayProperties(url = '/api/properties/public-properties') {
        gridContainer.innerHTML = '<p>Cargando propiedades...</p>';
        noResultsMessage.style.display = 'none';
        suggestionsSection.style.display = 'none';
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('La respuesta de la red no fue exitosa.');
            
            const properties = await response.json();
            const originalParams = new URLSearchParams(url.split('?')[1]);
            const propertyType = originalParams.get('type');
            const category = originalParams.get('category');

            if (properties.length === 0) {
                gridContainer.innerHTML = '';
                noResultsMessage.style.display = 'block';
                resultsTitle.textContent = 'No se encontraron propiedades';
            } else {
                resultsTitle.textContent = 'Propiedades Encontradas';
                const cardsHtml = properties.map(createPropertyCard).join('');
                gridContainer.innerHTML = cardsHtml;
            }

            // Always try to fetch suggestions, regardless of the result
            if (propertyType || category) {
                 fetchAndDisplaySuggestions(propertyType, category);
            }

        } catch (error) {
            console.error('Error al obtener las propiedades:', error);
            gridContainer.innerHTML = '<p class="text-danger">Error al cargar las propiedades.</p>';
        }
    }


    // Manejador del formulario de filtros
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevenimos el envío tradicional del formulario.

        // Creamos un objeto URLSearchParams para construir la cadena de consulta fácilmente.
        const params = new URLSearchParams();

        const categoryEl = document.getElementById('filter-category');
        const typeEl = document.getElementById('filter-type');
        const localityEl = document.getElementById('filter-locality');
        const subtypeEl = document.getElementById('filter-subtype');

        const category = categoryEl ? categoryEl.value : '';
        const type = typeEl ? typeEl.value : '';
        const locality = localityEl ? localityEl.value : '';
        const subtype = subtypeEl ? subtypeEl.value : ''; // Esto dará '' en lugar de un error

             // Añadimos los parámetros solo si tienen un valor.
        if (category) params.append('category', category);
        if (type) params.append('type', type);
        if (locality) params.append('locality', locality);
        if (subtype) params.append('subtype', subtype);

        // <<< CÓDIGO DE GOOGLE ANALYTICS (está bien como lo tenías) >>>
        if (typeof gtag === 'function') {
            const searchTerm = [category, type, locality, subtype].filter(Boolean).join(' - ');
            gtag('event', 'search', {
                search_term: searchTerm,
                search_category: category || undefined,
                search_type: type || undefined,
                search_locality: locality || undefined,
                search_subtype: subtype || undefined,
            });
        }

        // Redirigimos al usuario a la página de resultados con los filtros en la URL.
        window.location.href = `/results.html?${params.toString()}`;
    });
    
    // El manejador del botón de limpiar filtros ya funciona correctamente.
    clearFiltersBtn.addEventListener('click', () => {
        filterForm.reset();
        // Opcionalmente, podrías redirigir a la página de resultados sin filtros.
        window.location.href = '/results.html';
    });

    // --- LLAMADAS INICIALES AL CARGAR LA PÁGINA ---
    populateLocationFilter(); // Llama a la nueva función para llenar el dropdown
});