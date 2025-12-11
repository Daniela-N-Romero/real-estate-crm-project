// admin/js/dashboard.js
let allProperties = [];

// NUEVA VARIABLE GLOBAL PARA EL FILTRO DE ORIGEN
let currentSourceFilter = 'propia'; // Por defecto: Cartera Propia

// --- NUEVA FUNCIÓN: Filtrar por Origen (Propia vs Colega) ---
function filterPropertiesBySource(source) {
    currentSourceFilter = source;
    
    // Actualizar botones visualmente (Azul/Gris)
    const btnMS = document.getElementById('tab-ms');
    const btnCol = document.getElementById('tab-colleagues');
    
    if (source === 'propia') {
        btnMS.classList.add('active', 'text-primary');
        btnMS.classList.remove('text-secondary');
        
        btnCol.classList.remove('active', 'text-primary');
        btnCol.classList.add('text-secondary');
    } else {
        btnCol.classList.add('active', 'text-primary');
        btnCol.classList.remove('text-secondary');
        
        btnMS.classList.remove('active', 'text-primary');
        btnMS.classList.add('text-secondary');
    }

    // Volver a aplicar orden y búsqueda con el nuevo filtro de origen
    applySortAndGroup();
}

// --- FUNCIONES AUXILIARES PARA MODALES PERSONALIZADOS ---
function customAlert(message, title = 'Atención') {
    const modal = document.getElementById('custom-alert-modal');
    document.getElementById('alert-title').textContent = title;
    document.getElementById('alert-message').textContent = message;
    modal.style.display = 'flex';
    return new Promise(resolve => {
        document.getElementById('alert-ok-btn').onclick = () => {
            modal.style.display = 'none';
            resolve();
        };
    });
}

function customConfirm(message, title = '¿Estás seguro?') {
    const modal = document.getElementById('custom-confirm-modal');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    modal.style.display = 'flex';
    return new Promise(resolve => {
        document.getElementById('confirm-ok-btn').onclick = () => {
            modal.style.display = 'none';
            resolve(true);
        };
        document.getElementById('confirm-cancel-btn').onclick = () => {
            modal.style.display = 'none';
            resolve(false);
        };
    });
}
// --- FIN DE FUNCIONES DE MODALES ---

// --- LÓGICA DE LOGOUT ---
document.getElementById('logoutBtn').addEventListener('click', async function() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok) {
            await customAlert('Sesión cerrada exitosamente.', 'Cierre de Sesión');
            sessionStorage.removeItem('token');
            window.location.href = data.redirectTo;
        } else {
            await customAlert('Hubo un problema al cerrar la sesión: ' + (data.message || 'Error desconocido.'), 'Error de Sesión');
        }
    } catch (error) {
        console.error('Error al conectar con el servidor para cerrar sesión:', error);
        await customAlert('No se pudo conectar con el servidor para cerrar sesión. Error de red.', 'Error de Conexión');
    }
});
// --- FIN LÓGICA DE LOGOUT ---


/**
 * Renders the properties into the table, with optional grouping.
 * @param {Array} propertiesToRender - The sorted list of properties to display.
 */
