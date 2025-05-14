
type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

export const getMousePos = (canvas: HTMLCanvasElement,
                            evt: MouseEvent,
                            height_over_width: number): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / rect.width;
    const y_pre = 1 - (evt.clientY - rect.top) / rect.height;
    const y = y_pre * height_over_width;
    return { x, y };
};

export const getTouchPos = (canvas: HTMLCanvasElement, 
                            evt: TouchEvent,
                            height_over_width: number): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const touch = evt.touches[0] || evt.changedTouches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y_pre = 1 - (touch.clientY - rect.top) / rect.height;
    const y = y_pre * height_over_width;
    return { x, y };
};

export const createTextureFromImageOrSize = (
    gl: GLContext,
    imageData: HTMLImageElement | Float32Array | null,
    width: number,
    height: number,
    internalFormat: GLenum, // e.g., gl.RGBA, gl.R32F (WebGL2)
    format: GLenum,         // e.g., gl.RGBA
    type: GLenum,           // e.g., gl.UNSIGNED_BYTE, gl.FLOAT
    minMagFilter: GLenum,   // e.g., gl.LINEAR, gl.NEAREST
    wrapMode: GLenum        // e.g., gl.CLAMP_TO_EDGE, gl.REPEAT
): WebGLTexture => {
    const tex = gl.createTexture();
    if (!tex) throw new Error("Failed to create WebGL texture.");

    gl.bindTexture(gl.TEXTURE_2D, tex);

    if (width > 0 && height > 0) {
        if (imageData instanceof HTMLImageElement) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                format,
                type,
                imageData
            );
        } else if (imageData instanceof Float32Array) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                width,
                height,
                0,
                format,
                type,
                imageData
            );
        } else {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                width,
                height,
                0,
                format,
                type,
                null
            );
        }
    } else {
        if (imageData instanceof HTMLImageElement) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                internalFormat,
                format,
                type,
                imageData
            );
        } else if (imageData instanceof Float32Array) {
            console.log("imageData is Float32Array but width and height are 0");
            throw new Error("imageData is Float32Array but width and height are 0");
        } else {
            console.log("imageData is null but width and height are 0");
            throw new Error("imageData is null but width and height are 0");
        }
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minMagFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, minMagFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapMode);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapMode);

    return tex;
};

export const loadSpriteImage = (gl: GLContext,
                                spriteImage: HTMLImageElement): WebGLTexture => {
    
    // const spriteTex = gl.createTexture();
    
    // gl.bindTexture(gl.TEXTURE_2D, spriteTex);
    // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteImage);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const spriteTex = createTextureFromImageOrSize(gl,
                                                   spriteImage,
                                                   0,
                                                   0,
                                                   gl.RGBA,
                                                   gl.RGBA,
                                                   gl.UNSIGNED_BYTE,
                                                   gl.NEAREST,
                                                   gl.CLAMP_TO_EDGE);
    
    // save for use later during render
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, spriteTex);

    return spriteTex;

};

export const createShader = (gl: GLContext, 
                              type: number,
                              source: string): WebGLProgram => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error("Shader compile error: " + gl.getShaderInfoLog(shader));
    }
    return shader;
};

export const createProgram = (gl: GLContext,
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
};

export const createFramebufferForSingleChannelTextures = (gl: GLContext, 
                                                          textures: WebGLTexture[]): WebGLFramebuffer => {
    const fb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    for (let i = 0; i < textures.length; i++) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, 
                                gl.COLOR_ATTACHMENT0 + i, 
                                gl.TEXTURE_2D, 
                                textures[i], 
                                0);
    }
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer incomplete:", status.toString(16));
    }
    return fb;
};

export const createTrailIndicesAndCorners = (particleCount: number, 
                                             particleTextureSize: number,
                                             trailHistoryLength: number,
                                             bezierCurveResoultion: number) => {

    const bezierCurveLength = bezierCurveResoultion - 1;
    const historyLength = trailHistoryLength - 1;

    const TRAIL_VERTS_PER_PARTICLE = 6 * bezierCurveLength * historyLength; // 6 verts per particle for trail ribbons
    const trailIndices = new Float32Array(particleCount * TRAIL_VERTS_PER_PARTICLE * 2);
    const trailCorners = new Float32Array(particleCount * TRAIL_VERTS_PER_PARTICLE);
    const trailSegments = new Float32Array(particleCount * TRAIL_VERTS_PER_PARTICLE);

    const cornerPattern = [-1, 1, -1, -1, 1, 1]; // left/right
    const segmentPattern = [0, 0, 1, 1, 0, 1];   // curr (0) or prev (1)

    // -1,1 (2,3)           1,1 (5)
    //   |  \                |
    //   |       \           |
    //   |            \      |
    //   |                 \ |
    // -1,0 (0) ----------- 1,0 (1,4)

    const particleTextureSizeInt = Math.floor(particleTextureSize);

    for (let i = 0; i < particleCount; i++) {
        const texX = i % particleTextureSizeInt;
        const texY = Math.floor(i / particleTextureSizeInt);
        for (let j = 0; j < historyLength; j++) {
            for (let b = 0; b < bezierCurveLength; b++) {
                for (let v = 0; v < 6; v++) {
                    const dst = i * TRAIL_VERTS_PER_PARTICLE + j * 6 * bezierCurveLength + b * 6 + v;
                    trailIndices[dst * 2 + 0] = texX;
                    trailIndices[dst * 2 + 1] = texY;
                    trailCorners[dst] = cornerPattern[v];
                    trailSegments[dst] = segmentPattern[v] + j * 2 * bezierCurveLength + b * 2;
                }
            }
        }
    }

    return {
        trailIndices,
        trailCorners,
        trailSegments,
    };
};

export const createParticleIndices = (particleCount: number, particleTextureSize: number) => {

    const indices = new Float32Array(particleCount * 2);
    for (let i = 0; i < particleCount; i++) {
        indices[i * 2 + 0] = i % particleTextureSize;
        indices[i * 2 + 1] = Math.floor(i / particleTextureSize);
    }

    return indices;

};

export const createParticleVertices = (sprite_quad_size: number) => {
    
    const quadVerts = new Float32Array([
      -sprite_quad_size, -sprite_quad_size,
      sprite_quad_size, -sprite_quad_size,
      -sprite_quad_size,  sprite_quad_size,
      -sprite_quad_size,  sprite_quad_size,
      sprite_quad_size, -sprite_quad_size,
      sprite_quad_size,  sprite_quad_size,
    ]);

    return quadVerts;

};

export const createInitialParticleData = (size: number,
                                          height_over_width: number,
                                          x_margin: number,
                                          y_margin: number): Float32Array => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
        const x = Math.random() * ((1 + 2 * x_margin) - x_margin);
        const y = Math.random() * ((1 + 2 * y_margin) - y_margin) * height_over_width;
        const random_angle = Math.random() * Math.PI / 8 - Math.PI / 16;
        const vx = Math.sin(random_angle) * 0.01;
        const vy = -Math.cos(random_angle) * 0.01;
        data.set([x, y, vx, vy], i * 4);
    }
    return data;
};

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
};
