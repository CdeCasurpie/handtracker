/**
 * Configuración del detector de manos
 * Contiene parámetros configurables y estado global de la aplicación
 */
const AppConfig = {
    // Estado de la aplicación
    isRunning: false,
    useFrontCamera: true,
    vrMode: false,
    lowResolutionMode: true, // Resolución baja por defecto para mejor rendimiento
    
    // Variables de rendimiento
    maxRenderFps: 15,  // FPS máximo para limitar el procesamiento
    modelComplexity: 0, // 0 = lite, 1 = full
    
    // Opciones de MediaPipe Hands
    handsOptions: {
        maxNumHands: 2,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    },
    
    // Parámetros de la cámara
    getCameraResolution() {
        return {
            width: this.lowResolutionMode ? 640 : 1280,
            height: this.lowResolutionMode ? 480 : 720
        };
    },
    
    // Puntos para dibujar (todos los puntos de la mano)
    // Cuando drawAllPoints es false, solo se dibujan los puntos importantes
    drawAllPoints: true,
    importantHandPoints: [0, 4, 8, 12, 16, 20],
    
    // Conexiones entre puntos de la mano para dibujar
    handConnections: [
        // Pulgar
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Índice
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Medio
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Anular
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Meñique
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palma
        [0, 5], [5, 9], [9, 13], [13, 17], [0, 17]
    ],
    
    // URLs para MediaPipe
    mediaPipeBaseUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/',

    // Referencia a los elementos DOM principales (se inicializan en UI.init())
    elements: {}
};