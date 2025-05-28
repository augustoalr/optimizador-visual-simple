document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM (sin cambios aquí)
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const percentageSlider = document.getElementById('percentageSlider');
    const percentageValue = document.getElementById('percentageValue');
    const applyResizeButton = document.getElementById('applyResizeButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const clearAllButton = document.getElementById('clearAllButton');
    const previewActions = document.getElementById('previewActions');

    const zoomModal = document.getElementById('zoomModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const zoomedImage = document.getElementById('zoomedImage');
    const modalImageName = document.getElementById('modalImageName');
    const originalDimensions = document.getElementById('originalDimensions');
    const originalSize = document.getElementById('originalSize');
    const newDimensions = document.getElementById('newDimensions');
    const newSize = document.getElementById('newSize');
    const downloadSingleModalButton = document.getElementById('downloadSingleModalButton');
    const zoomInButton = document.getElementById('zoomInButton');
    const zoomOutButton = document.getElementById('zoomOutButton');
    const zoomLevelDisplay = document.getElementById('zoomLevel');

    let currentZoom = 1;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const TARGET_MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
    let imageFiles = []; 

    // --- MANEJO DE CARGA DE ARCHIVOS ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('dragover');
        const files = event.dataTransfer.files;
        handleFiles(files);
    });
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        handleFiles(files);
    });

    function handleFiles(files) {
        let newFilesAdded = false;
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                alert(`${file.name} no es una imagen válida.`);
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`${file.name} (${formatBytes(file.size)}) excede el límite de 10MB.`);
                continue;
            }
            if (!imageFiles.some(f => f.file.name === file.name && f.file.size === file.size)) {
                const imageId = `img-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                const imageObject = {
                    file: file,
                    id: imageId,
                    originalDataUrl: null,
                    resizedDataUrl: null,
                    status: 'pending', 
                    appliedPercentage: null, // --- NUEVO ---: para saber si ya se procesó con el % actual
                };
                imageFiles.push(imageObject);
                displayImagePreview(imageObject); // Se mostrará la miniatura
                newFilesAdded = true;
            }
        }
        if (newFilesAdded) {
           updateGlobalButtonsState(); // --- MODIFICADO ---
        }
        fileInput.value = ''; 
    }

    function displayImagePreview(imageObject) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageObject.originalDataUrl = e.target.result;

            const img = new Image();
            img.onload = () => {
                imageObject.originalWidth = img.width;
                imageObject.originalHeight = img.height;
                imageObject.originalSizeBytes = imageObject.file.size;

                const previewItem = document.createElement('div');
                previewItem.classList.add('preview-item');
                previewItem.id = imageObject.id;
                previewItem.innerHTML = `
                    <button class="delete-btn" data-id="${imageObject.id}" title="Eliminar imagen">&times;</button> <img src="${e.target.result}" alt="${imageObject.file.name}" data-id="${imageObject.id}">
                    <p class="file-name" title="${imageObject.file.name}">${imageObject.file.name}</p>
                    <div class="image-info-small">
                        <span>${img.width}x${img.height}</span> | <span>${formatBytes(imageObject.file.size)}</span>
                    </div>
                    <div class="status pending">Pendiente</div>
                `;
                imagePreviewContainer.appendChild(previewItem);

                previewItem.querySelector('img').addEventListener('click', () => {
                    openZoomModal(imageObject);
                });
                // --- NUEVO: Event listener para el botón de eliminar ---
                previewItem.querySelector('.delete-btn').addEventListener('click', (event) => {
                    event.stopPropagation(); // Evitar que se abra el modal de zoom
                    removeImage(imageObject.id);
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(imageObject.file);
    }
    
    // --- NUEVO: Función para eliminar una imagen ---
    function removeImage(imageIdToRemove) {
        imageFiles = imageFiles.filter(imgObj => imgObj.id !== imageIdToRemove);
        const previewItemToRemove = document.getElementById(imageIdToRemove);
        if (previewItemToRemove) {
            previewItemToRemove.remove();
        }
        updateGlobalButtonsState();
    }

    // --- NUEVO: Función para actualizar estado de botones globales ---
    function updateGlobalButtonsState() {
        const hasFiles = imageFiles.length > 0;
        applyResizeButton.disabled = !hasFiles;
        previewActions.style.display = hasFiles ? 'block' : 'none';
        // Si no hay imágenes procesadas, deshabilitar "Descargar Todas"
        const hasProcessedFiles = imageFiles.some(img => img.status === 'done');
        downloadAllButton.disabled = !hasProcessedFiles;
    }


    // --- CONTROLES DE REDIMENSIONAMIENTO ---
    percentageSlider.addEventListener('input', (event) => {
        percentageValue.textContent = `${event.target.value}%`;
        // --- MODIFICADO --- Marcar imágenes como pendientes si el porcentaje cambia
        imageFiles.forEach(imgObj => {
            if (imgObj.status === 'done') {
                // Si el porcentaje es diferente al aplicado, la marcamos como pendiente de reprocesar
                if (imgObj.appliedPercentage !== (parseInt(event.target.value) / 100)) {
                    imgObj.status = 'pending_reprocess'; 
                    updatePreviewStatus(imgObj.id, 'Reprocesar', 'pending');
                }
            }
        });
        updateGlobalButtonsState();
    });

    applyResizeButton.addEventListener('click', async () => {
        if (imageFiles.length === 0) {
            alert("Por favor, carga algunas imágenes primero.");
            return;
        }
        applyResizeButton.disabled = true;
        applyResizeButton.textContent = "Procesando...";

        const percentage = parseInt(percentageSlider.value) / 100;

        // Crear un array de promesas para procesar en paralelo (con límite si es necesario)
        const processingPromises = [];

        for (const imgObj of imageFiles) {
            // Solo procesar si está pendiente, necesita reprocesar o si el % aplicado es diferente.
            if (imgObj.status === 'pending' || imgObj.status === 'pending_reprocess' || imgObj.appliedPercentage !== percentage) {
                updatePreviewStatus(imgObj.id, 'Procesando...', 'processing');
                processingPromises.push(
                    resizeImage(imgObj, percentage)
                        .then(resizedData => {
                            imgObj.resizedDataUrl = resizedData.dataUrl;
                            imgObj.newWidth = resizedData.width;
                            imgObj.newHeight = resizedData.height;
                            imgObj.newSizeBytes = resizedData.sizeBytes;
                            imgObj.appliedPercentage = percentage; 
                            imgObj.status = 'done';
                            updatePreviewStatus(imgObj.id, `¡Hecho! ${resizedData.qualityAchieved ? `(Q: ${Math.round(resizedData.qualityAchieved*100)}%)` : ''}`, 'done', resizedData);

                            const previewImgElement = document.querySelector(`#${imgObj.id} img`);
                            if (previewImgElement) previewImgElement.src = resizedData.dataUrl;
                        })
                        .catch(error => {
                            console.error("Error al redimensionar:", error);
                            imgObj.status = 'error';
                            updatePreviewStatus(imgObj.id, `Error: ${error.message.substring(0,30)}`, 'error');
                        })
                );
            }
        }
        
        await Promise.all(processingPromises); // Esperar a que todas las promesas se resuelvan

        applyResizeButton.disabled = false;
        applyResizeButton.textContent = "Aplicar y Previsualizar";
        updateGlobalButtonsState(); // Actualizar estado de botones
    });

    // --- MODIFICADO: Función resizeImage con compresión iterativa ---
    async function resizeImage(imageObject, percentage) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const newWidth = Math.round(img.width * percentage);
                const newHeight = Math.round(img.height * percentage);

                canvas.width = newWidth;
                canvas.height = newHeight;
                ctx.drawImage(img, 0, 0, newWidth, newHeight);

                let qualityAchieved = null; // Para saber la calidad final

                if (imageObject.file.type === 'image/png') {
                    // PNG es sin pérdida, la calidad no se ajusta así.
                    // El tamaño se reduce principalmente por las dimensiones.
                    canvas.toBlob((blob) => {
                        if (!blob) return reject(new Error('Error al crear blob para PNG'));
                        const reader = new FileReader();
                        reader.onloadend = () => resolve({
                            dataUrl: reader.result,
                            width: newWidth,
                            height: newHeight,
                            sizeBytes: blob.size,
                            qualityAchieved: null // PNG no tiene este tipo de ajuste de calidad
                        });
                        reader.onerror = () => reject(new Error('Error al leer blob PNG como DataURL'));
                        reader.readAsDataURL(blob);
                    }, 'image/png');
                } else { // JPEG o WEBP
                    let currentQuality = imageObject.file.type === 'image/webp' ? 0.90 : 0.92; // Calidad inicial
                    const minQuality = 0.40; // Calidad mínima aceptable
                    const qualityStep = 0.05; // Cuánto reducir la calidad en cada intento
                    let attempts = 0;
                    const maxAttempts = 10; // Para evitar bucles infinitos

                    let resultBlob = null;

                    // Bucle iterativo para ajustar calidad
                    while (attempts < maxAttempts) {
                        attempts++;
                        const blob = await new Promise(resBlob => canvas.toBlob(resBlob, imageObject.file.type, currentQuality));
                        
                        if (!blob) { // Si falla la creación del blob por alguna razón
                            if (attempts === 1 && currentQuality > minQuality + qualityStep) { // Si falló en el primer intento con alta calidad, prueba una calidad menor
                                currentQuality -= qualityStep * 2; // Baja más agresivamente
                                console.warn(`Fallo al crear blob con calidad ${currentQuality + qualityStep * 2}, reintentando con ${currentQuality}`);
                                continue; // Vuelve a intentar el blob
                            }
                            return reject(new Error(`No se pudo crear el blob para ${imageObject.file.name} con calidad ${currentQuality.toFixed(2)}`));
                        }

                        resultBlob = blob;
                        qualityAchieved = currentQuality; // Guardar la calidad con la que se generó este blob

                        if (resultBlob.size <= TARGET_MAX_SIZE_BYTES || currentQuality <= minQuality) {
                            break; // Objetivo alcanzado o calidad mínima
                        }
                        
                        currentQuality -= qualityStep;
                        if (currentQuality < minQuality) currentQuality = minQuality; // No bajar de la calidad mínima
                    }
                    
                    if (!resultBlob) return reject(new Error(`No se pudo generar el blob final para ${imageObject.file.name}`));

                    if (resultBlob.size > TARGET_MAX_SIZE_BYTES) {
                        console.warn(`Imagen ${imageObject.file.name} (${formatBytes(resultBlob.size)}) sigue siendo > 1MB con calidad ${qualityAchieved.toFixed(2)}.`);
                    }
                    
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({
                        dataUrl: reader.result,
                        width: newWidth,
                        height: newHeight,
                        sizeBytes: resultBlob.size,
                        qualityAchieved: qualityAchieved 
                    });
                    reader.onerror = () => reject(new Error('Error al leer blob como DataURL'));
                    reader.readAsDataURL(resultBlob);
                }
            };
            img.onerror = () => {
                reject(new Error(`No se pudo cargar la imagen original: ${imageObject.file.name}`));
            };
            img.src = imageObject.originalDataUrl;
        });
    }


    function updatePreviewStatus(imageId, message, statusClass, resizedData = null) {
        const previewItem = document.getElementById(imageId);
        if (previewItem) {
            const statusDiv = previewItem.querySelector('.status');
            statusDiv.textContent = message;
            statusDiv.className = `status ${statusClass}`;

            if (resizedData) {
                 const infoDiv = previewItem.querySelector('.image-info-small');
                 infoDiv.innerHTML = `
                    <span>${resizedData.width}x${resizedData.height}</span> | <span>${formatBytes(resizedData.sizeBytes)}</span>
                 `;
            }
        }
    }

    // --- MODAL DE ZOOM --- (sin cambios significativos en la lógica del modal en sí)
    function openZoomModal(imageObject) {
        currentZoom = 1; 
        zoomedImage.style.transform = 'scale(1)'; // Reset zoom visual inmediato
        zoomedImage.parentElement.scrollTop = 0; // Reset scroll
        zoomedImage.parentElement.scrollLeft = 0;

        modalImageName.textContent = imageObject.file.name;
        originalDimensions.textContent = `${imageObject.originalWidth}x${imageObject.originalHeight}`;
        originalSize.textContent = formatBytes(imageObject.originalSizeBytes);

        if (imageObject.status === 'done' && imageObject.resizedDataUrl) {
            zoomedImage.src = imageObject.resizedDataUrl;
            newDimensions.textContent = `${imageObject.newWidth}x${imageObject.newHeight}`;
            newSize.textContent = formatBytes(imageObject.newSizeBytes);
            if(imageObject.qualityAchieved) newSize.textContent += ` (Q: ${Math.round(imageObject.qualityAchieved*100)}%)`;
            downloadSingleModalButton.onclick = () => downloadSingleImage(imageObject);
            downloadSingleModalButton.style.display = 'inline-block';
        } else { 
            zoomedImage.src = imageObject.originalDataUrl;
            newDimensions.textContent = "N/A";
            newSize.textContent = "N/A";
            downloadSingleModalButton.style.display = 'none';
        }
        applyZoom(); // Aplicar el zoom actual (debería ser 100% al abrir)
        zoomModal.style.display = "flex";
    }

    closeModalButton.addEventListener('click', () => zoomModal.style.display = "none");
    window.addEventListener('click', (event) => { 
        if (event.target === zoomModal) {
            zoomModal.style.display = "none";
        }
    });

    zoomInButton.addEventListener('click', () => {
        currentZoom = Math.min(5, currentZoom + 0.25); // Max zoom 500%
        applyZoom();
    });
    zoomOutButton.addEventListener('click', () => {
        currentZoom = Math.max(0.2, currentZoom - 0.25); // Min zoom 20%
        applyZoom();
    });

    function applyZoom() {
        zoomedImage.style.transform = `scale(${currentZoom})`;
        zoomLevelDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
    }

    let isDragging = false;
    let startX, startY, imgStartX, imgStartY;

    zoomedImage.parentElement.addEventListener('mousedown', (e) => { // Escuchar en el contenedor
        if (currentZoom > 1) { 
            isDragging = true;
            zoomedImage.style.cursor = 'grabbing';
            startX = e.pageX;
            startY = e.pageY;
            imgStartX = zoomedImage.parentElement.scrollLeft;
            imgStartY = zoomedImage.parentElement.scrollTop;
        }
    });
    document.addEventListener('mouseleave', () => { // Escuchar en document para soltar fuera
        if (isDragging) {
            isDragging = false;
            zoomedImage.style.cursor = 'grab';
        }
    });
    document.addEventListener('mouseup', () => { // Escuchar en document
        if (isDragging) {
            isDragging = false;
            zoomedImage.style.cursor = 'grab';
        }
    });
    document.addEventListener('mousemove', (e) => { // Escuchar en document
        if (!isDragging) return;
        e.preventDefault();
        const walkX = (e.pageX - startX);
        const walkY = (e.pageY - startY);
        zoomedImage.parentElement.scrollLeft = imgStartX - walkX;
        zoomedImage.parentElement.scrollTop = imgStartY - walkY;
    });

    // --- DESCARGA ---
    function downloadSingleImage(imageObject) {
        if (!imageObject.resizedDataUrl) {
            alert("La imagen aún no ha sido procesada.");
            return;
        }
        const link = document.createElement('a');
        link.href = imageObject.resizedDataUrl;
        const nameParts = imageObject.file.name.split('.');
        const extension = imageObject.file.type.split('/')[1] || nameParts.pop(); // Usar el tipo MIME para la extensión
        const name = nameParts.join('.');
        link.download = `${name}_reducida.${extension}`; 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    downloadAllButton.addEventListener('click', () => {
        const processedImages = imageFiles.filter(img => img.status === 'done' && img.resizedDataUrl);
        if (processedImages.length === 0) {
            alert("No hay imágenes procesadas para descargar. Por favor, aplica el redimensionamiento primero.");
            return;
        }

        const zip = new JSZip();
        processedImages.forEach(imgObj => {
            const base64Data = imgObj.resizedDataUrl.split(',')[1];
            const nameParts = imgObj.file.name.split('.');
            const extension = imgObj.file.type.split('/')[1] || nameParts.pop();
            const name = nameParts.join('.');
            zip.file(`${name}_reducida.${extension}`, base64Data, { base64: true });
        });

        downloadAllButton.textContent = "Generando ZIP...";
        downloadAllButton.disabled = true;

        zip.generateAsync({ type: "blob" }, (metadata) => {
            // Podrías usar metadata.percent aquí para un indicador de progreso si fuera necesario
            // console.log("Progreso ZIP: " + metadata.percent.toFixed(2) + " %");
        })
        .then(function(content) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = "imagenes_reducidas.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            downloadAllButton.textContent = "Descargar Todas (.zip)";
            updateGlobalButtonsState();
        })
        .catch(err => {
            console.error("Error al generar el ZIP:", err);
            alert("Hubo un error al generar el archivo ZIP.");
            downloadAllButton.textContent = "Descargar Todas (.zip)";
            updateGlobalButtonsState();
        });
    });


    // --- LIMPIAR ---
    clearAllButton.addEventListener('click', () => {
        imageFiles = [];
        imagePreviewContainer.innerHTML = '';
        fileInput.value = ''; 
        updateGlobalButtonsState();
        percentageSlider.value = "50"; // Reset slider
        percentageValue.textContent = "50%";
    });

    // --- UTILIDADES ---
    function formatBytes(bytes, decimals = 2) {
        if (bytes == null || bytes === 0) return '0 Bytes'; // --- MODIFICADO: manejar null/undefined ---
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Inicializar estado de botones
    updateGlobalButtonsState();
});