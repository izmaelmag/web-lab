// Fragment Shader
precision mediump float;

uniform float u_time;

void main() {
    vec2 center = vec2(512.0 * 0.5, 512.0 * 0.5);
    vec2 pos = gl_FragCoord.xy - center;
    float angle = atan(pos.y, pos.x);
    float radius = length(pos) / 800.0; // 512 / 2 = 256

    // Normalize the angle to be between 0 and 1
    float normalizedAngle = (angle + 3.14159265) / (2.0 * 3.14159265);

    // Add time to the angle for animation
    normalizedAngle += u_time * .5; // Adjust speed of rotation here

    // Convert angle to RGB using a simple color wheel logic
    vec3 color = vec3(
        0.5 + 0.5 * cos(normalizedAngle * 2.0 * 3.14159265 + 0.0),
        0.5 + 0.5 * cos(normalizedAngle * 2.0 * 3.14159265 + 2.0943951), // 120 degrees offset
        0.5 + 0.5 * cos(normalizedAngle * 2.0 * 3.14159265 + 4.1887902)  // 240 degrees offset
    );

    // Apply a simple radial gradient to fade out towards the edges
    float gradient = 1.0 - smoothstep(0.4, 0.5, radius); // Adjust these values for different gradient effects

    gl_FragColor = vec4(color * gradient, 1.0);
}