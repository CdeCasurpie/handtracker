/**
 * Inicialización de la aplicación
 * Este es el punto de entrada principal
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar UI
    UI.init();
    
    // Configurar el tamaño del canvas
    UI.setupCanvas();
    
    // Verificar si hay un parámetro en la URL para activar el modo VR automáticamente
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('vr') || urlParams.get('vr') === 'true') {
        setTimeout(() => {
            UI.toggleVRMode();
            console.log('Modo VR activado automáticamente');
        }, 1000);
    }
    
    // Iniciar el detector de manos
    const modelLoaded = HandDetector.init();
    
    if (modelLoaded) {
        // Inicializar el gestor de cámara
        CameraManager.init();
    }
    
    // Exponer API para depuración en consola
    window.HandDetectorApp = {
        config: AppConfig,
        ui: UI,
        camera: CameraManager,
        detector: HandDetector,
        renderer: Renderer
    };
    
    console.log('Aplicación de detector de manos inicializada');
});

// Gestión de errores globales
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
    
    // Actualizar interfaz en caso de error crítico
    try {
        UI.updateStatus(`Error: ${event.error.message || 'Error desconocido'}`);
    } catch (e) {
        // Fallback si la UI no está disponible
        console.error('Error al actualizar estado:', e);
    }
});

// Prevenir cierre accidental
window.addEventListener('beforeunload', (event) => {
    if (AppConfig.isRunning) {
        // Mostrar confirmación antes de salir si la cámara está activa
        event.preventDefault();
        event.returnValue = '¿Seguro que quieres salir? La detección de manos está activa.';
    }
});