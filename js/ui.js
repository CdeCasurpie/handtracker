/**
 * Módulo UI
 * Gestiona todos los elementos de la interfaz de usuario
 */
const UI = {
    /**
     * Inicializa todos los elementos de la UI y sus eventos
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.updatePerformanceControls();
    },

    /**
     * Guarda referencias a elementos DOM para acceso rápido
     */
    cacheElements() {
        const elements = {
            // Videos
            video: document.getElementById('webcam'),
            video2: document.getElementById('webcam2'),
            
            // Canvas
            canvas: document.getElementById('output_canvas'),
            canvas2: document.getElementById('output_canvas2'),
            
            // Contenedores
            videoContainers: document.querySelectorAll('#videoContainer'),
            outputCanvases: document.querySelectorAll('canvas'),
            
            // Controles de estado
            statusDiv: document.getElementById('status'),
            fpsDiv: document.getElementById('fps'),
            
            // Botones
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            switchCameraBtn: document.getElementById('switchCameraBtn'),
            vrModeBtn: document.getElementById('vrModeBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            
            // Sliders
            modelComplexitySlider: document.getElementById('modelComplexity'),
            renderFpsSlider: document.getElementById('renderFps'),
            complexityValueSpan: document.getElementById('complexityValue'),
            fpsValueSpan: document.getElementById('fpsValue')
        };
        
        // Guardar contextos de canvas
        elements.ctx = elements.canvas.getContext('2d');
        elements.ctx2 = elements.canvas2.getContext('2d');
        
        // Guardar referencia a elementos en AppConfig
        AppConfig.elements = elements;
    },
    
    /**
     * Configura los escuchadores de eventos para los controles de la UI
     */
    setupEventListeners() {
        const {
            startBtn, stopBtn, switchCameraBtn, vrModeBtn, fullscreenBtn,
            modelComplexitySlider, renderFpsSlider
        } = AppConfig.elements;
        
        // Botones principales
        startBtn.addEventListener('click', CameraManager.startCamera);
        stopBtn.addEventListener('click', CameraManager.stopCamera);
        switchCameraBtn.addEventListener('click', CameraManager.switchCamera);
        vrModeBtn.addEventListener('click', this.toggleVRMode);
        fullscreenBtn.addEventListener('click', this.toggleFullscreen);
        
        // Controles de rendimiento
        modelComplexitySlider.addEventListener('input', this.updateModelComplexity);
        renderFpsSlider.addEventListener('input', this.updateRenderFps);
        
        // Eventos de ventana
        window.addEventListener('resize', this.setupCanvas);
        window.addEventListener('orientationchange', () => {
            setTimeout(this.setupCanvas, 100);
        });
    },
    
    /**
     * Configura el tamaño del canvas para ajustarse a la pantalla
     */
    setupCanvas() {
        const { canvas, canvas2 } = AppConfig.elements;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Si estamos en modo de baja resolución, reducimos el tamaño del canvas
        const scaleFactor = AppConfig.lowResolutionMode ? 0.5 : 1.0;
        
        canvas.width = windowWidth * scaleFactor;
        canvas.height = windowHeight * scaleFactor;
        canvas2.width = windowWidth * scaleFactor;
        canvas2.height = windowHeight * scaleFactor;
        
        // Hacer que el canvas se vea a pantalla completa con CSS
        canvas.style.width = '100%';
        canvas.style.height = '100vh';
        canvas2.style.width = '100%';
        canvas2.style.height = '100vh';
        
        console.log(`Canvas configurado: ${canvas.width}x${canvas.height} (escalado a pantalla completa)`);
    },
    
    /**
     * Alternar modo VR
     */
    toggleVRMode() {
        const { vrModeBtn, videoContainers, outputCanvases } = AppConfig.elements;
        
        AppConfig.vrMode = !AppConfig.vrMode;
        
        if (AppConfig.vrMode) {
            // Activar modo VR
            document.body.classList.add('vr-mode');
            vrModeBtn.classList.add('active');
            videoContainers[1].style.display = 'block';
            outputCanvases[1].style.display = 'block';
            
            // Sincronizar el segundo video con el primero
            if (CameraManager.stream) {
                AppConfig.elements.video2.srcObject = CameraManager.stream;
                AppConfig.elements.video2.play();
            }
        } else {
            // Desactivar modo VR
            document.body.classList.remove('vr-mode');
            vrModeBtn.classList.remove('active');
            videoContainers[1].style.display = 'none';
            outputCanvases[1].style.display = 'none';
        }
    },
    
    /**
     * Activar modo pantalla completa
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
                .catch(err => {
                    alert(`Error al activar pantalla completa: ${err.message}`);
                });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    },
    
    /**
     * Actualiza la complejidad del modelo
     */
    updateModelComplexity() {
        const { modelComplexitySlider, complexityValueSpan } = AppConfig.elements;
        
        AppConfig.modelComplexity = parseInt(modelComplexitySlider.value);
        complexityValueSpan.textContent = AppConfig.modelComplexity;
        
        // Si cambiamos a complejidad 0 (lite), sugerimos dibujado simplificado
        // Si cambiamos a complejidad 1 (full), sugerimos dibujado completo
        AppConfig.drawAllPoints = AppConfig.modelComplexity === 1;
        
        if (HandDetector.hands) {
            HandDetector.hands.setOptions({
                modelComplexity: AppConfig.modelComplexity
            });
        }
    },
    
    /**
     * Actualiza el límite de FPS
     */
    updateRenderFps() {
        const { renderFpsSlider, fpsValueSpan } = AppConfig.elements;
        
        AppConfig.maxRenderFps = parseInt(renderFpsSlider.value);
        fpsValueSpan.textContent = AppConfig.maxRenderFps;
    },
    
    /**
     * Actualiza los valores iniciales de los controles de rendimiento
     */
    updatePerformanceControls() {
        const { modelComplexitySlider, renderFpsSlider, complexityValueSpan, fpsValueSpan } = AppConfig.elements;
        
        // Si la complejidad es 1, activamos dibujo de todos los puntos
        if (AppConfig.modelComplexity === 1) {
            AppConfig.drawAllPoints = true;
        }
        
        modelComplexitySlider.value = AppConfig.modelComplexity;
        renderFpsSlider.value = AppConfig.maxRenderFps;
        complexityValueSpan.textContent = AppConfig.modelComplexity;
        fpsValueSpan.textContent = AppConfig.maxRenderFps;
    },
    
    /**
     * Actualiza el estado de los botones según el estado de la aplicación
     * @param {boolean} isRunning - Si la cámara está funcionando
     * @param {Array} videoDevices - Lista de dispositivos de cámara disponibles
     */
    updateButtonStates(isRunning, videoDevices = []) {
        const { startBtn, stopBtn, switchCameraBtn } = AppConfig.elements;
        
        startBtn.disabled = isRunning;
        stopBtn.disabled = !isRunning;
        switchCameraBtn.disabled = videoDevices.length <= 1 || !isRunning;
        
        if (videoDevices.length > 1) {
            switchCameraBtn.style.display = 'flex';
        } else {
            switchCameraBtn.style.display = 'none';
        }
    },
    
    /**
     * Actualiza el texto de estado
     * @param {string} message - Mensaje a mostrar
     */
    updateStatus(message) {
        AppConfig.elements.statusDiv.textContent = message;
    },
    
    /**
     * Limpia ambos canvas
     */
    clearCanvases() {
        const { ctx, ctx2, canvas, canvas2 } = AppConfig.elements;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    }
};