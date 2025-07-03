/** @import { VideoProcessor } from '@zoom/videosdk' */
class GLProcessor extends VideoProcessor {
    gl = null;
    program = null;
    quadVBO = null;
    videoTex = null;

    constructor(port, options) {
        super(port, options);
    }

    onInit() {
        const output = this.getOutput();
        if (!output) return;
        this.gl = output.getContext("webgl2", { alpha: true });
        if (!this.gl) return;
        this._initWebGL();
    }

    onUninit() { }

    async processFrame(input, output) {
        if (!this.gl || !this.program || !this.quadVBO || !this.videoTex) return false;

        const gl = this.gl;
        gl.viewport(0, 0, output.width, output.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Upload video frame to texture
        const bitmap = await createImageBitmap(input);
        input.close();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        bitmap.close();

        // Draw video frame
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.uniform1i(gl.getUniformLocation(this.program, 'u_tex'), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Draw magenta square overlay
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(output.width / 2 - 50, output.height / 2 - 50, 100, 100);
        gl.clearColor(1, 0, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.SCISSOR_TEST);

        return true;
    }

    _initWebGL() {
        const gl = this.gl;

        const createShader = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                throw new Error(gl.getShaderInfoLog(shader));
            }
            return shader;
        };

        const vs = createShader(gl.VERTEX_SHADER, `#version 300 es
        in vec2 a_pos; out vec2 v_uv;
        void main() {
          v_uv = vec2((a_pos.x + 1.0) * 0.5, (-a_pos.y + 1.0) * 0.5);
          gl_Position = vec4(a_pos, 0, 1);
        }`);

        const fs = createShader(gl.FRAGMENT_SHADER, `#version 300 es
        precision mediump float;
        in vec2 v_uv; uniform sampler2D u_tex; out vec4 outColor;
        void main() { outColor = texture(u_tex, v_uv); }`);

        // Link program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error(gl.getProgramInfoLog(this.program));
        }

        // Setup quad VBO
        this.quadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const posLoc = gl.getAttribLocation(this.program, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        // Setup video texture
        this.videoTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.videoTex);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
}

/** @import { registerProcessor } from '@zoom/videosdk' */
registerProcessor('gl-processor', GLProcessor);