function renderTable(propertiesToRender) {
    const tableBody = document.querySelector('#propertiesTable tbody');
    tableBody.innerHTML = '';
    const groupByValue = document.getElementById('group-by').value;

    const buildRow = (property) => {
        const row = tableBody.insertRow();
         // Celda 0: Imagen (Portada)
        const imageCell = row.insertCell(0);
        imageCell.classList.add('dashboard-thumbnail-cell');
        const coverImageUrl = (property.images && property.images.length > 0) ? property.images[0] : '/assets/images/placeholder.jpg';
        imageCell.innerHTML = `<img src="${coverImageUrl}" alt="Miniatura" class="dashboard-thumbnail">`;

        // Celda 1: Nombre
        const nameCell = row.insertCell(1);
        // Generamos el slug (parte de la URL amigable)
        const safeName = property.name || 'Propiedad sin nombre';
        //Insertamos el HTML del enlace
        
       if (property.isPublished) {
            // CASO A: PUBLICADA -> Generamos Enlace
            const slug = safeName.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]+/g, '');
            const publicUrl = `/propiedad/${property.id}/${slug}`;

            nameCell.innerHTML = `
                <a href="${publicUrl}" target="_blank" class="fw-bold text-primary text-decoration-underline" title="Ver publicación en vivo">
                    ${safeName} <i class="bi bi-box-arrow-up-right" style="font-size: 0.8em;"></i>
                </a>
            `;
        } else {
            // CASO B: BORRADOR -> Texto plano (Gris)
            nameCell.innerHTML = `
                <span class="fw-bold text-secondary" title="Esta propiedad no es pública">
                    ${safeName}
                </span>
            `;
        }
        nameCell.setAttribute('data-label', 'Nombre:');

        // Celda 2: Dirección (la ocultaremos en móvil, pero mantenemos el dato)
        row.insertCell(2).textContent = property.address || 'N/A';
        row.cells[2].setAttribute('data-label', 'Dirección:');

        // Celda 3: Localidad
        row.insertCell(3).textContent = property.locality || 'N/A';
        row.cells[3].setAttribute('data-label', 'Localidad:');

        // Celda 4: Moneda (la uniremos con el precio)
        row.insertCell(4).textContent = property.currency || 'N/A';
        row.cells[4].setAttribute('data-label', 'Moneda:');
        
        // Celda 5: Precio
        const formattedPrice = property.price ? `${property.price.toLocaleString('es-AR')}` : 'Consultar';
        row.insertCell(5).textContent = formattedPrice;
        row.cells[5].setAttribute('data-label', 'Precio:');

        // Celda 6: Tipo
        row.insertCell(6).textContent = property.type || 'N/A';
        row.cells[6].setAttribute('data-label', 'Tipo:');

        // Celda 7: Categoría
        row.insertCell(7).textContent = property.category || 'N/A';
        row.cells[7].setAttribute('data-label', 'Categoría:');

        // Celda 8: Video
        const videoCell = row.insertCell(8);
        videoCell.innerHTML = property.videoUrl ? '✔️' : '❌';
        videoCell.className = property.videoUrl ? 'text-success' : 'text-danger';
        videoCell.style.textAlign = 'center';
        videoCell.setAttribute('data-label', 'Video:');

        // Celda 9: PDF
        const pdfCell = row.insertCell(9);
        pdfCell.innerHTML = property.pdfUrl ? '✔️' : '❌';
        pdfCell.className = property.pdfUrl ? 'text-success' : 'text-danger';
        pdfCell.style.textAlign = 'center';
        pdfCell.setAttribute('data-label', 'PDF:');
        
        // Celda 10: Publicado
        const publishedCell = row.insertCell(10);
        publishedCell.setAttribute('data-label', 'Estado:');
        const publishButton = document.createElement('button');
        publishButton.classList.add('publish-toggle-btn');
        publishButton.textContent = property.isPublished ? 'Publicada' : 'Borrador';
        publishButton.style.backgroundColor = property.isPublished ? '#28a745' : '#ffc107';
        publishButton.style.color = 'white';
        publishButton.style.border = 'none';
        publishButton.onclick = () => togglePublishStatus(property.id, property.isPublished);
        publishedCell.appendChild(publishButton);

        // Celda 11: Acciones
        const actionsCell = row.insertCell(11);
        actionsCell.setAttribute('data-label', 'Acciones:');
        actionsCell.classList.add('action-buttons');
        // Botón Ver / Editar
        const editButton = document.createElement('a');
        editButton.href = `/admin/property_form.html?id=${property.id}`;
        editButton.innerHTML = '<button class="edit-btn">Ver / Editar</button>';
        actionsCell.appendChild(editButton);
        // Botón Eliminar
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Eliminar';
        deleteButton.classList.add('delete-btn');
        deleteButton.onclick = () => confirmDelete(property.id);
        actionsCell.appendChild(deleteButton);
    };

    if (propertiesToRender.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="12" style="text-align: center;">No hay propiedades registradas.</td></tr>';
        return;
    }

    if (groupByValue === 'none') {
        propertiesToRender.forEach(buildRow);
    } else {
        const grouped = propertiesToRender.reduce((acc, prop) => {
            const key = prop[groupByValue] || 'Sin categoría';
            if (!acc[key]) acc[key] = [];
            acc[key].push(prop);
            return acc;
        }, {});

        // Get all the group names (e.g., ['Venta', 'Alquiler'])
        const groupNames = Object.keys(grouped);

        // Sort the group names alphabetically
        groupNames.sort((a, b) => a.localeCompare(b));

        // Loop through the now-sorted names to build the table
        groupNames.forEach(groupName => {
                const headerRow = tableBody.insertRow();
                headerRow.className = 'group-header-row'; // <-- Añadimos una clase a la fila
                headerRow.innerHTML = `<th colspan="12">${groupName}</th>`; // Ya no necesitamos la clase en el <th>
                grouped[groupName].forEach(buildRow);
        });
    }
}

