// admin/js/property_form.js

const subtypeOptions = {
  vivienda: [
    { value: "", text: "Seleccione un Subtipo" },
    { value: "casa", text: "Casa" },
    { value: "departamento", text: "Departamento" },
    { value: "ph", text: "PH" },
    { value: "duplex", text: "Dúplex" },
    { value: "quinta", text: "Quinta" },
  ],
  lote: [
    { value: "", text: "Seleccione un Subtipo" },
    { value: "terreno", text: "Terreno" },
    { value: "campo", text: "Campo" },
    { value: "lote_interno", text: "Lote en barrio cerrado" },
  ],
  industrial: [
    { value: "", text: "Seleccione un Subtipo" },
    { value: "galpon", text: "Galpón" },
    { value: "nave_industrial", text: "Nave Industrial" },
    { value: "deposito", text: "Depósito" },
    { value: "lote_industrial", text: "Lote (zona industrial)" },
    { value: "lote_parque_industrial", text: "Lote (parque industrial)" },
  ],
  comercial: [
    { value: "", text: "Seleccione un Subtipo" },
    { value: "local", text: "Local" },
    { value: "oficina", text: "Oficina" },
    { value: "salon", text: "Salón" },
  ],
  "": [{ value: "", text: "Seleccione primero un Tipo" }],
};

let accumulatedFiles = [];

// admin/js/property_form.js

// ... (tus opciones de subtipo) ...

