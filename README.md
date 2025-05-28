# Optimizador Visual Simple 🖼️

## Descripción

**Optimizador Visual Simple** es una aplicación web intuitiva diseñada para redimensionar imágenes en lote directamente en el navegador. Está especialmente creada para usuarios sin experiencia en programas de diseño gráfico, permitiéndoles reducir el tamaño de las imágenes de forma rápida y sencilla mediante un porcentaje, manteniendo siempre la relación de aspecto.

El objetivo principal es facilitar la optimización de imágenes de alta resolución (hasta 10MB por imagen), con un potente sistema de compresión que busca reducir el tamaño del archivo final por debajo de 1MB, ideal para compartir en la web, correos electrónicos o simplemente para ahorrar espacio de almacenamiento.

## ✨ Características Principales

* **Carga Múltiple de Imágenes:** Sube varias imágenes a la vez mediante "arrastrar y soltar" o el selector de archivos.
* **Límite de Tamaño por Imagen:** Soporta imágenes de hasta 10MB.
* **Formatos Soportados:** JPEG, PNG, WEBP.
* **Redimensionamiento por Porcentaje:** Define fácilmente el nuevo tamaño de las imágenes con un slider (ej. 50% del tamaño original).
* **Mantenimiento de Relación de Aspecto:** Las imágenes nunca se distorsionan.
* **Compresión Inteligente:** Intenta reducir el tamaño de archivo de las imágenes (especialmente JPEG/WEBP) por debajo de 1MB ajustando la calidad, sin perder una calidad visual excesiva.
* **Procesamiento en el Navegador (Client-Side):** Tus imágenes no se suben a ningún servidor, garantizando privacidad y velocidad.
* **Vista Previa Interactiva:**
    * Miniaturas de todas las imágenes cargadas.
    * Vista detallada con **zoom** para inspeccionar la calidad de la imagen redimensionada.
    * Información del tamaño original y del nuevo tamaño (dimensiones y peso en KB/MB).
* **Eliminación Individual:** Permite quitar imágenes de la lista antes del procesamiento.
* **Descarga Flexible:**
    * Descarga imágenes procesadas individualmente.
    * Descarga todas las imágenes procesadas en un único archivo `.zip`.
* **Interfaz Amigable y Profesional:** Diseño limpio y fácil de usar.

## 🛠️ Tecnologías Utilizadas

* **HTML5:** Para la estructura semántica.
* **CSS3:** Para los estilos y el diseño responsivo.
* **JavaScript (ES6+):** Para toda la lógica de la aplicación, incluyendo:
    * Manipulación del DOM.
    * Procesamiento de imágenes con el elemento `<canvas>`.
    * Manejo de archivos.
* **JSZip:** Librería para la creación de archivos `.zip` en el lado del cliente.

## 🚀 Cómo Usar

1.  **Accede a la aplicación:**
    * [¡Pruébala aquí!] https://augustoalr.github.io/optimizador-visual-simple/ 

2.  **Paso 1: Carga tus Imágenes:**
    * Arrastra y suelta las imágenes en la zona indicada o haz clic para seleccionarlas desde tu ordenador.

3.  **Paso 2: Define el Porcentaje de Reducción:**
    * Usa el slider para elegir a qué porcentaje del tamaño original quieres reducir las imágenes (ej. 50%).

4.  **Paso 3: Aplica y Previsualiza:**
    * Haz clic en el botón "Aplicar y Previsualizar".
    * Las miniaturas se actualizarán con las imágenes redimensionadas.
    * Haz clic en cualquier miniatura para abrir una vista ampliada con zoom y verificar la calidad.
    * Si deseas, puedes eliminar imágenes individuales de la lista haciendo clic en la "X" sobre cada miniatura.

5.  **Paso 4: Descarga:**
    * Desde la vista ampliada, puedes descargar la imagen individual.
    * Usa el botón "Descargar Todas (.zip)" para obtener todas las imágenes procesadas en un archivo comprimido.
    * Utiliza "Limpiar Todo" para empezar de nuevo.

## 💡 Posibles Futuras Mejoras (TODO)

* [ ] Control manual de calidad para JPEGs/WEBPs.
* [ ] Opción para definir dimensiones exactas (ancho o alto) además del porcentaje.
* [ ] Soporte para más formatos de imagen (ej. GIF estáticos).
* [ ] Traducción a otros idiomas (i18n).
* [ ] Indicador de progreso más detallado para el procesamiento de lotes grandes.

---

