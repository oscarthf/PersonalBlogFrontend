


export const createShader = (gl: WebGLRenderingContext, 
                              type: number,
                              source: string): WebGLProgram => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}

export const createProgram = (gl: WebGLRenderingContext,
                              vsSrc: string, 
                              fsSrc: string): WebGLProgram => {
    const program = gl.createProgram()!;
    const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Program link error: " + gl.getProgramInfoLog(program));
    }
    return program;
}

export const createInitialParticleData = (size: number,
                                          height_over_width: number,
                                          y_margin: number): Float32Array => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
        const x = Math.random();
        const y = Math.random() * ((1 + 2 * y_margin) - y_margin) * height_over_width;
        const random_angle = Math.random() * Math.PI / 8 - Math.PI / 16;
        const vx = Math.sin(random_angle) * 0.01;
        const vy = -Math.cos(random_angle) * 0.01;
        data.set([x, y, vx, vy], i * 4);
    }
    return data;
}

export const createAnimationOffsetsData = (size: number): Float32Array => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
        const x = Math.random();
        const y = Math.random();
        const z = Math.random();
        const w = Math.random();
        data.set([x, y, z, w], i * 4);
    }
    return data;
}

export const createFramebuffer = (gl: WebGLRenderingContext, texture: WebGLTexture): WebGLFramebuffer => {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return fb;
}
