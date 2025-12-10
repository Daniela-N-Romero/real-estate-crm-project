document.addEventListener('DOMContentLoaded', async () => {
    
    // --- CONFIGURACIÓN DE SUBTIPOS ---
    const subtypeOptions = {
        vivienda: [ {value: "casa", text: "Casa"}, {value: "departamento", text: "Departamento"}, {value: "ph", text: "PH"}, {value: "duplex", text: "Dúplex"}, {value: "quinta", text: "Quinta"} ],
        lote: [ {value: "terreno", text: "Terreno"}, {value: "campo", text: "Campo"}, {value: "lote_interno", text: "Lote en barrio cerrado"} ],
        industrial: [ {value: "galpon", text: "Galpón"}, {value: "nave_industrial", text: "Nave Industrial"}, {value: "deposito", text: "Depósito"}, {value: "lote_industrial", text: "Lote Industrial"} ],
        comercial: [ {value: "local", text: "Local"}, {value: "oficina", text: "Oficina"}, {value: "salon", text: "Salón"} ]
    };

    // --- 1. INICIALIZACIÓN DEL MAPA ---
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' });
    const satelliteLayer = L.tileLayer('http://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{ maxZoom: 20, subdomains:['mt0','mt1','mt2','mt3'] });

    const map = L.map('map-container', { center: [-34.77, -58.2], zoom: 13, layers: [streetLayer] });
    L.control.layers({ "Calle": streetLayer, "Satélite": satelliteLayer }).addTo(map);

    const markersGroup = L.markerClusterGroup({
        showCoverageOnHover: false, spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true, removeOutsideVisibleBounds: true
    });
    
    map.addLayer(markersGroup); 

    let allProperties = [];

    // Variables para los Sliders
    const sliderPrice = document.getElementById('sliderPrice');
    const sliderSurface = document.getElementById('sliderSurface');

    // --- 2. VALIDACIÓN DE OPCIONES (NUEVO) ---
    // Deshabilita los Tipos que no tienen propiedades cargadas
    function updateTypeOptions() {
        const typeSelect = document.getElementById('filterType');
        // Recorremos todas las opciones del select (menos la primera "Todos")
        Array.from(typeSelect.options).forEach(option => {
            if (option.value === "") return; 
            
            // Verificamos si existe al menos una propiedad con este tipo
            const exists = allProperties.some(p => p.type === option.value);
            
            if (!exists) {
                option.disabled = true;
                option.innerText += " (Sin datos)"; // Feedback visual
            } else {
                option.disabled = false;
                // Limpiamos el texto por si recargamos filtros
                option.innerText = option.innerText.replace(" (Sin datos)", "");
            }
        });
    }
    // Actualiza la disponibilidad de monedas según Tipo/Categoría/Subtipo seleccionados
    function updateCurrencyAvailability() {
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;
        const subtype = document.getElementById('filterSubtype').value;
        const currencySelect = document.getElementById('filterCurrency');

        // 1. Buscamos qué propiedades cumplen con Tipo/Cat/Subtipo (ignorando precio/superficie)
        const matches = allProperties.filter(p => {
            if (category && p.category?.toLowerCase() !== category) return false;
            if (type && p.type !== type) return false;
            if (subtype && p.subtype !== subtype) return false;
            return true;
        });

        // 2. Revisamos qué monedas existen en ese subgrupo
        const hasUSD = matches.some(p => p.currency === 'USD');
        const hasARS = matches.some(p => p.currency === 'ARS');

        // 3. Actualizamos el Select de Moneda
        Array.from(currencySelect.options).forEach(opt => {
            if (opt.value === "") return; // "Cualquiera" siempre activa

            let shouldDisable = false;
            if (opt.value === 'USD' && !hasUSD) shouldDisable = true;
            if (opt.value === 'ARS' && !hasARS) shouldDisable = true;

            if (shouldDisable) {
                opt.disabled = true;
                if (!opt.innerText.includes("(Sin datos)")) opt.innerText += " (Sin datos)";
            } else {
                opt.disabled = false;
                opt.innerText = opt.innerText.replace(" (Sin datos)", "");
            }
        });

        // 4. AUTO-CORRECCIÓN: Si la moneda seleccionada ya no es válida, volver a "Cualquiera"
        const currentSelected = currencySelect.value;
        const selectedOption = currencySelect.querySelector(`option[value="${currentSelected}"]`);
        if (currentSelected !== "" && selectedOption.disabled) {
            currencySelect.value = ""; // Reset a Cualquiera
            // Avisar visualmente (opcional)
            // alert("La moneda seleccionada no está disponible para este tipo de propiedad.");
            
            // Importante: Recalcular sliders y mapa porque cambiamos la moneda a la fuerza
            initSmartSliders(matches);
            applyFilters();
        }
    }


    // --- NUEVA FUNCIÓN: Validar TIPOS según CATEGORÍA ---
    function updateTypeAvailability() {
        const category = document.getElementById('filterCategory').value; // Venta/Alquiler
        const typeSelect = document.getElementById('filterType');

        // 1. Filtramos las propiedades que coinciden con la Categoría actual
        const matches = category === "" 
            ? allProperties 
            : allProperties.filter(p => p.category?.toLowerCase() === category);

        // 2. Revisamos qué TIPOS existen en ese subgrupo
        Array.from(typeSelect.options).forEach(opt => {
            if (opt.value === "") return; // Saltamos "Todos"

            const exists = matches.some(p => p.type === opt.value);

            if (!exists) {
                opt.disabled = true;
                if (!opt.innerText.includes("(Sin datos)")) opt.innerText += " (Sin datos)";
            } else {
                opt.disabled = false;
                opt.innerText = opt.innerText.replace(" (Sin datos)", "");
            }
        });
        
        // Auto-corrección: Si el Tipo seleccionado quedó deshabilitado, resetear
        if (typeSelect.value !== "" && typeSelect.options[typeSelect.selectedIndex].disabled) {
            typeSelect.value = "";
            // Disparar evento para actualizar subtipos y mapa
            typeSelect.dispatchEvent(new Event('change'));
        }
    }

    // --- NUEVA FUNCIÓN: Validar SUBTIPOS según Categoría y Tipo ---
    function updateSubtypeAvailability() {
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;
        const subtypeSelect = document.getElementById('filterSubtype');

        // Si no hay tipo seleccionado, el select está deshabilitado, no hacemos nada
        if (type === "") return;

        // 1. Filtramos universo posible (Propiedades con este Tipo + Categoría seleccionada)
        const matches = allProperties.filter(p => {
            if (p.type !== type) return false;
            if (category && p.category?.toLowerCase() !== category) return false;
            return true;
        });

        // 2. Revisamos opción por opción
        Array.from(subtypeSelect.options).forEach(opt => {
            if (opt.value === "") return; // Saltamos el "Todos"

            const exists = matches.some(p => p.subtype === opt.value);

            if (!exists) {
                opt.disabled = true;
                if (!opt.innerText.includes("(Sin datos)")) opt.innerText += " (Sin datos)";
            } else {
                opt.disabled = false;
                opt.innerText = opt.innerText.replace(" (Sin datos)", "");
            }
        });
        

        // Auto-corrección
        if (subtypeSelect.value !== "" && subtypeSelect.options[subtypeSelect.selectedIndex].disabled) {
            subtypeSelect.value = "";
            subtypeSelect.dispatchEvent(new Event('change'));
        }
    }

    // --- 2. FUNCIÓN: INICIALIZAR SLIDERS INTELIGENTES ---
    function initSmartSliders(data) {
        const currency = document.getElementById('filterCurrency').value;
        const sliderPriceEl = document.getElementById('sliderPrice');
        const priceHelp = document.getElementById('priceHelp');
        const priceLabel = document.getElementById('priceLabel');

        // A. CONFIGURACIÓN DEL SLIDER DE PRECIO
        if (sliderPriceEl.noUiSlider) sliderPriceEl.noUiSlider.destroy();

        if (currency === "") {
            // "Cualquiera" -> Slider Desactivado
            sliderPriceEl.classList.add('slider-disabled');
            if(priceHelp) priceHelp.style.display = 'block';
            if(priceLabel) priceLabel.textContent = "Inactivo";
            
            noUiSlider.create(sliderPriceEl, {
                start: [0, 100], connect: true, range: { 'min': 0, 'max': 100 }
            });
            sliderPriceEl.setAttribute('disabled', true);

        } else {
            // Moneda Elegida -> Slider Activo
            sliderPriceEl.classList.remove('slider-disabled');
            if(priceHelp) priceHelp.style.display = 'none';
            sliderPriceEl.removeAttribute('disabled');

            // Filtramos SOLO las propiedades de esa moneda para calcular el máximo real
            const relevantProps = data.filter(p => p.currency === currency);
            const prices = relevantProps.map(p => parseFloat(p.price) || 0);
            
            const maxPrice = prices.length > 0 ? Math.max(...prices) : 10000; 

            noUiSlider.create(sliderPriceEl, {
                start: [0, maxPrice],
                connect: true,
                range: { 'min': 0, 'max': maxPrice },
                step: 100,
                format: { to: v => Math.round(v), from: v => Number(v) }
            });

            sliderPriceEl.noUiSlider.on('update', (values) => {
                if(priceLabel) priceLabel.textContent = `$${Math.round(values[0])} - $${Math.round(values[1])}`;
            });
            sliderPriceEl.noUiSlider.on('change', applyFilters);
        }

        // B. CONFIGURACIÓN DEL SLIDER DE SUPERFICIE
        // Calculamos superficie máxima basada en los datos recibidos (que ya vienen filtrados por tipo)
        const surfaces = data.map(p => parseFloat(p.totalSurface) || 0);
        const maxSurface = surfaces.length > 0 ? Math.max(...surfaces) : 1000;

        if (sliderSurface.noUiSlider) sliderSurface.noUiSlider.destroy();

        noUiSlider.create(sliderSurface, {
            start: [0, maxSurface],
            connect: true,
            range: { 'min': 0, 'max': maxSurface },
            step: 10
        });

        sliderSurface.noUiSlider.on('update', (values) => {
            const label = document.getElementById('surfaceLabel');
            if(label) label.textContent = `${Math.round(values[0])} m² - ${Math.round(values[1])} m²`;
        });
        sliderSurface.noUiSlider.on('change', applyFilters);
    }

    // --- 3. ICONOS BOOTSTRAP ---
    const createBootstrapPin = (color) => {
        return L.divIcon({
            className: 'bs-pin',
            html: `<div style="position: relative; text-align: center; filter: drop-shadow(0px 5px 4px rgba(0,0,0,0.3));">
                    <i class="bi bi-geo-alt-fill" style="font-size: 45px; color: ${color}; display: block;"></i>
                </div>`,
            iconSize: [45, 45], iconAnchor: [22, 45], popupAnchor: [0, -45]
        });
    };
    const iconBlue = createBootstrapPin('#0d6efd');
    const iconOrange = createBootstrapPin('#fd7e14');

    // --- 4. RENDERIZADO ---
    function renderMapPoints(propertiesToRender) {
        markersGroup.clearLayers();
        const noResultsMsg = document.getElementById('noResultsMessage');


        // --- LÓGICA DEL CARTEL DE "NO HAY PROPIEDADES"---
        if (propertiesToRender.length === 0) {
            if (noResultsMsg) noResultsMsg.style.display = 'block';
            return; // Cortamos aquí, no hay nada que pintar
        } else {
            if (noResultsMsg) noResultsMsg.style.display = 'none';
        }
        // -------------------------

        let validPoints = 0;
        propertiesToRender.forEach(prop => {
            const lat = parseFloat(prop.latitude);
            const lng = parseFloat(prop.longitude);
            if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;
            validPoints++;

            const isColleague = prop.propertySource === 'colega' || (prop.sourceColleague && prop.sourceColleague.agencyName);
            const icon = isColleague ? iconOrange : iconBlue;
            
            // Badge
            let badgeContent = '<span class="badge bg-primary mb-1">MS Propiedades</span>';
            if (isColleague) {
                const sc = prop.sourceColleague;
                let name = sc?.agencyName || sc?.fullName || 'Colega';
                badgeContent = `<span class="badge bg-warning text-dark mb-1">${name}</span>`;
            }

            const imageSrc = (prop.images && prop.images.length > 0) ? prop.images[0] : null;
            const image = imageSrc 
                ? `<img src="${imageSrc}" style="width:100%; height:140px; object-fit:cover; border-radius:4px; margin-bottom:8px;">` 
                : `<div class="bg-light d-flex align-items-center justify-content-center" style="height:140px; border-radius:4px; margin-bottom:8px;"><span class="text-muted">Sin foto</span></div>`;
            const status = prop.isPublished ? '<span class="badge bg-success">Publicada</span>' : '<span class="badge bg-secondary">Borrador</span>';
            
            // Botones
            let buttonsHtml = `<div class="d-flex gap-1 mt-2"><a href="/admin/property_form.html?id=${prop.id}" class="btn btn-sm btn-primary flex-fill"><i class="bi bi-pencil-square text-white"></i></a>`;
            if (prop.isPublished) {
                const slug = prop.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                buttonsHtml += `<a href="/propiedad/${prop.id}/${slug}" target="_blank" class="btn btn-sm btn-outline-dark"><i class="bi bi-eye"></i></a>`;
            }
            if (prop.pdfUrl) buttonsHtml += `<a href="${prop.pdfUrl}" target="_blank" class="btn btn-sm btn-danger text-white"><i class="bi bi-file-earmark-pdf"></i></a>`;
            buttonsHtml += `</div>`;

            const popupContent = `<div style="width: 220px; font-family: sans-serif;">
                    <div class="position-relative">${image}<div style="position: absolute; top: 5px; right: 5px;">${badgeContent}</div></div>
                    <h6 class="fw-bold mt-1 mb-1 text-truncate" style="font-size: 14px;">${prop.name}</h6>
                    <div class="text-success fw-bold mb-1" style="font-size: 16px;">${prop.currency} ${prop.price || 'Consular'}</div>
                    <div class="small text-muted mb-1"><i class="bi bi-geo-alt"></i> ${prop.address || 'Sin dirección'}</div>
                    <div class="d-flex justify-content-between align-items-center"><small class="text-muted">${prop.totalSurface ? prop.totalSurface + ' m²' : ''}</small>${status}</div>
                    ${buttonsHtml}
                </div>`;

            const marker = L.marker([lat, lng], { icon: icon }).bindPopup(popupContent);
            markersGroup.addLayer(marker);
        });

        if (validPoints > 0) {
            setTimeout(() => { try { map.fitBounds(markersGroup.getBounds(), { padding: [50, 50] }); } catch(e) {} }, 200);
        }
    }

    // --- 5. LÓGICA DE FILTRADO Y EVENTOS ---

    // Función auxiliar: Filtra datos solo por Dropdowns (Tipo, Categ, Subtipo)
    // ESTA ES LA FUNCIÓN QUE FALTABA Y CAUSABA EL ERROR
    function getDataFilteredByDropdowns() {
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;
        const subtype = document.getElementById('filterSubtype').value;
        
        return allProperties.filter(p => {
            if (category && p.category?.toLowerCase() !== category) return false;
            if (type && p.type !== type) return false;
            if (subtype && p.subtype !== subtype) return false;
            return true;
        });
    }

    // Función Principal de Filtrado
    function applyFilters() {
        const category = document.getElementById('filterCategory').value;
        const type = document.getElementById('filterType').value;
        const currency = document.getElementById('filterCurrency').value;
        const subtype = document.getElementById('filterSubtype').value;
        
        let priceRange = [0, Infinity];
        // Solo usamos el slider de precio si hay moneda
        if (currency !== "" && sliderPrice.noUiSlider) {
            priceRange = sliderPrice.noUiSlider.get();
        }
        
        let surfaceRange = [0, Infinity];
        if (sliderSurface.noUiSlider) {
            surfaceRange = sliderSurface.noUiSlider.get();
        }

        const filtered = allProperties.filter(p => {
            if (category && p.category?.toLowerCase() !== category) return false;
            if (type && p.type !== type) return false;
            if (subtype && p.subtype !== subtype) return false;
            
            // Filtro Moneda (Estricto)
            if (currency && p.currency !== currency) return false;

            // Filtro Precio (Solo si hay moneda)
            if (currency !== "") {
                const price = parseFloat(p.price) || 0;
                if (price < parseFloat(priceRange[0]) || price > parseFloat(priceRange[1])) return false;
            }

            // Filtro Superficie
            const surface = parseFloat(p.totalSurface) || 0;
            if (surface < parseFloat(surfaceRange[0]) || surface > parseFloat(surfaceRange[1])) return false;

            return true;
        });

        renderMapPoints(filtered);
    }

// --- GESTIÓN DE EVENTOS (LISTENERS) ---

    // 1. CAMBIO DE TIPO (Genera lista -> Valida Subtipos -> Valida Moneda -> Sliders -> Mapa)
    document.getElementById('filterType').addEventListener('change', function() {
        const type = this.value;
        const subtypeSelect = document.getElementById('filterSubtype');
        
        // A. Regenerar lista de Subtipos (Reset puro)
        subtypeSelect.innerHTML = '<option value="">Todos</option>';
        if (type && subtypeOptions[type]) {
            subtypeSelect.disabled = false;
            subtypeOptions[type].forEach(opt => {
                const o = document.createElement('option'); o.value = opt.value; o.textContent = opt.text; subtypeSelect.appendChild(o);
            });
        } else { 
            subtypeSelect.disabled = true; 
            subtypeSelect.innerHTML = '<option value="">Elija Tipo primero</option>';
        }

        // B. Validaciones en Cascada
        updateSubtypeAvailability(); // <--- NUEVO: Deshabilita subtipos vacíos para este tipo/categoría
        updateCurrencyAvailability();

        // C. Sliders y Mapa
        const relevantData = getDataFilteredByDropdowns();
        initSmartSliders(relevantData);
        applyFilters(); 
    });

    // 2. CAMBIO DE CATEGORÍA (Valida Tipos -> Valida Subtipos -> Valida Moneda)
    document.getElementById('filterCategory').addEventListener('change', () => {
        updateTypeAvailability();    // 1. ¿Qué tipos hay para esta operación?
        updateSubtypeAvailability(); // 2. ¿Qué subtipos quedan? (NUEVO)
        updateCurrencyAvailability();// 3. ¿Qué monedas quedan?
        
        const relevantData = getDataFilteredByDropdowns();
        initSmartSliders(relevantData);
        applyFilters();
    });

    // 3. CAMBIO DE SUBTIPO
    document.getElementById('filterSubtype').addEventListener('change', () => {
        updateCurrencyAvailability();
        
        const relevantData = getDataFilteredByDropdowns();
        initSmartSliders(relevantData);
        applyFilters();
    });

    // 4. CAMBIO DE MONEDA
    document.getElementById('filterCurrency').addEventListener('change', () => {
        const relevantData = getDataFilteredByDropdowns();
        initSmartSliders(relevantData);
        applyFilters();
    });


    // C. LIMPIAR
    document.getElementById('btnClearFilters').addEventListener('click', () => {
        document.getElementById('mapFiltersForm').reset();
        const subtypeSelect = document.getElementById('filterSubtype');
        subtypeSelect.innerHTML = '<option value="">Elija Tipo primero</option>';
        subtypeSelect.disabled = true;
        initSmartSliders(allProperties);
        renderMapPoints(allProperties);
        updateTypeOptions(); // Restaurar textos de tipos
    });

    // --- 7. CARGA ---
    try {
        const token = sessionStorage.getItem('token');
        if (!token) { window.location.href = '/admin/login.html'; return; }

        const res = await fetch('/api/properties/all-for-map', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 401) { alert("Sesión expirada."); window.location.href = '/admin/login.html'; return; }
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        
        const data = await res.json();
        if (!Array.isArray(data)) return;

        allProperties = data;
        
        updateCurrencyAvailability();
        initSmartSliders(allProperties);
        renderMapPoints(allProperties);

        if (allProperties.length > 0) {
            setTimeout(() => {
                const bounds = markersGroup.getBounds();
                if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
            }, 500);
        }

    } catch (error) { console.error("Error mapa:", error); }
});