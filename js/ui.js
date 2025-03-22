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
     * Configura el tamaño del canvas para que coincida exactamente con la cámara
     */
    setupCanvas() {
        const { video, video2, canvas, canvas2 } = AppConfig.elements;

        // Función para ajustar el canvas al tamaño exacto del video
        const adjustCanvasSize = () => {
            // Obtener el tamaño real del video (respetando su relación de aspecto)
            const videoWidth = video.videoWidth || 640;
            const videoHeight = video.videoHeight || 480;

            // Establecer el tamaño interno del canvas para coincidir con el video
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            canvas2.width = videoWidth;
            canvas2.height = videoHeight;

            // Ajustar el CSS del canvas para mantener la relación de aspecto
            // mientras se ajusta a la altura de la pantalla
            const aspectRatio = videoWidth / videoHeight;
            const viewportHeight = window.innerHeight;
            const canvasHeight = viewportHeight;
            const canvasWidth = canvasHeight * aspectRatio;

            canvas.style.height = `${canvasHeight}px`;
            canvas.style.width = `${canvasWidth}px`;
            canvas2.style.height = `${canvasHeight}px`;
            canvas2.style.width = `${canvasWidth}px`;

            console.log(`Canvas ajustado al tamaño del video: ${canvas.width}x${canvas.height} (CSS: ${canvasWidth}x${canvasHeight})`);
        };

        // Ajustar inicialmente con valores por defecto
        adjustCanvasSize();

        // Ajustar cuando el video tenga metadatos disponibles
        video.addEventListener('loadedmetadata', adjustCanvasSize);

        // Ajustar cada vez que cambie el tamaño del video
        video.addEventListener('resize', adjustCanvasSize);

        // Aplicar cambios específicos para el modo VR si está activo
        if (AppConfig.vrMode) {
            this.applyVRModeStyles();
        }
    },
    /**
         * Aplica estilos específicos para el modo VR
         */
    applyVRModeStyles() {
        const { canvas, canvas2 } = AppConfig.elements;

        // Forzar la visibilidad del segundo canvas
        canvas2.style.display = 'block';
        document.querySelectorAll('#videoContainer.right').forEach(el => {
            el.style.display = 'block';
        });

        // En modo VR, los canvas ocupan cada uno la mitad del ancho
        if (AppConfig.vrMode) {
            document.querySelectorAll('#videoContainer.left').forEach(el => {
                el.style.width = '50%';
                el.style.left = '0';
            });

            document.querySelectorAll('#videoContainer.right').forEach(el => {
                el.style.width = '50%';
                el.style.left = '50%';
            });

            canvas.style.left = '25%';
            canvas2.style.left = '75%';
        }
    },

    /**
     * Alternar modo VR
     */
    toggleVRMode() {
        const { vrModeBtn } = AppConfig.elements;

        AppConfig.vrMode = !AppConfig.vrMode;

        if (AppConfig.vrMode) {
            // Activar modo VR
            document.body.classList.add('vr-mode');
            vrModeBtn.classList.add('active');

            // Mostrar el segundo contenedor de video y canvas
            document.querySelectorAll('#videoContainer.right').forEach(el => {
                el.style.display = 'block';
            });
            document.querySelectorAll('#output_canvas2.right').forEach(el => {
                el.style.display = 'block';
            });

            // Aplicar estilos específicos para VR
            this.applyVRModeStyles();

            // Ya no necesitamos intentar reproducir el video2,
            // ahora dibujamos frames del video principal en su lugar
        } else {
            // Desactivar modo VR
            document.body.classList.remove('vr-mode');
            vrModeBtn.classList.remove('active');

            // Ocultar el segundo contenedor de video y canvas
            document.querySelectorAll('#videoContainer.right').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('#output_canvas2.right').forEach(el => {
                el.style.display = 'none';
            });

            // Restaurar el tamaño/posición original
            document.querySelectorAll('#videoContainer.left').forEach(el => {
                el.style.width = '';
                el.style.left = '';
            });

            const { canvas } = AppConfig.elements;
            canvas.style.left = '50%';
            canvas.style.transform = 'translateX(-50%)';
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