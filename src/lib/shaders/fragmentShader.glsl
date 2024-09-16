#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;

// Improved random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D Noise function
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 st = gl_FragCoord.xy / 500.0; // Fixed scale factor
    
    // Background gradient
    vec3 color = mix(vec3(0.0, 0.0, 0.1), vec3(0.0, 0.2, 0.3), st.y);
    
    // Slower time for overall movement
    float slowTime = u_time * 1.
;
    
    // Add wave-like particles
    for (int i = 0; i < 200; i++) {
        float fi = float(i);
        vec2 pos = vec2(
            fract(sin(fi * 0.123) * 43758.5453),
            fract(cos(fi * 0.456) * 43758.5453)
        );
        
        // Wave-like movement
        pos.x += 0.04 * sin(slowTime + pos.y * 10.0);
        pos.y += 0.02 * cos(slowTime * 0.5 + pos.x * 12.0);
        
        // Add some noise for more natural movement
        pos += vec2(noise(pos + slowTime * 0.2), noise(pos + slowTime * 0.3)) * 0.02;
        
        float size = 0.002 + 0.001 * sin(slowTime + fi);
        
        // Smooth fading
        float fadeSpeed = 0.5 + random(vec2(fi)) * 2.; // Randomize fade speed per particle
        float fade = 0.5 + 0.5 * sin(slowTime * fadeSpeed + fi);
        
        // Create more complex particle shape
        float d = length(st - pos);
        float particle = smoothstep(size, size * 0.5, d) * fade;
        particle += smoothstep(size * 3.0, size, d) * fade * 0.3; // Add glow
        
        // Smooth color change from particle to particle
        vec3 particleColor = vec3(
            0.5 + 0.5 * sin(fi * 0.1),
            0.5 + 0.5 * sin(fi * 0.1 + 2.0),
            1.0
        );
        
        color += particleColor * particle * (1.0 - st.y * 0.5); // Fade towards top
    }
    
    gl_FragColor = vec4(color, 1.0);
}