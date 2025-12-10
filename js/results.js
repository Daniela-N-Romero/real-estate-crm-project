// js/results.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. REFERENCIAS A ELEMENTOS DEL DOM
    const resultsContainer = document.getElementById('results-container');
    const resultsTitle = document.getElementById('results-title');
    const filterForm = document.getElementById('filter-form');
    const appliedFiltersContainer = document.getElementById('applied-filters-container'); 
    const localityChecklist = document.getElementById('filter-locality-list');
    const categorySelect = document.getElementById('filter-category');
    const typeSelect = document.getElementById('filter-type');
    const subtypeSelect = document.getElementById('filter-subtype');

    //FUNCIONES AUXILIARES
    
    /**
     * Formatea un texto de "valor_de_api" a "Valor De Api".
     */
    function formatText(text) {
        if (!text) return '';
        return text.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    }

    async function populateLocalityFilter() {
        if (!localityChecklist) return; // Si no existe el contenedor, no hace nada

        try {
            const response = await fetch('/api/properties/public-localities');
            if (!response.ok) throw new Error('Error al cargar localidades.');
            
            const localities = await response.json();
            
            // Limpiamos por si acaso
            localityChecklist.innerHTML = ''; 

            // Creamos un checkbox por cada localidad
            localities.forEach(locality => {
                const div = document.createElement('div');
                div.className = 'form-check';
                div.innerHTML = `
                    <input class="form-check-input" type="checkbox" name="locality" value="${locality}" id="loc-${locality}">
                    <label class="form-check-label" for="loc-${locality}">${formatText(locality)}</label>
                `;
                localityChecklist.appendChild(div);
            });
        } catch (error) {
            console.error(error);
        }
    }
    
    async function populateSelect(selectElement, url) {
        if (!selectElement) return; // Nos aseguramos que el select exista
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error al cargar datos desde ${url}`);
            const options = await response.json();
            
            // Limpiamos opciones anteriores
            selectElement.innerHTML = '<option value="">Todos</option>'; 
            
            options.forEach(opt => {
                const optionEl = document.createElement('option');
                optionEl.value = opt;
                optionEl.text = formatText(opt);
                selectElement.appendChild(optionEl);
            });

        } catch (error) {
            console.error(error);
        }
    }

    /**
     * Lee los parámetros de la URL y los establece como valores en los filtros.
     */
    function setFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        // Setea los <select> simples
        categorySelect.value = params.get('category') || '';
        typeSelect.value = params.get('type') || '';
        subtypeSelect.value = params.get('subtype') || '';
        if(document.getElementById('filter-currency')) {
            const curr = params.get('filterCurrency');
            // Si hay algo en la URL úsalo, si no, deja el default del HTML
            if(curr) document.getElementById('filter-currency').value = curr;
        }
        if(document.querySelector('input[name="minPrice"]')) 
            document.querySelector('input[name="minPrice"]').value = params.get('minPrice') || '';
        
        if(document.querySelector('input[name="maxPrice"]')) 
            document.querySelector('input[name="maxPrice"]').value = params.get('maxPrice') || '';
            
        if(document.getElementById('filter-sort'))
            document.getElementById('filter-sort').value = params.get('sortOrder') || 'newest';

        // Setea los checkboxes de localidades
        const localityParams = params.getAll('locality');
        if (localityChecklist) {
                    localityChecklist.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                        // Si el valor está en los parámetros, true. Si no, false.
                        checkbox.checked = localityParams.includes(checkbox.value);
                    });
        }
    }

    /**
     * Genera la tarjeta HTML para una propiedad.
     */
    function createPropertyCard(property) {
        const imageUrl = (property.images && property.images.length > 0) ? property.images[0] : '/assets/images/placeholder.jpg';
        const formattedPrice = property.price ? `${property.currency} ${new Intl.NumberFormat('es-AR').format(property.price)}` : 'Consultar';
        const categoryClass = property.category ? property.category.toLowerCase() : '';

        const slug = property.name
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, ' ')
            .replace(/[\s-]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const newUrl = `/propiedad/${property.id}/${slug}`;

        return `
            <div class="property-card">
                 <div class="property-card-image-container">
                    <img src="${imageUrl}" alt="Imagen de ${property.name}" class="property-card-img">
                    <span class="property-card-category ${categoryClass}">${property.category}</span>
                </div>
                <div class="property-card-body">
                    <h3 class="property-card-title">${property.name}</h3>
                    <p class="property-card-location"><i class="bi bi-geo-alt-fill"></i> ${property.locality}</p>
                    <p class="property-card-price">${formattedPrice}</p>
                    <a href="${newUrl}" class="btn btn-outline-primary mt-auto" target="_blank" rel="noopener noreferrer">Ver detalles</a>
                </div>
            </div>
        `;
    }
    /**
     * Obtiene los parámetros, busca las propiedades y las muestra.
     */
    async function fetchAndDisplayResults() {
        // Usamos window.location.search para tener SIEMPRE la URL actual
        const queryString = window.location.search;
        const apiUrl = `/api/properties/public-properties${queryString}`;
        const noResultsDiv = document.getElementById('no-results-suggestions');
        const suggestionsContainer = document.getElementById('suggestions-container');
        resultsContainer.innerHTML = '<p>Cargando propiedades...</p>';

        if(noResultsDiv) noResultsDiv.style.display = 'none';

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Error al cargar las propiedades.');
            const properties = await response.json();

            if (properties.length === 0) {
                resultsTitle.textContent = '';
                resultsContainer.innerHTML = ''; // Limpia resultados
                
                // --- LÓGICA DE SUGERENCIAS ---
                // Hacemos visibles las sugerencias
                if(noResultsDiv) noResultsDiv.style.display = 'block';
                
                const params = new URLSearchParams(window.location.search);

                // Construimos una URL de sugerencias solo con lo importante
                const suggestionParams = new URLSearchParams();
                // Enviamos los filtros principales para que el backend decida
                if (params.get('category')) suggestionParams.append('category', params.get('category'));
                if (params.get('type')) suggestionParams.append('type', params.get('type'));

                // ¡NUEVO! Enviamos también las localidades
                const localities = params.getAll('locality');
                localities.forEach(loc => {
                    suggestionParams.append('locality', loc);
                });

                const suggestionUrl = `/api/properties/public-suggestions?${suggestionParams.toString()}`;
                // --- FIN DE NUEVA LÓGICA DE SUGERENCIAS ---

                const respSugg = await fetch(suggestionUrl);
                const suggestions = await respSugg.json();
                
                if(suggestionsContainer) {
                    suggestionsContainer.innerHTML = suggestions
                        .slice(0, 3) // Solo mostramos 3
                        .map(createPropertyCard)
                        .join('');
                }
            } else {
                resultsTitle.textContent = 'Propiedades Encontradas';
                resultsContainer.innerHTML = properties.map(createPropertyCard).join('');
            }
        } catch (error) {
            console.error(error);
            resultsContainer.innerHTML = '<p class="text-danger">No se pudieron cargar las propiedades.</p>';
        }
        displayAppliedFilters();
    }

    function displayAppliedFilters() {
        if (!appliedFiltersContainer) return; // Si no hay contenedor, no hace nada

        const params = new URLSearchParams(window.location.search);
        
        // Limpiamos los tags anteriores
        appliedFiltersContainer.innerHTML = ''; 

        // Si hay al menos un filtro, mostramos el título
        if ([...params.keys()].length > 0) {
            appliedFiltersContainer.innerHTML = '<strong>Filtros aplicados:</strong> ';
        } else {
            return; // No hay filtros, no muestra nada
        }

        params.forEach((value, key) => {
            const tag = document.createElement('span');
            tag.className = 'badge bg-primary me-2 my-1'; // 'my-1' para espacio en móvil
            tag.innerHTML = `
                ${formatText(value)} 
                <button type="button" class="btn-close btn-close-white ms-1" 
                        aria-label="Remove filter" 
                        data-key="${key}" data-value="${value}"></button>
            `;
            appliedFiltersContainer.appendChild(tag);
        });
    }

    function removeFilter(keyToRemove, valueToRemove) {
        const params = new URLSearchParams(window.location.search);
        
        const allValues = params.getAll(keyToRemove);
        params.delete(keyToRemove); // Borra todas las claves de ese tipo
        
        // Vuelve a añadir todas excepto la que queremos borrar
        allValues.forEach(value => {
            if (value !== valueToRemove) {
                params.append(keyToRemove, value);
            }
        });

        // Aplicamos la nueva URL y volvemos a buscar
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState(null, '', newUrl);
        setFiltersFromURL(); // Sincroniza los filtros (desmarca el checkbox)
        fetchAndDisplayResults();
    }


    //LÓGICA PRINCIPAL Y MANEJADORES DE EVENTOS
    
    async function initializePage() {
        await populateLocalityFilter(); 
        
        const currentParams = new URLSearchParams(window.location.search);
        const currentType = currentParams.get('type');
        let subtypeUrl = '/api/properties/public-subtypes';
        if (currentType) {
            subtypeUrl += `?type=${currentType}`;
        }
        await populateSelect(subtypeSelect, subtypeUrl); 
        await populateSelect(categorySelect, '/api/properties/public-categories'); 
        await populateSelect(typeSelect, '/api/properties/public-types'); 
        
        // Sincroniza los filtros con la URL
        setFiltersFromURL();
        
        // Muestra los resultados iniciales
        await fetchAndDisplayResults();
    }


    // Cuando el formulario se envía...
    filterForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(filterForm);
        const params = new URLSearchParams();

        // Obtiene los filtros simples
        const categoryValue = formData.get('category');
        const typeValue = formData.get('type');
        const subtypeValue = formData.get('subtype');
        const minPrice = formData.get('minPrice');
        const maxPrice = formData.get('maxPrice');
        const sortOrder = formData.get('sortOrder');
        const filterCurrency = formData.get('filterCurrency');

        // Obtiene el filtro múltiple de localidades
        const localityValues = formData.getAll('locality');

        // Añade a los parámetros
        if (categoryValue) params.append('category', categoryValue);
        if (typeValue) params.append('type', typeValue);
        if (subtypeValue) params.append('subtype', subtypeValue);
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        if (sortOrder) params.append('sortOrder', sortOrder);
        if (filterCurrency) params.append('filterCurrency', filterCurrency);
        localityValues.forEach(loc => params.append('locality', loc));


        // <<< INICIO: CÓDIGO DE GOOGLE ANALYTICS (¡MODIFICADO!) >>>
        if (typeof gtag === 'function') {
            // Unimos las localidades con una coma para el log
            const localityString = localityValues.join(','); 
            const searchTerm = [categoryValue, typeValue, localityString, subtypeValue].filter(Boolean).join(' - ');

            gtag('event', 'search', {
                search_term: searchTerm,
                search_category: categoryValue || undefined,
                search_type: typeValue || undefined,
                search_locality: localityString || undefined, // Envía todas las localidades juntas
                search_subtype: subtypeValue || undefined,
            });
        }
        // <<< FIN: CÓDIGO DE GOOGLE ANALYTICS>>>

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        history.pushState(null, '', newUrl);
        
        // ¡NUEVO! Cierra el offcanvas en móvil después de buscar
        const offcanvasEl = document.getElementById('offcanvasFilters');
        if (offcanvasEl) {
            const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (offcanvas) {
                offcanvas.hide();
            }
        }

        fetchAndDisplayResults();
    });

    typeSelect.addEventListener('change', () => {
        const selectedType = typeSelect.value;
        let subtypeUrl = '/api/properties/public-subtypes';
        if (selectedType) {
            subtypeUrl += `?type=${selectedType}`;
        }
        populateSelect(subtypeSelect, subtypeUrl); // Recarga los subtipos
    });
    
    // Cuando el usuario cambia el TIPO de propiedad...
    appliedFiltersContainer.addEventListener('click', function (event) {
        // Verificamos si el clic fue en un botón de cerrar
        if (event.target.classList.contains('btn-close')) {
            const key = event.target.dataset.key;
            const value = event.target.dataset.value;
            removeFilter(key, value);
        }
    });

    // --- EJECUCIÓN INICIAL ---
    initializePage();
});