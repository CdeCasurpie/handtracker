/**
 * Módulo Renderer
 * Encargado de dibujar en el canvas los resultados de la detección
 */
const Renderer = {
    // Para modo VR: canvas de fondo para el segundo panel
    backgroundCanvas: null,
    backgroundCtx: null,
    
    /**
     * Inicializa recursos adicionales de renderizado
     */
    init() {
        // Crear un canvas oculto para duplicar el video en modo VR
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        this.backgroundCanvas.style.display = 'none';
        document.body.appendChild(this.backgroundCanvas);
    },

    /**
     * Dibuja el frame actual del video en el canvas de fondo (para modo VR)
     */
    drawVideoFrame() {
        if (!AppConfig.vrMode) return;
        
        const { video } = AppConfig.elements;
        const { backgroundCanvas, backgroundCtx } = this;
        
        // Asegurar que el canvas tenga el tamaño del video
        if (video.videoWidth && video.videoHeight) {
            if (backgroundCanvas.width !== video.videoWidth) {
                backgroundCanvas.width = video.videoWidth;
                backgroundCanvas.height = video.videoHeight;
            }
            
            // Dibujar el frame actual del video en el canvas de fondo
            try {
                backgroundCtx.drawImage(video, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
            } catch (e) {
                console.error("Error dibujando frame de video:", e);
            }
        }
    },
    /**
     * Dibuja los landmarks de las manos en un canvas específico
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {Object} results - Resultados de MediaPipe Hands
     */
    drawHandLandmarks(context, results) {
        // Procesar cada mano
        for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i];
            
            // Dibujar las conexiones (líneas)
            this.drawConnections(context, landmarks);
            
            // Dibujar los puntos importantes
            this.drawKeyPoints(context, landmarks);
            
            // Mostrar etiqueta de mano (izquierda/derecha)
            this.drawHandLabel(context, landmarks, results.multiHandedness[i].label);
        }
    },
    
    /**
     * Dibuja las conexiones entre puntos de la mano
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {Array} landmarks - Puntos de la mano
     */
    drawConnections(context, landmarks) {
        // Dibujar las conexiones (líneas)
        for (const [start, end] of AppConfig.handConnections) {
            context.beginPath();
            const startX = landmarks[start].x * context.canvas.width;
            const startY = landmarks[start].y * context.canvas.height;
            const endX = landmarks[end].x * context.canvas.width;
            const endY = landmarks[end].y * context.canvas.height;
            
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.strokeStyle = 'white';
            context.lineWidth = 2;
            context.stroke();
        }
    },
    
    /**
     * Dibuja los puntos clave de la mano
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {Array} landmarks - Puntos de la mano
     */
    drawKeyPoints(context, landmarks) {
        for (let j = 0; j < landmarks.length; j++) {
            // Si drawAllPoints es false, solo dibujar puntos importantes
            if (!AppConfig.drawAllPoints && !AppConfig.importantHandPoints.includes(j)) continue;
            
            const x = landmarks[j].x * context.canvas.width;
            const y = landmarks[j].y * context.canvas.height;
            
            // Las puntas de los dedos tienen círculos más grandes
            const isFingertip = [4, 8, 12, 16, 20].includes(j);
            const isPalmCenter = j === 0;
            const isJoint = !isFingertip && !isPalmCenter;
            const radius = isFingertip ? 8 : (isJoint ? 3 : 5);
            
            // Punto central (centro de la palma) con diamante
            if (isPalmCenter) {
                this.drawPalmCenter(context, x, y);
            } 
            // Puntas de los dedos con círculos grandes
            else if (isFingertip) {
                this.drawFingertip(context, x, y, radius);
            }
            // Articulaciones con círculos pequeños
            else {
                this.drawJoint(context, x, y, radius);
            }
        }
    },
    
    /**
     * Dibuja el centro de la palma como un diamante
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     */
    drawPalmCenter(context, x, y) {
        // Dibujar un diamante en el centro de la palma
        context.beginPath();
        context.moveTo(x, y - 10); // Arriba
        context.lineTo(x + 10, y); // Derecha
        context.lineTo(x, y + 10); // Abajo
        context.lineTo(x - 10, y); // Izquierda
        context.closePath();
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();
    },
    
    /**
     * Dibuja la punta de un dedo como un círculo
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} radius - Radio del círculo
     */
    drawFingertip(context, x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = 'white';
        context.fill();
    },
    
    /**
     * Dibuja una articulación como un círculo pequeño
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {number} radius - Radio del círculo
     */
    drawJoint(context, x, y, radius) {
        context.beginPath();
        context.arc(x, y, radius, 0, 2 * Math.PI);
        context.fillStyle = 'white';
        context.fill();
    },
    
    /**
     * Dibuja la etiqueta de la mano (izquierda/derecha)
     * @param {CanvasRenderingContext2D} context - Contexto del canvas
     * @param {Array} landmarks - Puntos de la mano
     * @param {string} handedness - Etiqueta de la mano (Left/Right)
     */
    drawHandLabel(context, landmarks, handedness) {
        const wristX = landmarks[0].x * context.canvas.width;
        const wristY = landmarks[0].y * context.canvas.height;
        
        context.font = '16px Arial';
        context.fillStyle = 'white';
        context.fillText(handedness, wristX - 20, wristY - 20);
    }
};