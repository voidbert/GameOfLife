const frameTime = 16.666;
let lastRender;

let canvas, gl;
let renderProgram, computeProgram;
let quad, framebuffer;
let computeTex, renderTex;

function onrender(timeStamp) {
    if (lastRender && timeStamp - lastRender < frameTime) {
        requestAnimationFrame(onrender);
        return;
    }
    lastRender = timeStamp;

    // Compute next cell generation
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTex, 0);

    gl.useProgram(computeProgram);
    gl.bindTexture(gl.TEXTURE_2D, computeTex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Render new generation
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(renderProgram);
    gl.bindTexture(gl.TEXTURE_2D, renderTex);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Swap render and compute buffers
    let tmp = computeTex;
    computeTex = renderTex;
    renderTex = tmp;

    requestAnimationFrame(onrender);
}

function onresize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Resize game of life texture (will delete current game)
    gl.bindTexture(gl.TEXTURE_2D, renderTex);
    clearTexture(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    gl.bindTexture(gl.TEXTURE_2D, computeTex);
    clearTexture(gl.drawingBufferWidth, gl.drawingBufferHeight, true);

    // Reset shader dx and dy
    gl.useProgram(computeProgram);
    gl.uniform2f(gl.getUniformLocation(computeProgram, "delta"),
        1 / gl.drawingBufferWidth, 1 / gl.drawingBufferHeight);
}

function createShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

function createProgram(vertexSource, fragmentSource) {
    const vertexShader   = createShader(vertexSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(fragmentSource, gl.FRAGMENT_SHADER);

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    gl.useProgram(program);
    return program;
}

// Fills the currently bound texture with the color black or with random data
function clearTexture(width, height, fillRandom) {
    const pixel_count = 4 * width * height;
    const buffer = new ArrayBuffer(4 * pixel_count);
    const data = new Uint8Array(buffer);
    if (fillRandom) {
        for (let i = 0; i < pixel_count; i += 4) {
            data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
            data[i + 3] = (Math.random() < 0.25) * 255; // Fill 25% of the cells
        }
    } else {
        for (let i = 0; i < pixel_count; i++) {
            data[i] = 0;
        }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
}

function createTexture(width, height) {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

function initGL() {
    // Compile shaders
    renderProgram  = createProgram(renderVertexShaderSource,  renderFragmentShaderSource);
    gl.uniform1i(gl.getUniformLocation(renderProgram, "sampler"), 0);

    computeProgram = createProgram(computeVertexShaderSource, computeFragmentShaderSource);
    gl.uniform1i(gl.getUniformLocation(computeProgram, "sampler"), 0);

    // Create vertex buffer for square on screen
    const bufferData = new Float32Array([
        -1.0, -1.0, 0.0, 0.0,
        -1.0,  1.0, 0.0, 1.0,
         1.0, -1.0, 1.0, 0.0,
         1.0,  1.0, 1.0, 1.0
    ]);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); // This buffer is permanently bound
    gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0); // These attributes are also permanent
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, true , 16, 8);

    // Create textures for game of life
    gl.activeTexture(gl.TEXTURE0);
    computeTex = createTexture(gl.drawingBufferWidth, gl.drawingBufferHeight);
    renderTex  = createTexture(gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Create target framebuffer
    framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, renderTex, 0);
}

function onload() {
    canvas = document.getElementById("canvas");
    gl = canvas.getContext("webgl");

    if (gl instanceof WebGLRenderingContext) {
        initGL();
        onresize();
        requestAnimationFrame(onrender);
    } else {
        alert("WebGL not available!");
    }
}

window.addEventListener("load", onload);
window.addEventListener("resize", onresize);
