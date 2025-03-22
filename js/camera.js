/**
 * Módulo CameraManager
 * Gestiona todos los aspectos relacionados con la cámara
 */
const CameraManager = {
    // Variables internas
    camera: null,
    stream: null,
    videoDevices: [],
    
    /**
     * Inicializa el módulo de cámara
     */
    init() {
        this.checkCameraDevices();
    },
    
    /**
     * Verifica los dispositivos de cámara disponibles
     */
    async checkCameraDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
                console.log("enumerateDevices() no soportado.");
                return;
            }
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            console.log(`Se encontraron ${this.videoDevices.length} dispositivos de video`);
            
            // Actualizar estado de los botones
            UI.updateButtonStates(AppConfig.isRunning, this.videoDevices);
            
        } catch (error) {
            console.error('Error al enumerar dispositivos:', error);
        }
    },
    
    /**
     * Inicia la cámara
     */
    startCamera() {
        try {
            UI.updateStatus("Iniciando cámara...");
            
            // Verificar si MediaPipe Camera está disponible
            if (typeof Camera !== 'undefined') {
                CameraManager.startCameraWithMediaPipe();
            } else {
                CameraManager.startCameraDirect();
            }
        } catch (error) {
            UI.updateStatus(`Error al iniciar la cámara: ${error.message}`);
            console.error(error);
        }
    },
    
    /**
     * Inicia la cámara usando MediaPipe Camera
     */
    startCameraWithMediaPipe() {
        try {
            // Obtener resolución según configuración
            const { width, height } = AppConfig.getCameraResolution();
            
            this.camera = new Camera(AppConfig.elements.video, {
                onFrame: async () => {
                    if (AppConfig.isRunning && !HandDetector.nextFrameScheduled) {
                        HandDetector.lastFrameProcessed = performance.now();
                        await HandDetector.hands.send({image: AppConfig.elements.video});
                    }
                },
                width: width,
                height: height,
                facingMode: AppConfig.useFrontCamera ? 'user' : 'environment'
            });
            
            // Iniciar la cámara
            this.camera.start().then(() => {
                UI.updateStatus("Cámara iniciada. Muestra tus manos.");
                AppConfig.isRunning = true;
                UI.updateButtonStates(true, this.videoDevices);
                HandDetector.resetFpsCounter();
                
                // Sincronizar el segundo video si estamos en modo VR
                if (AppConfig.vrMode && this.stream) {
                    AppConfig.elements.video2.srcObject = this.stream;
                    AppConfig.elements.video2.play();
                }
            }).catch(error => {
                UI.updateStatus(`Error con MediaPipe Camera: ${error.message}`);
                console.error(error);
                // Si falla, intentar método directo
                this.startCameraDirect();
            });
        } catch (error) {
            UI.updateStatus(`Error con MediaPipe Camera: ${error.message}`);
            console.error(error);
            // Si falla, intentar método directo
            this.startCameraDirect();
        }
    },
    
    /**
     * Inicia la cámara directamente con getUserMedia
     */
    startCameraDirect() {
        try {
            UI.updateStatus("Iniciando cámara directamente...");
            
            // Detener stream actual si existe
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }
            
            // Configuración de la cámara con resolución según configuración
            const { width, height } = AppConfig.getCameraResolution();
            
            // Configuración de la cámara
            const constraints = {
                video: {
                    facingMode: AppConfig.useFrontCamera ? 'user' : 'environment',
                    width: { ideal: width },
                    height: { ideal: height }
                },
                audio: false
            };
            
            // Para el método navegador estándar
            const handleSuccess = (mediaStream) => {
                this.stream = mediaStream;
                AppConfig.elements.video.srcObject = mediaStream;
                
                // Sincronizar el segundo video si estamos en modo VR
                if (AppConfig.vrMode) {
                    AppConfig.elements.video2.srcObject = mediaStream;
                    AppConfig.elements.video2.play();
                }
                
                // Configurar un bucle para procesar frames con límite de FPS
                const processFrame = () => {
                    if (AppConfig.isRunning && !HandDetector.nextFrameScheduled) {
                        HandDetector.lastFrameProcessed = performance.now();
                        HandDetector.nextFrameScheduled = true;
                        
                        HandDetector.hands.send({image: AppConfig.elements.video})
                            .finally(() => {
                                HandDetector.nextFrameScheduled = false;
                            });
                    }
                    
                    if (AppConfig.isRunning) {
                        requestAnimationFrame(processFrame);
                    }
                };
                
                AppConfig.elements.video.onloadedmetadata = () => {
                    AppConfig.elements.video.play();
                    AppConfig.isRunning = true;
                    UI.updateButtonStates(true, this.videoDevices);
                    UI.updateStatus("Cámara iniciada. Muestra tus manos.");
                    HandDetector.resetFpsCounter();
                    processFrame();
                };
            };
            
            const handleError = (error) => {
                UI.updateStatus(`Error con getUserMedia: ${error.name}`);
                console.error(error);
            };
            
            // Usar el método apropiado
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia(constraints)
                    .then(handleSuccess)
                    .catch(handleError);
            } else {
                // Método antiguo (fallback)
                const getUserMedia = navigator.getUserMedia || 
                                    navigator.webkitGetUserMedia || 
                                    navigator.mozGetUserMedia;
                
                if (getUserMedia) {
                    getUserMedia.call(navigator, constraints, handleSuccess, handleError);
                } else {
                    UI.updateStatus("Tu navegador no soporta acceso a la cámara");
                }
            }
            
        } catch (error) {
            UI.updateStatus(`Error al acceder a la cámara: ${error.message}`);
            console.error(error);
        }
    },
    
    /**
     * Detiene la cámara y limpia los recursos
     */
    stopCamera() {
        AppConfig.isRunning = false;
        HandDetector.nextFrameScheduled = false;
        
        // Detener cámara de MediaPipe si existe
        if (this.camera) {
            this.camera.stop();
        }
        
        // Detener streams directos si existen
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            AppConfig.elements.video.srcObject = null;
            AppConfig.elements.video2.srcObject = null;
        }
        
        UI.clearCanvases();
        UI.updateStatus("Cámara detenida");
        UI.updateButtonStates(false, this.videoDevices);
    },
    
    /**
     * Cambia entre cámaras frontal/trasera
     */
    async switchCamera() {
        AppConfig.useFrontCamera = !AppConfig.useFrontCamera;
        
        if (AppConfig.isRunning) {
            CameraManager.stopCamera();
            await new Promise(resolve => setTimeout(resolve, 300)); // Breve pausa
            CameraManager.startCamera();
        }
    }
};