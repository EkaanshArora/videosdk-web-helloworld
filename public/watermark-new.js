/** @import { VideoProcessor } from '@zoom/videosdk' */
class WatermarkProcessor extends VideoProcessor {
    context = null;
    watermarkImage = null;

    constructor(port, options) {
        super(port, options);
        port.addEventListener('message', (e) => {
            if (e.data.cmd === 'update_watermark_image') {
                this.updateWatermarkImage(e.data.data);
            }
        });
    }

    async processFrame(input, output) {
        this.renderFrame(input, output);
        return true;
    }

    onInit() {
        const canvas = this.getOutput();
        if (canvas) {
            this.context = canvas.getContext('2d');
            if (!this.context) {
                console.error('2D context could not be initialized.');
                return;
            }
        }
    }

    onUninit() {
        this.context = null;
        this.watermarkImage = null;
    }

    updateWatermarkImage(ibm) {
        this.watermarkImage = ibm;
    }

    renderFrame(input, output) {
        if (!this.context) return;
        this.context.drawImage(input, 0, 0, output.width, output.height);
        if (this.watermarkImage) {
            this.context.globalAlpha = 0.7;
            this.context.imageSmoothingEnabled = true;
            this.context.drawImage(
                this.watermarkImage,
                0,
                0,
                this.watermarkImage.width,
                this.watermarkImage.height
            );
            this.context.globalAlpha = 1.0;
        }
    }
}

/** @import { registerProcessor } from '@zoom/videosdk' */
registerProcessor('watermark-processor', WatermarkProcessor);
