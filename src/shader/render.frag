#version 300 es
precision mediump float;

in vec2 v_texCoord;

struct Point {
    vec2 p;
    float radius;
};

uniform vec2 u_resolution;
uniform Point u_point0;
uniform Point u_point1;
uniform Point u_point2;
uniform Point u_point3;
uniform float u_scale;
uniform vec2 u_translate;

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec4 gammaCorrect(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

void render(vec2 p, out vec3 color) {
    if(distance(p, u_point0.p) < u_point0.radius) color = vec3(1);
    if(distance(p, u_point1.p) < u_point1.radius) color = vec3(1);
    if(distance(p, u_point2.p) < u_point2.radius) color = vec3(1);
    if(distance(p, u_point3.p) < u_point3.radius) color = vec3(1);        
}

out vec4 outColor;
void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec2 position = ((gl_FragCoord.xy) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= u_scale;
    position += u_translate;
    vec3 col;
    render(position, col);
    
    vec4 c = vec4(col, 1);
    outColor = gammaCorrect(c);
}
