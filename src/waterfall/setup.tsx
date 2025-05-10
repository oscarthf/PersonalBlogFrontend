

export const loadSpriteImage = (gl: WebGLRenderingContext,
                                spriteImage: HTMLImageElement): WebGLTexture => {
    
    const spriteTex = gl.createTexture();
    
    gl.bindTexture(gl.TEXTURE_2D, spriteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, spriteImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    // save for use later during render
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, spriteTex);

    return spriteTex;

}

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

}

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

}