async function loadSelectOptions() {
    try {
        const token = sessionStorage.getItem('token');
        const headers = { 'Authorization': 'Bearer ' + token };

        // 1. Cargar Usuarios (Equipo)
        const agentsResp = await fetch('/api/auth/agents', { headers });
        const agents = await agentsResp.json();
        const agentSelect = document.getElementById('agentId');
        if (agentSelect) {
            agentSelect.innerHTML = '<option value="">Seleccione un Agente</option>';
            agents.forEach(agent => {
                const option = document.createElement('option');
                option.value = agent.id;
                option.textContent = agent.fullName;
                agentSelect.appendChild(option);
            });
        }

        // 2. Cargar Propietarios
        const ownersResp = await fetch('/api/auth/owners', { headers });
        const owners = await ownersResp.json();

        const ownerSelect = document.getElementById('ownerId');
        
        // Capturamos los elementos de vista previa
        const phoneInput = document.getElementById('ownerPhonePreview'); 
        const notesInput = document.getElementById('ownerNotesPreview'); // Asegúrate de capturar este

        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">Seleccione un Propietario</option>';
            owners.forEach(owner => {
                const option = document.createElement('option');
                option.value = owner.id;
                option.textContent = owner.fullName;
                
                // GUARDAMOS LOS DATOS EN EL DATASET DE LA OPCIÓN
                option.dataset.phone = owner.phoneNumber || "";
                option.dataset.notes = owner.privateNotes || ""; // <--- ¡CRUCIAL!
                
                ownerSelect.appendChild(option);
            });

            // Evento al cambiar selección
            ownerSelect.addEventListener('change', function() {
                const selected = this.options[this.selectedIndex];
                
                // Llenar teléfono
                if(phoneInput) {
                    phoneInput.value = selected.dataset.phone || "Sin teléfono";
                    // Estilos opcionales que tenías
                    if(!selected.dataset.phone) {
                        phoneInput.style.backgroundColor = "#dee2e2ff"; 
                        phoneInput.style.color = "#721c24";
                    } else {
                        phoneInput.style.backgroundColor = "#e9ecef"; // Gris claro
                        phoneInput.style.color = "#495057"; // Texto normal
                    }
                }

                // Llenar Notas (CORREGIDO)
                if(notesInput) {
                    notesInput.value = selected.dataset.notes || "Sin notas registradas.";
                    notesInput.style.backgroundColor = "#e9ecef"; // Gris claro
                    notesInput.style.color = "#495057"; // Texto normal
                }
            });
        }

    } catch (error) {
        console.error("Error cargando listas:", error);
        showCustomAlert(
            'Error general.', 
            'Error al cargar las listas de usuarios y propietarios.'
        );
    }
}
// --- FUNCIÓN DE UTILIDAD: ALERTA PERSONALIZADA ---
function showCustomAlert(title, message) {
    const modal = document.getElementById('custom-alert-modal');
    const titleEl = document.getElementById('alert-title');
    const msgEl = document.getElementById('alert-message');
    const btn = document.getElementById('alert-ok-btn');

    if (modal && titleEl && msgEl) {
        titleEl.textContent = title;
        msgEl.innerText = message; // innerText respeta saltos de línea
        modal.style.display = 'flex'; // Mostramos el modal
        
        // Configurar el botón para cerrar
        btn.onclick = function() {
            modal.style.display = 'none';
        };
    } else {
        // Fallback por si acaso no encuentra el HTML
        alert(message);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
  const propertyForm = document.getElementById("propertyForm");
  if (!propertyForm) return;

  // --- FORM ELEMENT REFERENCES ---
  const typeSelect = document.getElementById("type");
  const subtypeSelect = document.getElementById("subtype");
  const imagesInput = document.getElementById("images");
  const imagePreviewContainer = document.getElementById("image-preview");
  const pdfInput = document.getElementById("pdf");
  const pdfPreviewContainer = document.getElementById("pdf-preview");
  const viviendaFields = document.getElementById("viviendaFields");
  const loteFields = document.getElementById("loteFields");
  const industrialFields = document.getElementById("industrialFields");
  const comercialFields = document.getElementById("comercialFields");
  const amenitiesSection = document.getElementById("amenitiesSection");

  await loadSelectOptions();

  // Initialize Drag-and-Drop
  if (imagePreviewContainer) {
    new Sortable(imagePreviewContainer, {
      animation: 150,
      ghostClass: "sortable-ghost",
    });
    
  }

  // --- HELPER FUNCTIONS ---
  function populateSubtypeSelect(selectedType, selectedSubtype = "") {
    subtypeSelect.innerHTML = "";
    const options = subtypeOptions[selectedType] || subtypeOptions[""];
    options.forEach((optionData) => {
      const option = document.createElement("option");
      option.value = optionData.value;
      option.textContent = optionData.text;
      if (optionData.value === selectedSubtype) {
        option.selected = true;
      }
      subtypeSelect.appendChild(option);
    });
  }

  function toggleSpecificFields() {
    // Ocultamos todos los campos específicos primero
    if (viviendaFields) viviendaFields.style.display = "none";
    if (loteFields) loteFields.style.display = "none";
    if (industrialFields) industrialFields.style.display = "none";
    if (comercialFields) comercialFields.style.display = "none";
    if (amenitiesSection) amenitiesSection.style.display = "none";

    const selectedType = typeSelect.value;

    if (selectedType === "vivienda") {
      if (amenitiesSection) amenitiesSection.style.display = "block";
    }

    switch (selectedType) {
      case "vivienda":
        if (viviendaFields) viviendaFields.style.display = "block";
        break;
      case "lote":
        if (loteFields) loteFields.style.display = "block";
        break;
      case "industrial":
        if (industrialFields) industrialFields.style.display = "block";
        break;
      case "comercial":
        if (comercialFields) comercialFields.style.display = "block";
        break;
    }
  }

  /**
   * Creates a preview thumbnail for an image (either an existing URL or a new File object)
   * and adds it to the preview container.
   */

  function createPreviewThumbnail(fileOrUrl, isExisting = false) {
    const item = document.createElement("div");
    item.className = "image-item";

    const img = document.createElement("img");
    item.appendChild(img);

    if (isExisting) {
      img.src = fileOrUrl;
      item.dataset.existingUrl = fileOrUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => (img.src = e.target.result);
      reader.readAsDataURL(fileOrUrl);
      item.dataset.fileName = fileOrUrl.name;
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-img-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.type = "button";
    deleteBtn.onclick = () => {
      if (isExisting) {
        const filesToDeleteInput = document.getElementById("filesToDelete");
        const urlsToDelete = filesToDeleteInput.value
          ? JSON.parse(filesToDeleteInput.value)
          : [];
        if (!urlsToDelete.includes(fileOrUrl)) {
          urlsToDelete.push(fileOrUrl);
        }
        filesToDeleteInput.value = JSON.stringify(urlsToDelete);
      } else {
        accumulatedFiles = accumulatedFiles.filter(
          (f) => f.name !== fileOrUrl.name
        );
      }
      item.remove();
    };
    item.appendChild(deleteBtn);
    imagePreviewContainer.appendChild(item);
  }

  /**
   * Handles new file selections, adding them to our list instead of replacing them.
   */

  function handleFileSelection(event) {
    const newFiles = Array.from(event.target.files);
    newFiles.forEach((file) => {
      if (!accumulatedFiles.some((f) => f.name === file.name)) {
        accumulatedFiles.push(file);
        createPreviewThumbnail(file, false);
      }
    });
    event.target.value = ""; // Clear the input to allow re-selecting the same file
  }

  ////////////////////////////

  if (imagesInput) {
    imagesInput.addEventListener("change", handleFileSelection);
  }

  if (pdfInput && pdfPreviewContainer) {
    pdfInput.addEventListener("change", () => {
      // Clear any previous PDF preview
      pdfPreviewContainer.innerHTML = "";

      if (pdfInput.files.length > 0) {
        const fileName = pdfInput.files[0].name;
        // Create a simple text preview for the selected PDF
        const previewElement = document.createElement("div");
        previewElement.className = "image-item"; // Reuse class for styling
        previewElement.textContent = `Archivo: ${fileName}`;
        pdfPreviewContainer.appendChild(previewElement);
      }
    });
  }

  ////////////////////////////

async function loadPropertyForEdit(propertyId) {
    try {
        // CARGAR DATOS MAESTROS PRIMERO (Para que los selects existan)
        // Esperamos a que los colegas estén cargados antes de pedir la propiedad
        await loadColleagues();
        const response = await fetch(`/api/properties/${propertyId}`, {
            headers: { Authorization: "Bearer " + sessionStorage.getItem("token") },
        });
        if (!response.ok) throw new Error("No se pudo cargar la propiedad.");
        const property = await response.json();

        // 1. Estado de Publicación
        if (property.isPublished) {
            document.getElementById("isPublishedPublished").checked = true;
        } else {
            document.getElementById("isPublishedDraft").checked = true;
        }

        // 2. Campos básicos
        const fields = [
            "name", "address", "locality", "neighbourhood",
            "totalSurface", "coveredSurface", "description",
            "privateNotes", "videoUrl", 
            "type", "category", "currency", "price", "agentId",
            "latitude", "longitude"
        ];
        
        fields.forEach((field) => {
            const element = document.getElementById(field);
            if (element) element.value = property[field] || "";
        });

        // 3. LOGICA CRÍTICA: Restaurar si es Propia o Colega
        // Verificamos el campo propertySource que creamos en la base de datos
        if (property.propertySource === 'colega') {
            const rb = document.getElementById('sourceColleague');
            if(rb) {
                rb.checked = true;
                // Importante: Llamamos a toggleSource para que muestre la sección correcta visualmente
                toggleSource(); 
                // Ahora que la sección es visible, cargamos el ID del colega
                document.getElementById('colleagueId').value = property.colleagueId || "";
                // DISPARAR EVENTO CHANGE MANUALMENTE
                // Esto es vital para que se llenen los campos grises (teléfono, notas)
                document.getElementById('colleagueId').dispatchEvent(new Event('change'));
            }
        } else {
            // Asumimos 'ms_propia' por defecto
            const rb = document.getElementById('sourceMS');
            if(rb) {
                rb.checked = true;
                toggleSource();
                document.getElementById('ownerId').value = property.ownerId || "";
                // Disparamos el evento change para que cargue el teléfono del dueño
                document.getElementById('ownerId').dispatchEvent(new Event('change'));
            }
        }

        // 4. Llenar subtipo y mostrar/ocultar campos específicos
        populateSubtypeSelect(property.type, property.subtype);
        toggleSpecificFields();

        // 5. Cargar Características Específicas
        if (property.specificCharacteristics) {
            const specChars = property.specificCharacteristics;
            let prefix = "";
            switch (property.type) {
                case "vivienda": prefix = "v_"; break;
                case "lote": prefix = "l_"; break;
                case "industrial": prefix = "i_"; break;
                case "comercial": prefix = "c_"; break;
            }

            if (prefix) {
                for (const key in specChars) {
                    const element = document.getElementById(`${prefix}${key}`);
                    if (element) {
                        if (element.type === "checkbox") {
                            element.checked = specChars[key];
                        } else {
                            element.value = specChars[key];
                        }
                    }
                }
            }
        }

        // 6. Cargar Amenities
        document.querySelectorAll('input[name="amenities"]').forEach((cb) => (cb.checked = false));
        if (property.amenities && property.amenities.length > 0) {
             // ... (tu lógica de amenities existente está bien) ...
             // (Solo asegúrate de que parsea correctamente JSON si viene como string)
            const cleanedAmenities = property.amenities.flatMap((item) => {
                 if (typeof item === "string" && item.startsWith("[")) {
                     try { return JSON.parse(item); } catch (e) { return []; }
                 }
                 return item;
            });
            [...new Set(cleanedAmenities)].forEach((amenity) => {
                 const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
                 if (checkbox) checkbox.checked = true;
            });
        }

        // 7. Imágenes y PDF
        imagePreviewContainer.innerHTML = "";
        accumulatedFiles = [];
        if (property.images && property.images.length > 0) {
            property.images.forEach((url) => createPreviewThumbnail(url, true));
        }

        pdfPreviewContainer.innerHTML = "";
        if (property.pdfUrl) {
            const fileName = property.pdfUrl.split("/").pop();
            pdfPreviewContainer.innerHTML = `<div class="image-item">PDF existente: ${fileName}</div>`;
        }

    } catch (error) {
        console.error("Error al cargar la propiedad para editar:", error);
        showCustomAlert('Error', 'No se pudieron cargar los datos de la propiedad.');
    }
}

  typeSelect.addEventListener("change", () => {
    populateSubtypeSelect(typeSelect.value);
    toggleSpecificFields();
  });

  propertyForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // --- VALIDATION FOR AT LEAST ONE IMAGE ---
        const existingImagesCount = document.querySelectorAll(
  '#image-preview .image-item[data-existing-url]'
).length;
        if (accumulatedFiles.length === 0 && existingImagesCount === 0) {
            showCustomAlert(
            'Error al cargar la propiedad.', 
            'La propiedad debe tener al menos una imagen.'
        );
            return;
        }
        
        const formData = new FormData(propertyForm);

        // --- ORDERED IMAGE HANDLING ---
        // Get the final order of existing images from the DOM
        const existingImageOrder = [];
        imagePreviewContainer.querySelectorAll('.image-item[data-existing-url]').forEach(item => {
            existingImageOrder.push(item.dataset.existingUrl);
        });
        formData.append('existingImageUrlsToKeep', JSON.stringify(existingImageOrder));
        
        // Get the final order of NEW files from the DOM
        const newFileOrder = [];
        imagePreviewContainer.querySelectorAll('.image-item[data-file-name]').forEach(item => {
            const file = accumulatedFiles.find(f => f.name === item.dataset.fileName);
            if (file) {
                newFileOrder.push(file);
            }
        });
        
        // Add the sorted new files to formData
        // We must remove the placeholder from the HTML input first
        formData.delete('images');
        newFileOrder.forEach(file => {
            formData.append('images', file);
        });
        
    // Agrupar características específicas en un objeto JSON
    const specificChars = {};
    const selectedType = formData.get("type");
    switch (selectedType) {
      case "vivienda":
        specificChars.ambientes = formData.get("v_ambientes");
        specificChars.dormitorios = formData.get("v_dormitorios");
        specificChars.banos = formData.get("v_banos");
        specificChars.cocheras = formData.get("v_cocheras");
        break;
      case 'lote':
          specificChars.metrosFrente = parseFloat(formData.get('l_metrosFrente')) || null;
          specificChars.metrosFondo = parseFloat(formData.get('l_metrosFondo')) || null;
          specificChars.serviciosAgua = propertyForm.querySelector('#l_serviciosAgua')?.checked || false;
          specificChars.serviciosLuz = propertyForm.querySelector('#l_serviciosLuz')?.checked || false;
          specificChars.serviciosGas = propertyForm.querySelector('#l_serviciosGas')?.checked || false;
          specificChars.cercado = propertyForm.querySelector('#l_cercado')?.value === 'true';
          specificChars.barrioCerrado = propertyForm.querySelector('#l_barrioCerrado')?.value === 'true';
          break;
      case 'industrial':
          specificChars.altura = parseFloat(formData.get('i_altura')) || null;
          specificChars.oficinasM2 = parseFloat(formData.get('i_oficinasM2')) || null;
          specificChars.banos = parseInt(formData.get('i_banos')) || null;
          specificChars.almaLlena = propertyForm.querySelector('#i_almaLlena')?.value === 'true';
          specificChars.tienePotencia = propertyForm.querySelector('#i_tienePotencia')?.value === 'true';
          specificChars.tieneGas = propertyForm.querySelector('#i_tieneGas')?.value === 'true';
          specificChars.redHidrante = propertyForm.querySelector('#i_redHidrante')?.value === 'true';
          break;
      case  'comercial':
          specificChars.bano = propertyForm.querySelector('#c_bano')?.value === 'true';
          specificChars.trifasica = propertyForm.querySelector('#c_trifasica')?.value === 'true';
          specificChars.tieneCocina = propertyForm.querySelector('#c_tieneCocina')?.checked || false;
          specificChars.cortinaElectrica = propertyForm.querySelector('#c_cortinaElectrica')?.checked || false;
          specificChars.cortinaMetalica = propertyForm.querySelector('#c_cortinaMetalica')?.checked || false;
          break;
    }
    formData.append("specificCharacteristics", JSON.stringify(specificChars));

    // Manejar amenities
    const amenities = Array.from(
      document.querySelectorAll('input[name="amenities"]:checked')
    ).map((cb) => cb.value);
    formData.append("amenities", JSON.stringify(amenities));

    const method = propertyId ? "PUT" : "POST";
    const url = propertyId
      ? `/api/properties/${propertyId}`
      : "/api/properties";

    try {
      const response = await fetch(url, {
        method: method,
        headers: { Authorization: "Bearer " + sessionStorage.getItem("token") },
        body: formData,
      });

      if (response.ok) {
        // En lugar de redirigir, mostramos el modal de decisión
        const successModal = new bootstrap.Modal(document.getElementById('successActionModal'));
        successModal.show();
      }else {
        const result = await response.json();
        showCustomAlert(
            'Error al guardar la propiedad:', 
            result.message
        );
      }
      
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      showCustomAlert(
            'Error de conexión al guardar la propiedad.', 
            'Intentalo otra vez más tarde.'
        );
    }
  });

  // Cargar datos si estamos en modo edición
  // --- EVENT LISTENERS & INITIAL SETUP ---
    if (imagesInput) {
        imagesInput.addEventListener('change', handleFileSelection);
    }
    
    if (pdfInput) {
        pdfInput.addEventListener("change", () => {
            pdfPreviewContainer.innerHTML = '';
            if (pdfInput.files.length > 0) {
                pdfPreviewContainer.innerHTML = `<div class="image-item">Archivo: ${pdfInput.files[0].name}</div>`;
            }
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener("change", () => {
            populateSubtypeSelect(typeSelect.value);
            toggleSpecificFields();
        });
    }

    const propertyId = new URLSearchParams(window.location.search).get("id");
    if (propertyId) {
        document.querySelector(".property-form h2").textContent = "Editar Propiedad";
        loadPropertyForEdit(propertyId); // Make sure to call your full load function here
    } else {
        document.querySelector(".property-form h2").textContent = "Crear Nueva Propiedad";
        toggleSpecificFields();
    }

    // --- LÓGICA DE MODAL DE PROPIETARIO (CREAR Y EDITAR) ---
    
    const btnOpenOwnerCreate = document.getElementById('btnOpenOwnerCreate');
    const btnOpenOwnerEdit = document.getElementById('btnOpenOwnerEdit');
    const btnSaveOwner = document.getElementById('btnSaveQuickOwner'); // Tu botón de guardar del modal
    const ownerModalEl = document.getElementById('quickOwnerModal');
    const ownerModal = new bootstrap.Modal(ownerModalEl);

    // 1. Al tocar (+): Limpiar formulario para crear uno nuevo
    if(btnOpenOwnerCreate) {
        btnOpenOwnerCreate.addEventListener('click', () => {
            document.getElementById('quickOwnerForm').reset(); // Limpia inputs
            document.getElementById('quickOwnerIdHidden').value = ""; // Borra ID (Modo Crear)
            document.querySelector('#quickOwnerModal .modal-title').textContent = "Nuevo Propietario";
        });
    }

    // 2. Al tocar (Lápiz): Cargar datos para editar
    if(btnOpenOwnerEdit) {
        btnOpenOwnerEdit.addEventListener('click', async () => {
            const selectedId = document.getElementById('ownerId').value;
            
            if(!selectedId) {
                return showCustomAlert('Atención', 'Primero selecciona un propietario de la lista para editar.');
            }

            try {
                // Pedimos los datos completos al backend
                const res = await fetch(`/api/auth/owners/${selectedId}`);
                if(res.ok) {
                    const data = await res.json();
                    
                    // Llenamos el formulario
                    document.getElementById('quickOwnerIdHidden').value = data.id; // Guardamos ID (Modo Editar)
                    document.getElementById('quickName').value = data.fullName;
                    document.getElementById('quickPhone').value = data.phoneNumber || '';
                    document.getElementById('quickEmail').value = data.email || '';
                    document.getElementById('quickNotes').value = data.privateNotes || '';
                    
                    // Cambiamos título y abrimos
                    document.querySelector('#quickOwnerModal .modal-title').textContent = "Editar Propietario";
                    ownerModal.show();
                }
            } catch (err) {
                console.error(err);
                showCustomAlert('Error', 'No se pudieron cargar los datos');
            }
        });
    }

    // 3. Al tocar GUARDAR (Sirve para ambos casos)
    if (btnSaveOwner) {
        btnSaveOwner.addEventListener('click', async () => {
            // Datos del formulario
            const id = document.getElementById('quickOwnerIdHidden').value; // ¿Tiene ID?
            const fullName = document.getElementById('quickName').value;
            const phoneNumber = document.getElementById('quickPhone').value;
            const email = document.getElementById('quickEmail').value;
            const privateNotes = document.getElementById('quickNotes').value;

            // Validaciones (Igual que antes)
            if (!fullName) return showCustomAlert('Error', 'El nombre es obligatorio');
            const cleanPhone = phoneNumber.replace(/\D/g, ''); 
            if (phoneNumber && cleanPhone.length !== 10) return showCustomAlert('Error', 'Teléfono inválido (10 dígitos).');

            // DECISIÓN: ¿Crear o Editar?
            const isEdit = !!id; // Si hay ID, es true
            const url = isEdit ? `/api/auth/owners/${id}` : '/api/auth/owners';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, phoneNumber, email, privateNotes })
                });

                if (res.ok) {
                    const resultOwner = await res.json();
                    
                    // Actualizar el SELECT
                    const select = document.getElementById('ownerId');
                    
                    if(isEdit) {
                        // Si editamos, buscamos la opción existente y le cambiamos el texto
                        const option = select.querySelector(`option[value="${resultOwner.id}"]`);
                        if(option) {
                            option.textContent = resultOwner.fullName;
                            option.dataset.phone = resultOwner.phoneNumber || '';
                            option.dataset.notes = resultOwner.privateNotes || '';
                        }
                        // Forzamos actualización de vista previa de teléfono
                        select.dispatchEvent(new Event('change'));
                    } else {
                        // Si creamos, agregamos nueva opción (como hacías antes)
                        const option = document.createElement('option');
                        option.value = resultOwner.id;
                        option.textContent = resultOwner.fullName;
                        option.dataset.phone = resultOwner.phoneNumber || '';
                        option.dataset.notes = resultOwner.privateNotes || '';
                        select.appendChild(option);
                        select.value = resultOwner.id;
                        select.dispatchEvent(new Event('change'));
                    }

                    ownerModal.hide();
                    showCustomAlert('Éxito', isEdit ? 'Propietario actualizado' : 'Propietario creado');
                } else {
                    showCustomAlert('Error', 'No se pudo guardar');
                }
            } catch (err) {
                console.error(err);
                showCustomAlert('Error', 'Fallo de conexión');
            }finally {
            // DESBLOQUEO FINAL
            this.disabled = false;
            this.textContent = originalText;
        }
        
        });
    }

    // --- LÓGICA DE MODAL DE COLEGAS (CREAR Y EDITAR) ---    

    const btnOpenColCreate = document.getElementById('btnOpenColleagueCreate');
    const btnOpenColEdit = document.getElementById('btnOpenColleagueEdit');
    const btnSaveCol = document.getElementById('btnSaveColleague');
    const colModalEl = document.getElementById('quickColleagueModal');
    const colModal = colModalEl ? new bootstrap.Modal(colModalEl) : null; 

    // 1. Al tocar (+): Limpiar para Crear
    if(btnOpenColCreate) {
        btnOpenColCreate.addEventListener('click', () => {
            document.getElementById('quickColleagueForm').reset();
            document.getElementById('quickColleagueIdHidden').value = ""; // Modo Crear
            if(document.querySelector('#quickColleagueModal .modal-title')) {
                document.querySelector('#quickColleagueModal .modal-title').textContent = "Nuevo Colega";
            }
        });
    }

    // 2. Al tocar (Lápiz): Cargar para Editar
    if(btnOpenColEdit) {
        btnOpenColEdit.addEventListener('click', async () => {
            const selectedId = document.getElementById('colleagueId').value;
            
            if(!selectedId) {
                return showCustomAlert('Atención', 'Selecciona un colega de la lista para editar.');
            }

            try {
                const res = await fetch(`/api/auth/colleagues/${selectedId}`);
                if(res.ok) {
                    const data = await res.json();
                    
                    // Llenar formulario
                    document.getElementById('quickColleagueIdHidden').value = data.id; // Modo Editar
                    document.getElementById('col_name').value = data.fullName;
                    document.getElementById('col_agency').value = data.agencyName || '';
                    document.getElementById('col_phone').value = data.phoneNumber || '';
                    document.getElementById('col_notes').value = data.privateNotes || '';
                    // Si agregaste email al form de colega, cárgalo aquí también
                    
                    document.querySelector('#quickColleagueModal .modal-title').textContent = "Editar Colega";
                    colModal.show();
                }
            } catch (err) {
                console.error(err);
                showCustomAlert('Error', 'No se pudieron cargar los datos del colega');
            }
        });
    }

    // 3. Guardar (Create/Update)
    if (btnSaveCol) {
        btnSaveCol.addEventListener('click', async () => {
            const id = document.getElementById('quickColleagueIdHidden').value;
            const fullName = document.getElementById('col_name').value;
            const agencyName = document.getElementById('col_agency').value;
            const phoneNumber = document.getElementById('col_phone').value;
            const privateNotes = document.getElementById('col_notes').value;

            if (!fullName) return showCustomAlert('Error', 'El nombre es obligatorio');

            const isEdit = !!id;
            const url = isEdit ? `/api/auth/colleagues/${id}` : '/api/auth/colleagues';
            const method = isEdit ? 'PUT' : 'POST';

            try {
                const res = await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, agencyName, phoneNumber, privateNotes })
                });

                if (res.ok) {
                    const resultCol = await res.json();
                    const select = document.getElementById('colleagueId');
                    
                    // Texto formateado: "Inmobiliaria - Nombre"
                    const displayText = `${resultCol.agencyName ? resultCol.agencyName + ' - ' : ''}${resultCol.fullName}`;

                    if(isEdit) {
                        const option = select.querySelector(`option[value="${resultCol.id}"]`);
                       if(option) {
                            option.textContent = displayText;
                            option.dataset.agency = resultCol.agencyName || "";
                            option.dataset.phone = resultCol.phoneNumber || "";
                            option.dataset.notes = resultCol.privateNotes || "";
                        }
                        
                    } else {
                        const option = document.createElement('option');
                        option.value = resultCol.id;
                        option.textContent = displayText;
                        option.dataset.agency = resultCol.agencyName || "";
                        option.dataset.phone = resultCol.phoneNumber || "";
                        option.dataset.notes = resultCol.privateNotes || "";
                        select.appendChild(option);
                        select.value = resultCol.id;
                    }

                    select.dispatchEvent(new Event('change'));
                    colModal.hide();
                    showCustomAlert('Éxito', isEdit ? 'Colega actualizado' : 'Colega agendado');
                } else {
                    showCustomAlert('Error', 'No se pudo guardar');
                }
            } catch (err) {
                console.error(err);
                showCustomAlert('Error', 'Fallo de conexión');
            }
        });
    }

    // --- LÓGICA DE GESTIÓN INTERNA (Propia vs Colega) ---

    // 1. Alternar vistas (Switch)
    const radioMS = document.getElementById('sourceMS');
    const radioColleague = document.getElementById('sourceColleague');
    const ownerSection = document.getElementById('ownerSection');
    const colleagueSection = document.getElementById('colleagueSection');
    const msLabel = document.getElementById('msLabel');
    const colLabel = document.getElementById('colLabel');

