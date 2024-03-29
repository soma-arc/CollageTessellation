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

const int NUM_ORBITS = 10;

uniform vec2 u_resolution;
uniform FundamentalDomain u_fundamentalDomain0;
uniform float u_scale;
uniform vec2 u_translate;
uniform Point u_orbitOrigin;

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(const vec2 co, const float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
    seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

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
    return hsv2rgb(0.2 * (loopNum), 1., 1.);
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
    vec2 v = normalize(u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom);

    if(inRect(p,
              u_fundamentalDomain0.leftTop,
              u_fundamentalDomain0.rightTop - vec2(width / 2.0, 0),
              (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0),
              (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5)){
        color = vec3(1, 1, 0);
        return;
    }

    if(inRect(p, u_fundamentalDomain0.leftTop, u_fundamentalDomain0.rightTop, u_fundamentalDomain0.rightBottom, u_fundamentalDomain0.leftBottom))
        {
            color = vec3(0, 0, 1);
            return;
        }

    bool inFund = true;
    float inv = 0.;
    for(int i = 0; i < 10; i++) {
        inFund = true;

        if(abs(floor(p.y / height)) > 0.){
            inv += abs(floor(p.y / height));
            p.y = mod(p.y, height);
            inFund = false;
        }

        float a = v.y / v.x;
        float x = p.y / a;
        if(abs(floor((p.x - x) / width)) > 0.){
            inv += abs(floor((p.x - x) / width));
            p.x = mod(p.x - x, width) + x;
            inFund = false;
        }

        if(inRect(p,
                  u_fundamentalDomain0.leftTop,
                  u_fundamentalDomain0.rightTop - vec2(width / 2.0, 0),
                  (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0),
                  (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5)){
            inFund = false;
        }

        if(inFund) break;
    }
    if(inFund)
        color = computeColor(inv);
    else
        color = vec3(0);
}

void IIS2(vec2 p, out vec3 color) {
    float width = u_fundamentalDomain0.rightTop.x - u_fundamentalDomain0.leftTop.x;
    float height = u_fundamentalDomain0.leftTop.y - u_fundamentalDomain0.leftBottom.y;
    vec2 v = normalize(u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom);
    vec2 center = (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0);

    bool inFund = true;
    float inv = 0.;
    for(int i = 0; i < 1000; i++) {
        inFund = true;

        float a = v.y / v.x;
        float x = p.y / a;
        if(p.x < u_fundamentalDomain0.leftBottom.x + x) {
            // 左側
            // 右下へ
            vec2 vv = center - u_fundamentalDomain0.leftTop;
            p = p + vv;
            inv--;
            inFund = false;
        } else if (p.x > u_fundamentalDomain0.rightBottom.x + x) {
            // 右側
            // 左上へ
            vec2 vv = center - u_fundamentalDomain0.rightBottom;
            p = p + vv;
            inv++;
            inFund = false;
        } else {
            // 中央
            if(p.y < u_fundamentalDomain0.leftBottom.y) {
                // 下
                if(p.x < width * 0.5 + x) {
                    // 左
                    float count = abs(floor(p.y / (height * 1.5)));
                    inv -= count;
                    float xx = height * 1.5 * count / a;
                    p = p + vec2(xx, height * 1.5 * count);
                } else {
                    // 右
                    // 左上へ移動
                    vec2 vv = center - u_fundamentalDomain0.rightBottom;
                    p = p + vv;
                    inv++;
                }
                inFund = false;
            } else if(p.y > u_fundamentalDomain0.leftTop.y) {
                // 上
                if(p.x < width * 0.5 + x) {
                    // 左
                    // 右下へ移動
                    vec2 vv = center - u_fundamentalDomain0.leftTop;
                    p = p + vv;
                    inv--;
                } else {
                    // 右
                    float count = abs(floor((p.y + height * 0.5) / (height * 1.5)));
                    inv += count;
                    float xx = height * 1.5 * count / a;
                    p = p - vec2(xx, height * 1.5 * count);
                }
                inFund = false;
            } else if(inRect(p,
                             u_fundamentalDomain0.leftTop,
                             u_fundamentalDomain0.rightTop - vec2(width / 2.0, 0),
                             (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0),
                             (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5)){
                // 左上
                // 右下へ移動させる
                vec2 vv = center - u_fundamentalDomain0.leftTop;
                p = p + vv;
                inv--;
                inFund = false;
            }
        }

        if(inFund) break;
    }
    if(inFund)
        color = computeColor(inv);
    else
        color = vec3(0);
}

vec2[NUM_ORBITS] computeOrbits(vec2 origin) {
    vec2 orbits[NUM_ORBITS];
    vec2 p = origin;
    orbits[0] = origin;

    float width = u_fundamentalDomain0.rightTop.x - u_fundamentalDomain0.leftTop.x;
    float height = u_fundamentalDomain0.leftTop.y - u_fundamentalDomain0.leftBottom.y;
    vec2 v = normalize(u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom);
    float a = v.y / v.x;
    bool inFund = true;
    int orbitIndex = 1;
    for(int i = 0; i < 10; i++) {
        inFund = true;
        if(abs(floor(p.y / height)) > 0.){
            p.y = mod(p.y, height);
            orbits[orbitIndex] = p;
            orbitIndex++;
            inFund = false;
        }

        float x = p.y / a;
        if(abs(floor((p.x - x) / width)) > 0.){
            p.x = mod(p.x - x, width) + x;
            orbits[orbitIndex] = p;
            orbitIndex++;
            inFund = false;
        }

        if(inRect(p,
                  u_fundamentalDomain0.leftTop,
                  u_fundamentalDomain0.rightTop - vec2(width / 2.0, 0),
                  (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0),
                  (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5)){
            p = vec2(p.x - width * 0.5, p.y);
            orbits[orbitIndex] = p;
            orbitIndex++;
            //p = p - v * dot(vec2(0, height), v);
            p = vec2(p.x - height / a, p.y - height);
            orbits[orbitIndex] = p;
            orbitIndex++;
            inFund = false;
        }

        if(inFund) break;
    }

    for(int i = orbitIndex; i < NUM_ORBITS; i++) {
        orbits[i] = p;
    }

    return orbits;
}

vec2[NUM_ORBITS] computeOrbits2(vec2 origin) {
    vec2 orbits[NUM_ORBITS];
    vec2 p = origin;
    orbits[0] = origin;

    float width = u_fundamentalDomain0.rightTop.x - u_fundamentalDomain0.leftTop.x;
    float height = u_fundamentalDomain0.leftTop.y - u_fundamentalDomain0.leftBottom.y;
    vec2 v = normalize(u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom);
    vec2 center = (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0);
    float a = v.y / v.x;
    bool inFund = true;
    int orbitIndex = 1;

    for(int i = 0; i < NUM_ORBITS; i++) {
        inFund = true;

        float x = p.y / a;
        if(p.x < u_fundamentalDomain0.leftBottom.x + x) {
            // 左側
            // 右下へ
            vec2 vv = center - u_fundamentalDomain0.leftTop;
            p = p + vv;
            orbits[orbitIndex] = p;
            orbitIndex++;
            inFund = false;
        } else if (p.x > u_fundamentalDomain0.rightBottom.x + x) {
            // 右側
            // 左上へ
            vec2 vv = center - u_fundamentalDomain0.rightBottom;
            p = p + vv;
            orbits[orbitIndex] = p;
            orbitIndex++;
            inFund = false;
        } else {
            // 中央
            if(p.y < u_fundamentalDomain0.leftBottom.y) {
                // 下
                if(p.x < width * 0.5 + x) {
                    // 左
                    float count = abs(floor(p.y / (height * 1.5)));
                    float xx = height * 1.5 * count / a;
                    p = p + vec2(xx, height * 1.5 * count);
                } else {
                    // 右
                    // 左上へ移動
                    vec2 vv = center - u_fundamentalDomain0.rightBottom;
                    p = p + vv;
                }
                orbits[orbitIndex] = p;
                orbitIndex++;
                inFund = false;
            } else if(p.y > u_fundamentalDomain0.leftTop.y) {
                // 上
                if(p.x < width * 0.5 + x) {
                    // 左
                    // 右下へ移動
                    vec2 vv = center - u_fundamentalDomain0.leftTop;
                    p = p + vv;
                } else {
                    // 右
                    float count = abs(floor((p.y + height * 0.5) / (height * 1.5)));
                    float xx = height * 1.5 * count / a;
                    p = p - vec2(xx, height * 1.5 * count);
                }
                orbits[orbitIndex] = p;
                orbitIndex++;
                inFund = false;
            } else if(inRect(p,
                             u_fundamentalDomain0.leftTop,
                             u_fundamentalDomain0.rightTop - vec2(width / 2.0, 0),
                             (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5 + vec2(width / 2.0, 0),
                             (u_fundamentalDomain0.leftTop - u_fundamentalDomain0.leftBottom) * 0.5)){
                // 左上
                // 右下へ移動させる
                vec2 vv = center - u_fundamentalDomain0.leftTop;
                p = p + vv;
                orbits[orbitIndex] = p;
                orbitIndex++;
                inFund = false;
            }
        }

        if(inFund) break;
    }

    for(int i = orbitIndex; i < NUM_ORBITS; i++) {
        orbits[i] = p;
    }

    return orbits;
}

bool renderOrbits(vec2 p, vec2[NUM_ORBITS] orbits, out vec3 color) {
    for(int i = 0; i < NUM_ORBITS; i++){
        if(distance(p, orbits[i]) < u_orbitOrigin.radius)  {
            color = hsv2rgb(0.2 * (float(i)) + 0.5, 1., 1.);
            return true;
        }
        if(i > 0) {
            vec2 p1 = orbits[i - 1];
            vec2 p2 = orbits[i];
            vec2 v = p2 - p1;
            vec2 n = normalize(vec2(-v.y, v.x));
            vec2 posP1 = p - p1;
            vec2 posP2 = p - p2;
            if(dot(posP1, posP2) < 0. &&
               abs(dot(n, posP1)) < .01) {
                color = vec3(0);
                return true;
            }
        }
    }
    return false;
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

    vec4 sum = vec4(0);
    const float sampleNum = 10.;
    for(float i = 0.; i < sampleNum; i++) {
        vec2 position = ((gl_FragCoord.xy + rand2n(gl_FragCoord.xy, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
        position *= u_scale;
        position += u_translate;
        vec3 color;

        vec2[NUM_ORBITS] orbits = computeOrbits2(u_orbitOrigin.p);

        bool rendered = renderUI(position, color);

        if(!rendered){
            rendered = renderOrbits(position, orbits, color);
        }

        if(!rendered) {
            IIS2(position, color);
        }

        sum += vec4(color, 1.0);
    }

    vec4 c = sum / sampleNum;
    outColor = gammaCorrect(c);
}
