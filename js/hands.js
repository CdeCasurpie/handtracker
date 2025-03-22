/**
 * Módulo HandDetector
 * Encargado de detectar y procesar las manos con MediaPipe
 */
const HandDetector = {
    // Variables internas
    hands: null,
    nextFrameScheduled: false,
    lastFrameProcessed: 0,
    
    // Variables para FPS
    lastFrameTime: 0,
    frameCount: 0,
    currentFps: 0,
    
    /**
     * Inicializa el detector de manos de MediaPipe
     */
    init() {
        try {
            UI.updateStatus("Cargando modelo...");
            
            this.hands = new Hands({
                locateFile: (file) => {
                    return `${AppConfig.mediaPipeBaseUrl}${file}`;
                }
            });
            
            // Configurar las opciones iniciales
            this.hands.setOptions({
                maxNumHands: AppConfig.handsOptions.maxNumHands,
                modelComplexity: AppConfig.modelComplexity,
                minDetectionConfidence: AppConfig.handsOptions.minDetectionConfidence,
                minTrackingConfidence: AppConfig.handsOptions.minTrackingConfidence
            });
            
            // Establecer callback para resultados
            this.hands.onResults(this.onResults);
            
            UI.updateStatus("Modelo cargado. Presiona 'Iniciar' para comenzar");
            UI.updateButtonStates(false, CameraManager.videoDevices);
            
            return true;
        } catch (error) {
            UI.updateStatus(`Error al cargar modelo: ${error.message}`);
            console.error(error);
            return false;
        }
    },
    
    /**
     * Reinicia el contador de FPS
     */
    resetFpsCounter() {
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
    },
    
    /**
     * Actualiza el contador de FPS
     */
    updateFPS() {
        const now = performance.now();
        this.frameCount++;
        
        if (now - this.lastFrameTime >= 1000) { // Calcular FPS cada segundo
            this.currentFps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
            AppConfig.elements.fpsDiv.textContent = `FPS: ${this.currentFps}`;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
    },
    
    /**
     * Programa el siguiente frame respetando el límite de FPS
     */
    scheduleNextFrame() {
        if (!AppConfig.isRunning || this.nextFrameScheduled) return;
        
        this.nextFrameScheduled = true;
        
        const now = performance.now();
        const timeToNextFrame = Math.max(0, 1000 / AppConfig.maxRenderFps - (now - this.lastFrameProcessed));
        
        setTimeout(() => {
            if (AppConfig.isRunning) {
                this.lastFrameProcessed = performance.now();
                this.nextFrameScheduled = false;
                this.hands.send({image: AppConfig.elements.video});
            }
        }, timeToNextFrame);
    },
    
    /**
     * Callback para procesar los resultados de MediaPipe
     * @param {Object} results - Resultados de detección de MediaPipe
     */
    onResults(results) {
        if (!AppConfig.isRunning) return;
        
        // Actualizar FPS
        HandDetector.updateFPS();
        
        // Limpiar ambos canvas
        UI.clearCanvases();
        
        // Verificar si se detectaron manos
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            UI.updateStatus(`Detectadas ${results.multiHandLandmarks.length} mano(s)`);
            
            // Procesar cada mano en ambos canvas
            Renderer.drawHandLandmarks(AppConfig.elements.ctx, results);
            
            if (AppConfig.vrMode) {
                Renderer.drawHandLandmarks(AppConfig.elements.ctx2, results);
            }
        } else {
            UI.updateStatus("No se detectaron manos");
        }
        
        // Programar el siguiente frame con límite de FPS
        HandDetector.scheduleNextFrame();
    }
};