function toggleSource() {

    if (radioColleague.checked) {
        ownerSection.style.display = 'none';
        colleagueSection.style.display = 'block';
        setBtnActive(colLabel);   // Colega se pone azul
        setBtnInactive(msLabel);  // MS se pone gris
        document.getElementById('ownerId').value = ""; 
    } 
    else if (radioMS.checked) {
        ownerSection.style.display = 'block';
        colleagueSection.style.display = 'none';
        setBtnActive(msLabel);    // MS se pone azul
        setBtnInactive(colLabel); // Colega se pone gris
        document.getElementById('colleagueId').value = "";
    }
    else {
        ownerSection.style.display = 'none';
        colleagueSection.style.display = 'none';
        setBtnInactive(msLabel);
        setBtnInactive(colLabel);
    }
}

    // --- Funciones auxiliares para no repetir código ---
    function setBtnActive(element) {
        if (element) {
            element.classList.remove('btn-secondary');
            element.classList.add('btn-primary');
        }
    }

    function setBtnInactive(element) {
        if (element) {
            element.classList.remove('btn-primary');
            element.classList.add('btn-secondary');
        }
    }

    // Escuchamos los cambios en los radio buttons
    if(radioMS && radioColleague) {
        radioMS.addEventListener('change', toggleSource);
        radioColleague.addEventListener('change', toggleSource);
    }

    // 2. Cargar lista de Colegas
    async function loadColleagues() {
        const colSelect = document.getElementById('colleagueId');
        if (!colSelect) return;

        try {
            const res = await fetch('/api/auth/colleagues'); // Asegurate que esta ruta coincida con authRoutes
            if (res.ok) {
                const colleagues = await res.json();
                colSelect.innerHTML = '<option value="">Seleccione un colega...</option>';
                colleagues.forEach(col => {
                    const opt = document.createElement('option');
                    opt.value = col.id;
                    opt.textContent = `${col.agencyName ? col.agencyName + ' - ' : ''}${col.fullName}`;
                    opt.dataset.agency = col.agencyName || "";
                    opt.dataset.phone = col.phoneNumber || "";
                    opt.dataset.notes = col.privateNotes || "";
                    colSelect.appendChild(opt);
                });
            }
        } catch (err) {
            console.error("Error cargando colegas", err);
        }

        colSelect.addEventListener('change', function() {
        const selected = this.options[this.selectedIndex];
        
        // Llenar Inmobiliaria
        const agencyInput = document.getElementById('colAgencyPreview');
        if(agencyInput) agencyInput.value = selected.dataset.agency || "Particular / No especifica";
        agencyInput.style.backgroundColor = "#e9ecef"; // Gris claro
        agencyInput.style.color = "#495057"; // Texto normal

        // Llenar Teléfono
        const phoneInput = document.getElementById('colPhonePreview');
        if(phoneInput) phoneInput.value = selected.dataset.phone || "Sin teléfono";
        phoneInput.style.backgroundColor = "#e9ecef"; // Gris claro
        phoneInput.style.color = "#495057"; // Texto normal

        // Llenar Notas (NUEVO)
        const notesInput = document.getElementById('colNotesPreview');
        if(notesInput) notesInput.value = selected.dataset.notes || "Sin notas registradas.";
        notesInput.style.backgroundColor = "#e9ecef"; // Gris claro
        notesInput.style.color = "#495057"; // Texto normal
    });
        
    }

    // --- LÓGICA DEL SELECTOR DE UBICACIÓN (ISSUE #18) ---
    
    let pickerMap = null;
    let pickerMarker = null;
    let googleGeocoder = null; // Servicio para traducir LatLng -> Texto

    function initLocationPicker() {
        const mapContainer = document.getElementById('locationPickerMap');
        if (!mapContainer) return;

        setTimeout(() => {
            pickerMap = L.map('locationPickerMap').setView([-34.763, -58.211], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(pickerMap);
            
            // Inicializamos el Geocoder de Google
            googleGeocoder = new google.maps.Geocoder();

            // Evento: Clic en el mapa
            pickerMap.on('click', function(e) {
                updatePickerMarker(e.latlng, true); // true = buscar dirección
            });

            // Lógica del Buscador (Autocomplete)
            const inputSearch = document.getElementById('addressSearch');
            // Prevenir enter
            inputSearch.addEventListener('keydown', (e) => { if(e.key === 'Enter') e.preventDefault(); });

            const autocomplete = new google.maps.places.Autocomplete(inputSearch, {
                componentRestrictions: { country: "ar" },
                fields: ["geometry", "name", "address_components", "formatted_address"] // Agregamos formatted_address
            });

            autocomplete.addListener("place_changed", () => {
                const place = autocomplete.getPlace();
                if (!place.geometry || !place.geometry.location) {
                    showCustomAlert("Error", "No pudimos localizar esa dirección.");
                    return;
                }
                
                // Mover mapa
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const latlng = new L.LatLng(lat, lng);
                
                updatePickerMarker(latlng, false); // false = no buscar dirección (ya la tenemos)
                pickerMap.setView(latlng, 17);
                
                // Usamos nuestra función auxiliar para llenar los campos
                fillAddressFromGoogle(place);
            });

            // Cargar datos existentes
            const existingLat = document.getElementById('latitude').value;
            const existingLng = document.getElementById('longitude').value;
            if (existingLat && existingLng) {
                const point = [parseFloat(existingLat), parseFloat(existingLng)];
                updatePickerMarker(point, false);
                pickerMap.setView(point, 16);
            }

        }, 500);
    }

    // Función auxiliar para llenar los inputs con datos de Google
function fillAddressFromGoogle(googlePlace) {
    // 1. Llenar el buscador con la dirección formateada completa
    const searchInput = document.getElementById('addressSearch');
    if (searchInput && googlePlace.formatted_address) {
        searchInput.value = googlePlace.formatted_address;
    }

    // 2. Desglosar componentes (Calle, Altura, Ciudad)
    let street = "";
    let number = "";

    if (googlePlace.address_components) {
        googlePlace.address_components.forEach(component => {
            const types = component.types;
            if (types.includes('route')) street = component.long_name;
            if (types.includes('street_number')) number = component.long_name;
        });
    }

    // 3. Llenar (o LIMPIAR) los inputs del formulario
    const addressInput = document.getElementById('address');

    if (addressInput) {
        addressInput.value = `${street} ${number}`.trim();
        // Efecto visual
        addressInput.style.backgroundColor = "#fff3cd";
        setTimeout(() => addressInput.style.backgroundColor = "", 1000);
    }
    
}

 // Función auxiliar que maneja el pin y la búsqueda inversa
    function updatePickerMarker(latlng, shouldReverseGeocode) {
        // Normalizar
        const lat = latlng.lat || latlng[0];
        const lng = latlng.lng || latlng[1];

        // 1. Actualizar Inputs Ocultos
        document.getElementById('latitude').value = parseFloat(lat).toFixed(7);
        document.getElementById('longitude').value = parseFloat(lng).toFixed(7);

        // 2. Mover o Crear Pin
        if (pickerMarker) {
            pickerMarker.setLatLng([lat, lng]);
        } else {
            pickerMarker = L.marker([lat, lng], { draggable: true }).addTo(pickerMap);
            
            // Evento: Al terminar de arrastrar el pin
            pickerMarker.on('dragend', function(e) {
                const pos = e.target.getLatLng();
                // Actualizamos coordenadas
                updatePickerMarker(pos, true); // true = buscar la nueva dirección al soltar
            });
        }

        // 3. Geocodificación Inversa (Coordenadas -> Texto)
        if (shouldReverseGeocode) {
            // 👇 ¡AQUÍ ESTÁ LA SEGURIDAD! 
            // Si moviste el pin, borramos la localidad para obligar a verificarla.
            const locInput = document.getElementById('locality');
            const neighInput = document.getElementById('neighbourhood');
            if (locInput) locInput.value = "";
            if (neighInput) neighInput.value = "";
            // ------------------------------------------------------------

            if (googleGeocoder) {
                const googleLatLng = { lat: parseFloat(lat), lng: parseFloat(lng) };
                
                googleGeocoder.geocode({ location: googleLatLng }, (results, status) => {
                    if (status === "OK" && results[0]) {
                        // Llenamos SOLO la Calle y Altura (según configuramos antes)
                        fillAddressFromGoogle(results[0]);
                    } else {
                        console.warn("No se pudo obtener la dirección de este punto:", status);
                    }
                });
            }
        }
    }

    // Botón Borrar (Igual que antes)
    const btnResetLoc = document.getElementById('btnResetLocation');
    if (btnResetLoc) {
        btnResetLoc.addEventListener('click', () => {
            if (pickerMarker) {
                pickerMap.removeLayer(pickerMarker);
                pickerMarker = null;
            }
            document.getElementById('latitude').value = "";
            document.getElementById('longitude').value = "";
            document.getElementById('addressSearch').value = ""; // Limpiar buscador también
        });
    }

    // --- LÓGICA DE LOCALIDADES INTELIGENTE ---

    // 1. Cargar sugerencias al iniciar
    async function loadLocalitySuggestions() {
        try {
            const res = await fetch('/api/auth/localities-list');
            if(res.ok) {
                const cities = await res.json();
                const dataList = document.getElementById('localityOptions');
                if(dataList) {
                    dataList.innerHTML = ''; // Limpiar
                    cities.forEach(city => {
                        const option = document.createElement('option');
                        option.value = city; // Ej: "Berazategui"
                        dataList.appendChild(option);
                    });
                }
            }
        } catch(e) { console.error("Error cargando sugerencias", e); }
    }
    
    // 2. Función para Normalizar Texto (Transforma "berazategui" -> "Berazategui")
    function titleCase(str) {
        if (!str) return "";
        return str.toLowerCase().split(' ').map(function(word) {
            return (word.charAt(0).toUpperCase() + word.slice(1));
        }).join(' ');
    }

    // 3. Listener: Se activa cuando sales del campo (click afuera o tab)
    const locInput = document.getElementById('locality');
    if (locInput) {
        locInput.addEventListener('blur', function() {
            // Si escribió "berazategui", lo cambiamos a "Berazategui"
            this.value = titleCase(this.value); 
        });
    }

    // Ejecutar carga inicial
    loadLocalitySuggestions();


    // Inicializar el selector de ubicación
    initLocationPicker();

    // Llamamos a cargar colegas al iniciar
    if (!propertyId) {
    loadColleagues();
    }
});
