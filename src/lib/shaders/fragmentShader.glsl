precision mediump float;

uniform float u_time;
uniform float u_swirl;
uniform float u_colorShift;
uniform float u_brightness;

// Function to generate 2D Perlin-like noise
vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    const float K1 = 0.366025404;
    const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1);
    vec2 a = p - i + (i.x + i.y) * K2;
    vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec2 b = a - o + K2;
    vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(60.0));
}

void main() {
    vec2 uv = gl_FragCoord.xy / vec2(512.0, 512.0);
    uv = uv * 2.0 - 1.0;
    
    // Create swirling effect
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    float swirl = sin(radius * 10.0 - u_time * u_swirl * 0.2) * 0.1;
    uv = vec2(radius * cos(angle + swirl), radius * sin(angle + swirl));
    
    // Generate base noise
    float n = noise(uv * 3.0 + u_time * 0.1);
    n += 0.5 * noise(uv * 6.0 - u_time * 0.2);
    n += 0.25 * noise(uv * 12.0 + u_time * 0.3);
    n = n * 0.5 + 0.5;
    
    // Create color palette
    vec3 color1 = vec3(0.0, 0.0, 0.0);
    vec3 color2 = vec3(1.0, 0.0, 0.0);
    vec3 color3 = vec3(0.0, 0.0, 0.0);
    
    // Mix colors based on noise and time
    vec3 color = mix(color1, color2, n);
    color = mix(color, color3, sin(u_time * u_colorShift) * 0.0 + 0.5);
    
    // Add some stars
    float stars = step(0.98, noise(uv * 50.0));
    color += stars * vec3(1.0);
    
    gl_FragColor = vec4(color, 1.0);
}