/**
 * Applies the current sort and group settings and re-renders the table.
 */
function applySortAndGroup() {

const searchBar = document.getElementById('search-bar');
    const searchText = searchBar ? searchBar.value.toLowerCase() : '';
    
    // FILTRADO MAESTRO
    let propertiesToDisplay = allProperties.filter(property => {
        // 1. Filtro de Origen (Propia vs Colega) -> LÓGICA ROBUSTA
        let propSource = property.propertySource || 'propia'; // Si es null, asumimos propia
        
        // Corrección para propiedades viejas que tengan null pero tengan colegaId
        if (!property.propertySource && property.colleagueId) propSource = 'colega';

        if (propSource !== currentSourceFilter) {
            return false; // Si no coincide con la pestaña actual, chau
        }

        // 2. Filtro de Búsqueda (Nombre)
        const propertyName = property.name || ''; 
        return propertyName.toLowerCase().includes(searchText);
    });

    const sortBySelect = document.getElementById('sort-by');
    const [sortBy, direction] = sortBySelect.value.split('_');

    propertiesToDisplay.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'price') {
            valA = parseFloat(valA) || 0;
            valB = parseFloat(valB) || 0;
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable(propertiesToDisplay);
}

/**
 * Fetches all properties from the server ONE TIME.
 */
async function fetchProperties() {
    const tableBody = document.querySelector('#propertiesTable tbody');
    try {
        const response = await fetch('/api/properties', {
            headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') }
        });
        if (response.status === 401) {
            window.location.href = '/admin/login.html';
            return;
        }
        if (!response.ok) throw new Error('Error al obtener las propiedades.');
        
        allProperties = await response.json();
        applySortAndGroup();

        const searchBar = document.getElementById('search-bar');
        if (searchBar) {
            searchBar.disabled = false;
            searchBar.placeholder = "Escriba para filtrar...";
        }

    } catch (error) {
        console.error('Error al cargar propiedades:', error);
        tableBody.innerHTML = `<tr><td colspan="12">Error al cargar las propiedades.</td></tr>`;
    }
}



async function togglePublishStatus(propertyId, currentStatus) {
    const newStatus = !currentStatus;
    try {
        const response = await fetch(`/api/properties/${propertyId}/toggle-published`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem('token')
            },
            body: JSON.stringify({ isPublished: newStatus })
        });
        if (response.ok) {
            await customAlert(`Propiedad ${newStatus ? 'publicada' : 'despublicada'} con éxito.`);
            fetchProperties();
        } else {
            const errorData = await response.json();
            await customAlert('Error al cambiar el estado de publicación: ' + (errorData.message || 'Desconocido'));
        }
    } catch (error) {
        console.error('Error de red al cambiar estado de publicación:', error);
        await customAlert('Error de conexión al cambiar el estado de publicación.');
    }
}

/**
 * Confirma y maneja la eliminación de una propiedad.
 * @param {number} propertyId - El ID de la propiedad a eliminar.
 */
async function confirmDelete(propertyId) {
    // 1. Pide confirmación usando el modal personalizado
    const userConfirmed = await customConfirm('¿Estás segura de que deseas eliminar esta propiedad? Esta acción no se puede deshacer.');

    if (!userConfirmed) {
        return; // El usuario canceló
    }

    // 2. Si el usuario confirmó, procede a eliminar
    try {
        const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('token')
            }
        });

        if (response.ok) {
            await customAlert('Propiedad eliminada con éxito.');
            // 3. Recarga la lista de propiedades para reflejar el cambio
            fetchProperties(); 
        } else {
            const errorData = await response.json();
            await customAlert('Error al eliminar la propiedad: ' + (errorData.message || 'Error desconocido.'));
        }
    } catch (error) {
        console.error('Error de red al eliminar la propiedad:', error);
        await customAlert('Error de conexión al eliminar la propiedad.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Connect the new dropdowns to the function
    document.getElementById('group-by').addEventListener('change', applySortAndGroup);
    document.getElementById('sort-by').addEventListener('change', applySortAndGroup);
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', applySortAndGroup);
        searchBar.disabled = true; 
        searchBar.placeholder = "Cargando propiedades...";
    }
    
    // Initial data fetch
    fetchProperties();

});