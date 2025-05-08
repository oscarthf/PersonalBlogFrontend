


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

export const createDataTexture = (gl: WebGLRenderingContext, size: number): WebGLTexture => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
        const x = Math.random();
        const y = Math.random();
        // const vx = (Math.random() - 0.5) * 0.01;
        // const vy = (Math.random() - 0.5) * 0.01;
        const random_angle = Math.random() * Math.PI / 8 - Math.PI / 16;
        const vx = Math.sin(random_angle) * 0.01;
        const vy = -Math.cos(random_angle) * 0.01;
        data.set([x, y, vx, vy], i * 4);
    }

    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, size, size, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return tex;
}

export const createFramebuffer = (gl: WebGLRenderingContext, texture: WebGLTexture): WebGLFramebuffer => {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    return fb;
}
