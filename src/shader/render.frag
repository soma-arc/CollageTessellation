#version 300 es
precision mediump float;

in vec2 v_texCoord;

struct Point {
    vec2 p;
    float radius;
};

struct FundamentalDomain {
    vec2 leftBottom;
    vec2 leftTop;
    vec2 rightTop;
    vec2 rightBottom;
    float pointRadius;
};

uniform vec2 u_resolution;
uniform FundamentalDomain u_fundamentalDomain0;
uniform float u_scale;
uniform vec2 u_translate;

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec4 gammaCorrect(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

vec3 hsv2rgb(float h, float s, float v){
    vec3 c = vec3(h, s, v);
    const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec3 computeColor(float loopNum) {
    return hsv2rgb(0.01 + 0.05 * (loopNum -1.), 1., 1.);
}

bool inRect(vec2 p, vec2 leftTop, vec2 rightTop, vec2 rightBottom, vec2 leftBottom) {
    const mat2 rotate90CounterClockwise = mat2(0, -1,
                                               1, 0);
    vec2 v1 = rightTop - leftTop;
    vec2 n1 = v1 * rotate90CounterClockwise;
    vec2 v2 = rightBottom - rightTop;
    vec2 n2 = v2 * rotate90CounterClockwise;
    vec2 v3 = leftBottom - rightBottom;
    vec2 n3 = v3 * rotate90CounterClockwise;
    vec2 v4 = leftTop - leftBottom;
    vec2 n4 = v4 * rotate90CounterClockwise;

    vec2 pv1 = p - leftTop;
    vec2 pv2 = p - rightTop;
    vec2 pv3 = p - rightBottom;
    vec2 pv4 = p - leftBottom;

    return (dot(pv1, n1) < 0. &&
            dot(pv2, n2) < 0. &&
            dot(pv3, n3) < 0. &&
            dot(pv4, n4) < 0.);
}

void IIS(vec2 p, out vec3 color) {
    float width = u_fundamentalDomain0.rightTop.x - u_fundamentalDomain0.leftTop.x;
    float height = u_fundamentalDomain0.leftTop.y - u_fundamentalDomain0.leftBottom.y;

    if(inRect(p, u_fundamentalDomain0.leftTop, u_fundamentalDomain0.rightTop, u_fundamentalDomain0.rightBottom, u_fundamentalDomain0.leftBottom))
        {
            color = vec3(0, 0, 1);
            return;
        }

    for(int i = 0; i < 1000; i++) {
        float inv = abs(floor(p.y / height));
        p.y = mod(p.y, height);
        float coloringStep = mod(inv, 4.0) + 1.0;
        vec2 v = normalize(u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom);
        float a = v.y / v.x;
        float x = p.y / a;
        // 色を横にずらす
        // float invOffset = mod(inv, 2.0) * (width * 0.5);
        inv += abs(floor((p.x - x) / width));

        p.x = mod(p.x, width) + x;

        if(inRect(p, u_fundamentalDomain0.leftTop, u_fundamentalDomain0.rightTop, u_fundamentalDomain0.rightBottom, u_fundamentalDomain0.leftBottom))
            {
                color = computeColor(inv);
                return;
            }
    }
}

bool renderUI(vec2 p, out vec3 color) {
    if(distance(p, u_fundamentalDomain0.leftBottom) < u_fundamentalDomain0.pointRadius) {
        color = vec3(1);
        return true;
    }

    if(distance(p, u_fundamentalDomain0.leftTop) < u_fundamentalDomain0.pointRadius)  {
        color = vec3(1);
        return true;
    }

    if(distance(p, u_fundamentalDomain0.rightTop) < u_fundamentalDomain0.pointRadius)  {
        color = vec3(1);
        return true;
    }

    if(distance(p, u_fundamentalDomain0.rightBottom) < u_fundamentalDomain0.pointRadius)  {
        color = vec3(1);
        return true;
    }

    return false;
}

out vec4 outColor;
void main() {
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    vec2 position = ((gl_FragCoord.xy) / u_resolution.yy ) - vec2(ratio, 0.5);
    position *= u_scale;
    position += u_translate;
    vec3 color;
    bool rendered = renderUI(position, color);

    if(!rendered) {
        IIS(position, color);
    }

    vec4 c = vec4(color, 1);
    outColor = gammaCorrect(c);
}
