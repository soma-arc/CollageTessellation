#version 300 es

precision mediump float;

out vec4 outColor;

{% include "./2dUniforms.njk.frag" %}

// include Color constants, hsv2rgb, and blendCol
{% include "./color.njk.frag" %}

const int NUM_ORBIT_POINTS = 10;
vec2 g_orbitPoints[NUM_ORBIT_POINTS];

// from Syntopia http://blog.hvidtfeldts.net/index.php/2015/01/path-tracing-3d-fractals/
vec2 rand2n(const vec2 co, const float sampleIndex) {
    vec2 seed = co * (sampleIndex + 1.0);
    seed+=vec2(-1,1);
    // implementation based on: lumina.sourceforge.net/Tutorials/Noise.html
    return vec2(fract(sin(dot(seed.xy ,vec2(12.9898,78.233))) * 43758.5453),
                fract(cos(dot(seed.xy ,vec2(4.898,7.23))) * 23421.631));
}

// circle [x, y, radius, radius * radius]
vec2 circleInvert(const vec2 pos, const vec4 circle){
    vec2 p = pos - circle.xy;
    float d = length(p);
    return (p * circle.w)/(d * d) + circle.xy;
}

vec3 computeColor(float loopNum) {
    return hsv2rgb(0.01 + 0.05 * (loopNum -1.), 1., 1.);
}

const int MAX_ITERATIONS = 200;
bool IIS(vec2 pos, out vec4 col) {
    float invNum = 0.;
    bool inFund = true;
    vec4 c = vec4(0);
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if(i > u_maxIISIterations) break;
        inFund = true;

        {% for no in range(0, numCanvasSeed) %}
        vec2 canvasUV{{ n }}{{ no }} = (pos - u_canvasSeed{{ no }}.corner) / u_canvasSeed{{ no }}.size;
        if(0. < canvasUV{{ n }}{{ no }}.x && canvasUV{{ n }}{{ no }}.x < 1. &&
           0. < canvasUV{{ n }}{{ no }}.y && canvasUV{{ n }}{{ no }}.y < 1.) {
            //c = deGamma(textureLod(u_imageTextures[{{ CanvasSeedTexIndexes[no] }}], vec2(canvasUV{{ n }}{{ no }}.x, 1. - canvasUV{{ n }}{{ no }}.y), 0.0));
            c = deGamma(textureLod(u_canvasTextures[0], vec2(canvasUV{{ n }}{{ no }}.x, 1. - canvasUV{{ n }}{{ no }}.y), 0.0));
            if(c.w == 1.) {
                col = vec4(c.rgb, 1);
                return true;
            }
        }
        {% endfor %}

        {% for no in range(0, numTextureSeed) %}
        float u_texLen{{ no }} = distance(u_textureSeed{{ no }}.corner, u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size / 2.0);
        vec2 u_texCenter{{ no }} = u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size/2.0;
        mat2 u_texRotateM{{ no }} = mat2(cos(u_textureSeed{{ no }}.rotationRadian),
                                         -sin(u_textureSeed{{ no }}.rotationRadian),
                                         sin(u_textureSeed{{ no }}.rotationRadian),
                                         cos(u_textureSeed{{ no }}.rotationRadian));
        mat2 u_texInvRotateM{{ no }} = mat2(cos(-u_textureSeed{{ no }}.rotationRadian),
                                         -sin(-u_textureSeed{{ no }}.rotationRadian),
                                         sin(-u_textureSeed{{ no }}.rotationRadian),
                                         cos(-u_textureSeed{{ no }}.rotationRadian));
        pos -= u_texCenter{{ no }};
        pos = u_texRotateM{{ no }} * pos;
        vec2 uv{{ n }}{{ no }} = (pos + u_textureSeed{{ no }}.size * 0.5) / u_textureSeed{{ no }}.size;
        if(0. < uv{{ n }}{{ no }}.x && uv{{ n }}{{ no }}.x < 1. &&
           0. < uv{{ n }}{{ no }}.y && uv{{ n }}{{ no }}.y < 1.) {
            c = deGamma(textureLod(u_imageTextures[{{ TextureSeedTexIndexes[no] }}], vec2(uv{{ n }}{{ no }}.x, 1. - uv{{ n }}{{ no }}.y), 0.0));
            if(c.w == 1.) {
                col = vec4(c.rgb, 1);
                return true;
            }
        }
        pos = u_texInvRotateM{{ no }} * pos;
        pos += u_texCenter{{ no }};
        {% endfor %}

        {% for no in range(0, numVideoSeed) %}
        vec2 videoUV{{ n }}{{ no }} = (pos - u_videoSeed{{ no }}.corner) / u_videoSeed{{ no }}.size;
        if(0. < videoUV{{ n }}{{ no }}.x && videoUV{{ n }}{{ no }}.x < 1. &&
           0. < videoUV{{ n }}{{ no }}.y && videoUV{{ n }}{{ no }}.y < 1.) {
            c = deGamma(textureLod(u_videoTexture, vec2(videoUV{{ n }}{{ no }}.x, 1. - videoUV{{ n }}{{ no }}.y), 0.0));
            if(c.w == 1.) {
                col = vec4(c.rgb, 1);
                return true;
            }
        }
        {% endfor %}

        {% for n in range(0,  numCircle ) %}
        if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.centerAndRadius.z){
            pos = circleInvert(pos, u_circle{{ n }}.centerAndRadius);
            inFund = false;
            invNum++;
            continue;
        }
        {% endfor %}

        {% for n in range(0,  numCircleFromPoints) %}
        if(distance(pos, u_circleFromPoints{{ n }}.centerAndRadius.xy) < u_circleFromPoints{{ n }}.centerAndRadius.z){
            pos = circleInvert(pos, u_circleFromPoints{{ n }}.centerAndRadius);
            inFund = false;
            invNum++;
        }
        {% endfor %}

        {% for n in range(0, numHalfPlane ) %}
        pos -= u_halfPlane{{ n }}.p;
        float dHalfPlane{{ n }} = dot(pos, u_halfPlane{{ n }}.normal.xy);
        invNum += (dHalfPlane{{ n }} < 0.) ? 1. : 0.;
        inFund = (dHalfPlane{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dHalfPlane{{ n }}) * u_halfPlane{{ n }}.normal.xy;
        pos += u_halfPlane{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numParallelTranslation) %}
        pos -= u_translate{{ n }}.p;
        float hpd{{ n }} = dot(u_translate{{ n }}.normal.xy, pos);
        if(hpd{{ n }} < 0. || u_translate{{ n }}.normal.z < hpd{{ n }}) {
            invNum += abs(floor(hpd{{ n }} / u_translate{{ n }}.normal.z));
            pos -= u_translate{{ n }}.normal.xy * (hpd{{ n }} - mod(hpd{{ n }}, u_translate{{ n }}.normal.w/2.));

            inFund = false;
        }
        pos += u_translate{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numParallelInversions) %}
        pos -= u_parallelInversions{{ n }}.p;
        float hpdInv{{ n }} = dot(u_parallelInversions{{ n }}.normal.xy, pos);
        if(hpdInv{{ n }} < 0. || u_parallelInversions{{ n }}.normal.z < hpdInv{{ n }}) {
            invNum += abs(floor(hpdInv{{ n }} / u_parallelInversions{{ n }}.normal.z));
            pos -= u_parallelInversions{{ n }}.normal.xy * (hpdInv{{ n }} - mod(hpdInv{{ n }}, u_parallelInversions{{ n }}.normal.w));
            pos -= u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z;
            hpdInv{{ n }} = dot(pos, u_parallelInversions{{ n }}.normal.xy);
            pos -= 2.0 * max(0., hpdInv{{ n }}) * u_parallelInversions{{ n }}.normal.xy;
            pos += u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z;

            inFund = false;
        }
        pos += u_parallelInversions{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numGlideReflection) %}
        pos -= u_glideReflection{{ n }}.p;
        float glideInv{{ n }} = dot(u_glideReflection{{ n }}.normal.xy, pos);
        if(glideInv{{ n }} < 0. || u_glideReflection{{ n }}.normal.z < glideInv{{ n }}) {
          float ref = abs(floor(glideInv{{ n }} / u_glideReflection{{ n }}.normal.z));
          invNum += ref;
          pos -= u_glideReflection{{ n }}.normal.xy * (glideInv{{ n }} - mod(glideInv{{ n }}, u_glideReflection{{ n }}.normal.w/2.));
          if(mod(ref, 2.0) == 1.) {
              vec2 nGlide{{ n }} = vec2(-u_glideReflection{{ n }}.normal.y, u_glideReflection{{ n }}.normal.x);
              float dGlide{{ n }} = dot(pos, nGlide{{ n }});
              pos -= 2.0 *  dGlide{{ n }} * nGlide{{ n }};
          }
          inFund = false;
        }
        pos += u_glideReflection{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numCrossingInversions) %}
        pos -= u_crossingInversions{{ n }}.p;
        float dCI{{ n }} = dot(pos, u_crossingInversions{{ n }}.normal.xy);
        invNum += (dCI{{ n }} < 0.) ? 1. : 0.;
        inFund = (dCI{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dCI{{ n }}) * u_crossingInversions{{ n }}.normal.xy;
        pos += u_crossingInversions{{ n }}.p;

        pos -= u_crossingInversions{{ n }}.p;
        dCI{{ n }} = dot(pos, u_crossingInversions{{ n }}.normal.zw);
        invNum += (dCI{{ n }} < 0.) ? 1. : 0.;
        inFund = (dCI{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dCI{{ n }}) * u_crossingInversions{{ n }}.normal.zw;
        pos += u_crossingInversions{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numRotation) %}
        pos -= u_rotation{{ n }}.p;
        float dRot1{{ n }} = dot(pos, u_rotation{{ n }}.normal.xy);
        float dRot2{{ n }} = dot(pos, u_rotation{{ n }}.normal.zw);
        if(dRot1{{ n }} < 0. || dRot2{{ n }} < 0.) {
            invNum++;
            inFund = false;
            mat2 rotateM{{ n }} = mat2(cos(u_rotation{{ n }}.rotationRad),
                                       -sin(u_rotation{{ n }}.rotationRad),
                                       sin(u_rotation{{ n }}.rotationRad),
                                       cos(u_rotation{{ n }}.rotationRad));
            pos = rotateM{{ n }} * pos;
        }
        pos += u_rotation{{ n }}.p;
        {% endfor %}

        {% for n in range(0, numTwoCircles) %}
        if(distance(pos, u_hyperbolic{{ n }}.c1.xy) < u_hyperbolic{{ n }}.c1.z){
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c1);
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c2);

            inFund = false;
       }else if(distance(pos, u_hyperbolic{{ n }}.c1d.xy) >= u_hyperbolic{{ n }}.c1d.z){
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c2);
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c1);

            inFund = false;
        }
        {% endfor %}

        {% for n in range(0, numLoxodromic) %}
        if(distance(pos, u_loxodromic{{ n }}.c1.xy) < u_loxodromic{{ n }}.c1.z){
            pos -= u_loxodromic{{ n }}.c1.xy;
            pos -= 2.0 * dot(pos, u_loxodromic{{ n }}.line.zw) * u_loxodromic{{ n }}.line.zw;
            pos += u_loxodromic{{ n }}.c1.xy;

            pos = circleInvert(pos, u_loxodromic{{ n }}.c3);

            pos = circleInvert(pos, u_loxodromic{{ n }}.c1);
            pos = circleInvert(pos, u_loxodromic{{ n }}.c2);

            inFund = false;
       }else if(distance(pos, u_loxodromic{{ n }}.c1d.xy) >= u_loxodromic{{ n }}.c1d.z){
            pos = circleInvert(pos, u_loxodromic{{ n }}.c2);
            pos = circleInvert(pos, u_loxodromic{{ n }}.c1);

            pos = circleInvert(pos, u_loxodromic{{ n }}.c3);
            pos -= u_loxodromic{{ n }}.c1.xy;
            pos -= 2.0 * dot(pos, u_loxodromic{{ n }}.line.zw) * u_loxodromic{{ n }}.line.zw;
            pos += u_loxodromic{{ n }}.c1.xy;

            inFund = false;
        }
        {% endfor %}

        {% for n in range(0, numScaling) %}
        if(distance(pos, u_scaling{{ n }}.c1.xy) < u_scaling{{ n }}.c1.z){
            pos -= u_scaling{{ n }}.line1.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line1.zw) * u_scaling{{ n }}.line1.zw;
            pos += u_scaling{{ n }}.line1.xy;

            pos -= u_scaling{{ n }}.c2.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line2.zw) * u_scaling{{ n }}.line2.zw;
            pos += u_scaling{{ n }}.c2.xy;

            pos = circleInvert(pos, u_scaling{{ n }}.c1);
            pos = circleInvert(pos, u_scaling{{ n }}.c2);

            inFund = false;
       }else if(distance(pos, u_scaling{{ n }}.c1d.xy) >= u_scaling{{ n }}.c1d.z){
            pos = circleInvert(pos, u_scaling{{ n }}.c2);
            pos = circleInvert(pos, u_scaling{{ n }}.c1);

            pos -= u_scaling{{ n }}.c2.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line2.zw) * u_scaling{{ n }}.line2.zw;
            pos += u_scaling{{ n }}.c2.xy;

            pos -= u_scaling{{ n }}.line1.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line1.zw) * u_scaling{{ n }}.line1.zw;
            pos += u_scaling{{ n }}.line1.xy;

            inFund = false;
        }
        {% endfor %}

        if (inFund) break;
    }

    col = mix(u_backgroundColor, vec4(computeColor(invNum), 1), u_isRenderingGenerator);
    return (invNum == 0.) ? false : true;
}

bool renderOrbit(vec2 pos, out vec4 col, int numOrbit){
    col = vec4(0);
    for(int i = 0; i < numOrbit; i++) {
        if(distance(pos, g_orbitPoints[i]) < .01) {
            col = vec4(0, 0, 1, 1);
            return true;
        }
        if(i > 0) {
            vec2 p1 = g_orbitPoints[i - 1];
            vec2 p2 = g_orbitPoints[i];
            vec2 v = p2 - p1;
            vec2 n = normalize(vec2(-v.y, v.x));
            vec2 posP1 = pos - p1;
            vec2 posP2 = pos - p2;
            if(dot(posP1, posP2) < 0. &&
               abs(dot(n, posP1)) < .001) {
                col = vec4(0, 1, 1, 1);
                return true;
            }
        }
    }
    return false;
}

int computeOrbit(vec2 pos) {
    bool inFund = true;
    int orbitNum = 0;
    g_orbitPoints[orbitNum] = pos;
    orbitNum++;
    for (int i = 1; i < NUM_ORBIT_POINTS; i++) {
        inFund = true;

        {% for n in range(0,  numCircle ) %}
        if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.centerAndRadius.z){
            pos = circleInvert(pos, u_circle{{ n }}.centerAndRadius);
            g_orbitPoints[orbitNum] = pos;
            inFund = false;
            orbitNum++;
            continue;
        }
        {% endfor %}

        {% for n in range(0,  numCircleFromPoints) %}
        if(distance(pos, u_circleFromPoints{{ n }}.centerAndRadius.xy) < u_circleFromPoints{{ n }}.centerAndRadius.z){
            pos = circleInvert(pos, u_circleFromPoints{{ n }}.centerAndRadius);
            g_orbitPoints[orbitNum] = pos;
            inFund = false;
            orbitNum++;
            continue;
        }
        {% endfor %}

        {% for n in range(0, numHalfPlane ) %}
        pos -= u_halfPlane{{ n }}.p;
        float dHalfPlane{{ n }} = dot(pos, u_halfPlane{{ n }}.normal.xy);
        //orbitNum += (dHalfPlane{{ n }} < 0.) ? 1. : 0.;
        inFund = (dHalfPlane{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dHalfPlane{{ n }}) * u_halfPlane{{ n }}.normal.xy;
        pos += u_halfPlane{{ n }}.p;
        if (dHalfPlane{{ n }} < 0.){
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numParallelTranslation) %}
        pos -= u_translate{{ n }}.p;
        float hpd{{ n }} = dot(u_translate{{ n }}.normal.xy, pos);
        if(hpd{{ n }} < 0. || u_translate{{ n }}.normal.z < hpd{{ n }}) {
            //orbitNum += abs(floor(hpd{{ n }} / u_translate{{ n }}.normal.z));
            pos -= u_translate{{ n }}.normal.xy * (hpd{{ n }} - mod(hpd{{ n }}, u_translate{{ n }}.normal.w/2.));

            inFund = false;
        }
        pos += u_translate{{ n }}.p;
        if(hpd{{ n }} < 0. || u_translate{{ n }}.normal.z < hpd{{ n }}) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numParallelInversions) %}
        pos -= u_parallelInversions{{ n }}.p;
        float hpdInv{{ n }} = dot(u_parallelInversions{{ n }}.normal.xy, pos);
        if(hpdInv{{ n }} < 0. || u_parallelInversions{{ n }}.normal.z < hpdInv{{ n }}) {
            //orbitNum += abs(floor(hpdInv{{ n }} / u_parallelInversions{{ n }}.normal.z));
            pos -= u_parallelInversions{{ n }}.normal.xy * (hpdInv{{ n }} - mod(hpdInv{{ n }}, u_parallelInversions{{ n }}.normal.w));
            pos -= u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z;
            hpdInv{{ n }} = dot(pos, u_parallelInversions{{ n }}.normal.xy);
            pos -= 2.0 * max(0., hpdInv{{ n }}) * u_parallelInversions{{ n }}.normal.xy;
            pos += u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z;

            inFund = false;
        }
        pos += u_parallelInversions{{ n }}.p;
        if(hpdInv{{ n }} < 0. || u_parallelInversions{{ n }}.normal.z < hpdInv{{ n }}) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numGlideReflection) %}
        pos -= u_glideReflection{{ n }}.p;
        float glideInv{{ n }} = dot(u_glideReflection{{ n }}.normal.xy, pos);
        if(glideInv{{ n }} < 0. || u_glideReflection{{ n }}.normal.z < glideInv{{ n }}) {
          float ref = abs(floor(glideInv{{ n }} / u_glideReflection{{ n }}.normal.z));
          //orbitNum += ref;
          pos -= u_glideReflection{{ n }}.normal.xy * (glideInv{{ n }} - mod(glideInv{{ n }}, u_glideReflection{{ n }}.normal.w/2.));
          if(mod(ref, 2.0) == 1.) {
              vec2 nGlide{{ n }} = vec2(-u_glideReflection{{ n }}.normal.y, u_glideReflection{{ n }}.normal.x);
              float dGlide{{ n }} = dot(pos, nGlide{{ n }});
              pos -= 2.0 *  dGlide{{ n }} * nGlide{{ n }};
          }
          inFund = false;
        }
        pos += u_glideReflection{{ n }}.p;
        if(glideInv{{ n }} < 0. || u_glideReflection{{ n }}.normal.z < glideInv{{ n }}) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numCrossingInversions) %}
        pos -= u_crossingInversions{{ n }}.p;
        float dCI{{ n }} = dot(pos, u_crossingInversions{{ n }}.normal.xy);
        //orbitNum += (dCI{{ n }} < 0.) ? 1 : 0;
        inFund = (dCI{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dCI{{ n }}) * u_crossingInversions{{ n }}.normal.xy;
        pos += u_crossingInversions{{ n }}.p;
        if (dCI{{ n }} < 0.) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }

        pos -= u_crossingInversions{{ n }}.p;
        dCI{{ n }} = dot(pos, u_crossingInversions{{ n }}.normal.zw);
        //orbitNum += (dCI{{ n }} < 0.) ? 1 : 0;
        inFund = (dCI{{ n }} < 0. ) ? false : inFund;
        pos -= 2.0 * min(0., dCI{{ n }}) * u_crossingInversions{{ n }}.normal.zw;
        pos += u_crossingInversions{{ n }}.p;
        if (dCI{{ n }} < 0.) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numRotation) %}
        pos -= u_rotation{{ n }}.p;
        float dRot1{{ n }} = dot(pos, u_rotation{{ n }}.normal.xy);
        float dRot2{{ n }} = dot(pos, u_rotation{{ n }}.normal.zw);
        //orbitNum += (dRot1{{ n }} < 0. || dRot2{{ n }} < 0.) ? 1 : 0;
        if(dRot1{{ n }} < 0. || dRot2{{ n }} < 0.) {
            inFund = false;
            mat2 rotateM{{ n }} = mat2(cos(u_rotation{{ n }}.rotationRad),
                                       -sin(u_rotation{{ n }}.rotationRad),
                                       sin(u_rotation{{ n }}.rotationRad),
                                       cos(u_rotation{{ n }}.rotationRad));
            pos = rotateM{{ n }} * pos;
        }
        pos += u_rotation{{ n }}.p;
        if(dRot1{{ n }} < 0. || dRot2{{ n }} < 0.) {
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
        }
        {% endfor %}

        {% for n in range(0, numTwoCircles) %}
        if(distance(pos, u_hyperbolic{{ n }}.c1.xy) < u_hyperbolic{{ n }}.c1.z){
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c1);
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c2);
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
       }else if(distance(pos, u_hyperbolic{{ n }}.c1d.xy) >= u_hyperbolic{{ n }}.c1d.z){
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c2);
            pos = circleInvert(pos, u_hyperbolic{{ n }}.c1);
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
        }
        {% endfor %}

        {% for n in range(0, numLoxodromic) %}
        if(distance(pos, u_loxodromic{{ n }}.c1.xy) < u_loxodromic{{ n }}.c1.z){
            pos -= u_loxodromic{{ n }}.c1.xy;
            pos -= 2.0 * dot(pos, u_loxodromic{{ n }}.line.zw) * u_loxodromic{{ n }}.line.zw;
            pos += u_loxodromic{{ n }}.c1.xy;

            pos = circleInvert(pos, u_loxodromic{{ n }}.c3);

            pos = circleInvert(pos, u_loxodromic{{ n }}.c1);
            pos = circleInvert(pos, u_loxodromic{{ n }}.c2);

            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
       }else if(distance(pos, u_loxodromic{{ n }}.c1d.xy) >= u_loxodromic{{ n }}.c1d.z){
            pos = circleInvert(pos, u_loxodromic{{ n }}.c2);
            pos = circleInvert(pos, u_loxodromic{{ n }}.c1);

            pos = circleInvert(pos, u_loxodromic{{ n }}.c3);
            pos -= u_loxodromic{{ n }}.c1.xy;
            pos -= 2.0 * dot(pos, u_loxodromic{{ n }}.line.zw) * u_loxodromic{{ n }}.line.zw;
            pos += u_loxodromic{{ n }}.c1.xy;

            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
        }
        {% endfor %}

        {% for n in range(0, numScaling) %}
        if(distance(pos, u_scaling{{ n }}.c1.xy) < u_scaling{{ n }}.c1.z){
            pos -= u_scaling{{ n }}.line1.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line1.zw) * u_scaling{{ n }}.line1.zw;
            pos += u_scaling{{ n }}.line1.xy;

            pos -= u_scaling{{ n }}.c2.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line2.zw) * u_scaling{{ n }}.line2.zw;
            pos += u_scaling{{ n }}.c2.xy;

            pos = circleInvert(pos, u_scaling{{ n }}.c1);
            pos = circleInvert(pos, u_scaling{{ n }}.c2);
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
       }else if(distance(pos, u_scaling{{ n }}.c1d.xy) >= u_scaling{{ n }}.c1d.z){
            pos = circleInvert(pos, u_scaling{{ n }}.c2);
            pos = circleInvert(pos, u_scaling{{ n }}.c1);

            pos -= u_scaling{{ n }}.c2.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line2.zw) * u_scaling{{ n }}.line2.zw;
            pos += u_scaling{{ n }}.c2.xy;

            pos -= u_scaling{{ n }}.line1.xy;
            pos -= 2.0 * dot(pos, u_scaling{{ n }}.line1.zw) * u_scaling{{ n }}.line1.zw;
            pos += u_scaling{{ n }}.line1.xy;
            g_orbitPoints[orbitNum] = pos;
            orbitNum++;
            inFund = false;
        }
        {% endfor %}

        if (inFund) break;
    }
    return orbitNum;
}

bool renderEdgeOfSeed(vec2 pos, out vec4 color) {
    color = u_backgroundColor;

    {% for no in range(0, numCanvasSeed) %}
    if(u_canvasSeed{{ no }}.selected) {
        vec2 canvasUV{{ no }} = (pos - u_canvasSeed{{ no }}.corner) / u_canvasSeed{{ no }}.size;
        vec2 canvasCorner{{ no }} = u_canvasSeed{{ no }}.corner + u_canvasSeed{{ no }}.ui.xy;
        vec2 canvasCornerDiagonal{{ no }} = u_canvasSeed{{ no }}.corner + u_canvasSeed{{ no }}.size - u_canvasSeed{{ no }}.ui.xy;
        if(0. < canvasUV{{ no }}.x && canvasUV{{ no }}.x < 1. &&
           0. < canvasUV{{ no }}.y && canvasUV{{ no }}.y < 1. &&
           (pos.x < canvasCorner{{ no }}.x || canvasCornerDiagonal{{ no }}.x < pos.x ||
            pos.y < canvasCorner{{ no }}.y || canvasCornerDiagonal{{ no }}.y < pos.y)) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_canvasSeed{{ no }}.corner + u_canvasSeed{{ no }}.size/2.0) < u_canvasSeed{{ no }}.ui.z) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_canvasSeed{{ no }}.corner + u_canvasSeed{{ no }}.size/2.0) < u_canvasSeed{{ no }}.ui.z * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    {% endfor %}

    {% for no in range(0, numTextureSeed) %}
    if(u_textureSeed{{ no }}.selected) {
        vec2 uvTextureSeed{{ no }} = (pos - u_textureSeed{{ no }}.corner) / u_textureSeed{{ no }}.size;
        vec2 bodyCorner{{ no }} = u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.ui.xy;
        vec2 bodyCornerDiagonal{{ no }} = u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size - u_textureSeed{{ no }}.ui.xy;
        if(0. < uvTextureSeed{{ no }}.x && uvTextureSeed{{ no }}.x < 1. &&
           0. < uvTextureSeed{{ no }}.y && uvTextureSeed{{ no }}.y < 1. &&
           (pos.x < bodyCorner{{ no }}.x || bodyCornerDiagonal{{ no }}.x < pos.x ||
            pos.y < bodyCorner{{ no }}.y || bodyCornerDiagonal{{ no }}.y < pos.y)) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        if(distance(pos, u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size/2.0) < u_textureSeed{{ no }}.ui.z) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size/2.0) < u_textureSeed{{ no }}.ui.z * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // up point
        float len{{ no }} = distance(u_textureSeed{{ no }}.corner, u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size / 2.0);
        vec2 p{{ no }} = u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size/2.0;
        mat2 rotateM{{ no }} = mat2(cos(-u_textureSeed{{ no }}.rotationRadian),
                                    -sin(-u_textureSeed{{ no }}.rotationRadian),
                                    sin(-u_textureSeed{{ no }}.rotationRadian),
                                    cos(-u_textureSeed{{ no }}.rotationRadian));
        vec2 up{{ no }} = rotateM{{ no }} * vec2(0, 1);
        if(distance(pos, p{{ no }} + up{{ no }} * len{{ no }}) < u_textureSeed{{ no }}.ui.z) {
            color = vec4(PINK, 1);
            return true;
        }
        // up point Boundary
        if(distance(pos, p{{ no }} + up{{ no }} * len{{ no }}) < u_textureSeed{{ no }}.ui.z * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // ring
        if(abs(distance(pos, u_textureSeed{{ no }}.corner + u_textureSeed{{ no }}.size/2.0) - len{{ no }}) < u_textureSeed{{ no }}.ui.z * 0.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    {% endfor %}

    {% for no in range(0, numVideoSeed) %}
    if(u_videoSeed{{ no }}.selected) {
        vec2 videoUV{{ no }} = (pos - u_videoSeed{{ no }}.corner) / u_videoSeed{{ no }}.size;
        vec2 videoCorner{{ no }} = u_videoSeed{{ no }}.corner + u_videoSeed{{ no }}.ui.xy;
        vec2 videoCornerDiagonal{{ no }} = u_videoSeed{{ no }}.corner + u_videoSeed{{ no }}.size - u_videoSeed{{ no }}.ui.xy;
        if(0. < videoUV{{ no }}.x && videoUV{{ no }}.x < 1. &&
           0. < videoUV{{ no }}.y && videoUV{{ no }}.y < 1. &&
           (pos.x < videoCorner{{ no }}.x || videoCornerDiagonal{{ no }}.x < pos.x ||
            pos.y < videoCorner{{ no }}.y || videoCornerDiagonal{{ no }}.y < pos.y)) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_videoSeed{{ no }}.corner + u_videoSeed{{ no }}.size/2.0) < u_videoSeed{{ no }}.ui.z) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_videoSeed{{ no }}.corner + u_videoSeed{{ no }}.size/2.0) < u_videoSeed{{ no }}.ui.z * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    {% endfor %}

    return false;
}

bool renderUI(vec2 pos, out vec4 color) {
    color = u_backgroundColor;

    {% for n  in range(0,  numPoint ) %}
    if(distance(pos, u_point{{ n }}.xy) < u_point{{ n }}.z){
        color = vec4(BLUE, 1);
        return true;
    }
    {% endfor %}

    float dist;
    {% for n in range(0,  numCircle ) %}
    // boundary of circle
    if(u_circle{{ n }}.selected){
        dist = u_circle{{ n }}.centerAndRadius.z - distance(pos, u_circle{{ n }}.centerAndRadius.xy);
        if(0. < dist && dist < u_circle{{ n }}.ui){
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // Render the axis
        // if(u_isPressingShift && abs(pos.y - u_circle{{ n }}.centerAndRadius.y) < u_circle{{ n }}.ui/4.) {
        //     color = WHITE;
        //     return true;
        // } else if(u_isPressingCtrl && abs(pos.x - u_circle{{ n }}.centerAndRadius.x) < u_circle{{ n }}.ui/4.) {
        //     color = WHITE;
        //     return true;
        // }
        // point p
        if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.ui) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_circle{{ n }}.centerAndRadius.xy) < u_circle{{ n }}.ui * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    {% endfor %}


    {% for n in range(0, numHalfPlane) %}
    if(u_halfPlane{{ n }}.selected) {
        // normal point
        if(distance(pos, u_halfPlane{{ n }}.p + u_halfPlane{{ n }}.normal.xy * u_halfPlane{{ n }}.normal.z) < u_halfPlane{{ n }}.normal.w) {
            color = vec4(PINK, 1);
            return true;
        }
        // normal point Boundary
        if(distance(pos, u_halfPlane{{ n }}.p + u_halfPlane{{ n }}.normal.xy * u_halfPlane{{ n }}.normal.z) < u_halfPlane{{ n }}.normal.w * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point p
        if(distance(pos, u_halfPlane{{ n }}.p) < u_halfPlane{{ n }}.normal.w) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_halfPlane{{ n }}.p) < u_halfPlane{{ n }}.normal.w * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // ring
        if(abs(distance(pos, u_halfPlane{{ n }}.p) - u_halfPlane{{ n }}.normal.z) < u_halfPlane{{ n }}.normal.w *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // line
        dist = dot(pos - u_halfPlane{{ n }}.p , u_halfPlane{{ n }}.normal.xy);
        if(-u_halfPlane{{ n }}.normal.w < dist && dist < 0.) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    {% endfor %}

    {% for n in range(0, numParallelTranslation) %}
    if(u_translate{{ n }}.selected){
        // normal point
        if(distance(pos, u_translate{{ n }}.p + u_translate{{ n }}.normal.xy * u_translate{{ n }}.ui.x) < u_translate{{ n }}.ui.y) {
            color = vec4(PINK, 1);
            return true;
        }
        // normal point Boundary
        if(distance(pos, u_translate{{ n }}.p + u_translate{{ n }}.normal.xy * u_translate{{ n }}.ui.x) < u_translate{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // ring
        if(abs(distance(pos, u_translate{{ n }}.p) - u_translate{{ n }}.ui.x) < u_translate{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point p
        if(distance(pos, u_translate{{ n }}.p) < u_translate{{ n }}.ui.y) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p Boundary
        if(distance(pos, u_translate{{ n }}.p) < u_translate{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point on hp2
        if(distance(pos, u_translate{{ n }}.p + u_translate{{ n }}.normal.xy * u_translate{{ n }}.normal.z) < u_translate{{ n }}.ui.y) {
            color = vec4(GREEN, 1);
            return true;
        }
        // point on hp2 Boundary
        if(distance(pos, u_translate{{ n }}.p + u_translate{{ n }}.normal.xy * u_translate{{ n }}.normal.z) < u_translate{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // boundary
        dist = dot(pos - u_translate{{ n }}.p, - u_translate{{ n }}.normal.xy);
        if(0. < dist && dist < u_translate{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        dist = -dot(pos - (u_translate{{ n }}.p + u_translate{{ n }}.normal.xy * u_translate{{ n }}.normal.z),
                    - u_translate{{ n }}.normal.xy);
        if(0. < dist && dist < u_translate{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        // line
        pos -= u_translate{{ n }}.p;
        float hpd{{ n }} = dot(u_translate{{ n }}.normal.xy, pos);
        if(hpd{{ n }} > 0. && u_translate{{ n }}.normal.z > hpd{{ n }} &&
           abs(dot(pos, vec2(-u_translate{{ n }}.normal.y, u_translate{{ n }}.normal.x))) < u_translate{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        pos += u_translate{{ n }}.p;
    }
    {% endfor %}

    {% for n in range(0, numParallelInversions) %}
    if(u_parallelInversions{{ n }}.selected){

        // normal point
        if(distance(pos, u_parallelInversions{{ n }}.p + u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.ui.x) < u_parallelInversions{{ n }}.ui.y) {
            color = vec4(PINK, 1);
            return true;
        }
        // normal point boundary
        if(distance(pos, u_parallelInversions{{ n }}.p + u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.ui.x) < u_parallelInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // ring
        if(abs(distance(pos, u_parallelInversions{{ n }}.p) - u_parallelInversions{{ n }}.ui.x) < u_parallelInversions{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point p
        if(distance(pos, u_parallelInversions{{ n }}.p) < u_parallelInversions{{ n }}.ui.y) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p boundary
        if(distance(pos, u_parallelInversions{{ n }}.p) < u_parallelInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point on hp2
        if(distance(pos, u_parallelInversions{{ n }}.p + u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z) < u_parallelInversions{{ n }}.ui.y) {
            color = vec4(GREEN, 1);
            return true;
        }
        // point on hp2 boundary
        if(distance(pos, u_parallelInversions{{ n }}.p + u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z) < u_parallelInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // boundary
        dist = dot(pos - u_parallelInversions{{ n }}.p, - u_parallelInversions{{ n }}.normal.xy);
        if(0. < dist && dist < u_parallelInversions{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        dist = -dot(pos - (u_parallelInversions{{ n }}.p + u_parallelInversions{{ n }}.normal.xy * u_parallelInversions{{ n }}.normal.z),
                   - u_parallelInversions{{ n }}.normal.xy);
        if(0. < dist && dist < u_parallelInversions{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        // line
        pos -= u_parallelInversions{{ n }}.p;
        float hpdInv{{ n }} = dot(u_parallelInversions{{ n }}.normal.xy, pos);
        if(hpdInv{{ n }} > 0. && u_parallelInversions{{ n }}.normal.z > hpdInv{{ n }} &&
           abs(dot(pos, vec2(-u_parallelInversions{{ n }}.normal.y, u_parallelInversions{{ n }}.normal.x))) < u_parallelInversions{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        pos += u_parallelInversions{{ n }}.p;
    }
    {% endfor %}

    {% for n in range(0, numGlideReflection) %}
    if(u_glideReflection{{ n }}.selected){
        // normal point
        if(distance(pos, u_glideReflection{{ n }}.p + u_glideReflection{{ n }}.normal.xy * u_glideReflection{{ n }}.ui.x) < u_glideReflection{{ n }}.ui.y) {
            color = vec4(PINK, 1);
            return true;
        }
        // normal point boundary
        if(distance(pos, u_glideReflection{{ n }}.p + u_glideReflection{{ n }}.normal.xy * u_glideReflection{{ n }}.ui.x) < u_glideReflection{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // ring
        if(abs(distance(pos, u_glideReflection{{ n }}.p) - u_glideReflection{{ n }}.ui.x) < u_glideReflection{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point p
        if(distance(pos, u_glideReflection{{ n }}.p) < u_glideReflection{{ n }}.ui.y) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p boundary
        if(distance(pos, u_glideReflection{{ n }}.p) < u_glideReflection{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // point on hp2
        if(distance(pos, u_glideReflection{{ n }}.p + u_glideReflection{{ n }}.normal.xy * u_glideReflection{{ n }}.normal.z) < u_glideReflection{{ n }}.ui.y) {
            color = vec4(GREEN, 1);
            return true;
        }
        // point on hp2 boundary
        if(distance(pos, u_glideReflection{{ n }}.p + u_glideReflection{{ n }}.normal.xy * u_glideReflection{{ n }}.normal.z) < u_glideReflection{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // boundary
        dist = dot(pos - u_glideReflection{{ n }}.p, - u_glideReflection{{ n }}.normal.xy);
        if(0. < dist && dist < u_glideReflection{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        dist = -dot(pos - (u_glideReflection{{ n }}.p + u_glideReflection{{ n }}.normal.xy * u_glideReflection{{ n }}.normal.z),
                   - u_glideReflection{{ n }}.normal.xy);
        if(0. < dist && dist < u_glideReflection{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        // line
        pos -= u_glideReflection{{ n }}.p;
        float hpdGlide{{ n }} = dot(u_glideReflection{{ n }}.normal.xy, pos);
        if(hpdGlide{{ n }} > 0. && u_glideReflection{{ n }}.normal.z > hpdGlide{{ n }} &&
           abs(dot(pos, vec2(-u_glideReflection{{ n }}.normal.y, u_glideReflection{{ n }}.normal.x))) < u_glideReflection{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        pos += u_glideReflection{{ n }}.p;
    }
    {% endfor %}

    {% for n in range(0, numCrossingInversions) %}
    if(u_crossingInversions{{ n }}.selected) {
        // point p
        if(distance(pos, u_crossingInversions{{ n }}.p) < u_crossingInversions{{ n }}.ui.y) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        // point p boundary
        if(distance(pos, u_crossingInversions{{ n }}.p) < u_crossingInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_crossingInversions{{ n }}.boundaryPoint.zw) < u_crossingInversions{{ n }}.ui.y) {
            color = vec4(GREEN, 1);
            return true;
        }
        // boundary
        if(distance(pos, u_crossingInversions{{ n }}.boundaryPoint.zw) < u_crossingInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_crossingInversions{{ n }}.boundaryPoint.xy) < u_crossingInversions{{ n }}.ui.y) {
            color = vec4(PINK, 1);
            return true;
        }
        // boundary
        if(distance(pos, u_crossingInversions{{ n }}.boundaryPoint.xy) < u_crossingInversions{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // line
        pos -= u_crossingInversions{{ n }}.p;
        dist = dot(-u_crossingInversions{{ n }}.normal.xy, pos);
        if(0. < dist && dist < u_crossingInversions{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        dist = dot(-u_crossingInversions{{ n }}.normal.zw, pos);
        if(0. < dist && dist < u_crossingInversions{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        // ring
        if(dot(pos, u_crossingInversions{{ n }}.normal.xy) > 0. &&
           dot(pos, u_crossingInversions{{ n }}.normal.zw) > 0. &&
           abs(distance(pos, u_crossingInversions{{ n }}.p - u_crossingInversions{{ n }}.p) - u_crossingInversions{{ n }}.ui.x) < u_crossingInversions{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        pos += u_crossingInversions{{ n }}.p;
    }
    {% endfor %}

    {% for n in range(0, numRotation) %}
    if(u_rotation{{ n }}.selected) {
        // point p
        if(distance(pos, u_rotation{{ n }}.p) < u_rotation{{ n }}.ui.y) {
            color = vec4(LIGHT_BLUE, 1);
            return true;
        }
        if(distance(pos, u_rotation{{ n }}.p) < u_rotation{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_rotation{{ n }}.boundaryPoint.zw) < u_rotation{{ n }}.ui.y) {
            color = vec4(GREEN, 1);
            return true;
        }
        // boundary
        if(distance(pos, u_rotation{{ n }}.boundaryPoint.zw) < u_rotation{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        if(distance(pos, u_rotation{{ n }}.boundaryPoint.xy) < u_rotation{{ n }}.ui.y) {
            color = vec4(PINK, 1);
            return true;
        }
        // boundary
        if(distance(pos, u_rotation{{ n }}.boundaryPoint.xy) < u_rotation{{ n }}.ui.y * 1.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        // line
        pos -= u_rotation{{ n }}.p;
        dist = dot(-u_rotation{{ n }}.normal.xy, pos);
        if(0. < dist && dist < u_rotation{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        dist = dot(-u_rotation{{ n }}.normal.zw, pos);
        if(0. < dist && dist < u_rotation{{ n }}.ui.y) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        // ring
        if(dot(pos, u_rotation{{ n }}.normal.xy) > 0. &&
           dot(pos, u_rotation{{ n }}.normal.zw) > 0. &&
           abs(distance(pos, u_rotation{{ n }}.p - u_rotation{{ n }}.p) - u_rotation{{ n }}.ui.x) < u_rotation{{ n }}.ui.y *.5) {
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
        pos += u_rotation{{ n }}.p;
    }
    {% endfor %}

    {% for n in range(0, numLoxodromic) %}
    // point p
    if(distance(pos, u_loxodromic{{ n }}.p) < u_loxodromic{{ n }}.ui.x) {
        color = vec4(PINK, 1);
        return true;
    }
    // point p boundary
    if(distance(pos, u_loxodromic{{ n }}.p) < u_loxodromic{{ n }}.ui.x * 1.5) {
        color = vec4(u_generatorBoundaryColor, 1);
        return true;
    }
    {% endfor %}

    {% for n in range(0, numScaling) %}
    if(distance(pos, u_scaling{{ n }}.line2.xy) < u_scaling{{ n }}.ui.x) {
        color = vec4(PINK, 1);
        return true;
    }
    // boundary
    if(distance(pos, u_scaling{{ n }}.line2.xy) < u_scaling{{ n }}.ui.x * 1.5) {
        color = vec4(u_generatorBoundaryColor, 1);
        return true;
    }
    {% endfor %}

    return false;
}

{% if numFundamentalDomainPoints != 0 %}
bool inFundamentalDomain(vec2 p) {
    {% for n in range(1, numFundamentalDomainPoints) %}
    vec2 n{{ n }} = normalize(u_fundamentalDomain[{{ n }}] - u_fundamentalDomain[{{ n - 1 }}]);
    float d{{ n }} = dot(normalize(p - u_fundamentalDomain[{{ n - 1 }}]),
                         vec2(-n{{ n }}.y, n{{ n }}.x));
    if(d{{ n }} > 0.0) return false;
    {% endfor %}
    vec2 nend = normalize(u_fundamentalDomain[0] - u_fundamentalDomain[{{ numFundamentalDomainPoints - 1 }}]);
    float dend = dot(normalize(p - u_fundamentalDomain[{{ numFundamentalDomainPoints - 1 }}]),
                     vec2(-nend.y, nend.x));
    if(dend > 0.0) return false;
    return true;
}
{% endif %}

bool renderGenerator(vec2 pos, out vec4 color) {
    color = u_backgroundColor;
    float dist;
    {% for n in range(0, numTwoCircles) %}
    if(u_hyperbolic{{ n }}.selected) {
        dist = u_hyperbolic{{ n }}.c1.z - distance(pos, u_hyperbolic{{ n }}.c1.xy);
        if(0. < dist && dist < u_hyperbolic{{ n }}.ui){
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        dist = u_hyperbolic{{ n }}.c2.z - distance(pos, u_hyperbolic{{ n }}.c2.xy);
        if(0. < dist && dist < u_hyperbolic{{ n }}.ui){
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    if(distance(pos, u_hyperbolic{{ n }}.c1.xy) < u_hyperbolic{{ n }}.c1.z) {
        color = vec4(RED, 1);
        return true;
    }
    if(distance(pos, u_hyperbolic{{ n }}.c2.xy) < u_hyperbolic{{ n }}.c2.z) {
        color = vec4(GREEN, 1);
        return true;
    }
    if(distance(pos, u_hyperbolic{{ n }}.c1d.xy) < u_hyperbolic{{ n }}.c1d.z) {
        color = vec4(BLUE, 1);
        return true;
    }
    {% endfor %}

    {% for n in range(0, numLoxodromic) %}
    // line
    if(abs(dot(pos - u_loxodromic{{ n }}.c1.xy,
               u_loxodromic{{ n }}.line.zw)) < u_loxodromic{{ n }}.ui.y) {
        color = vec4(u_generatorBoundaryColor, 1);
        return true;
    }
    vec4 loxoCol{{ n }} = vec4(0);
    bool loxoRender{{ n }} = false;
    if (distance(pos, u_loxodromic{{ n }}.c3.xy) < u_loxodromic{{ n }}.c3.z) {
        loxoCol{{ n }} = blendCol(vec4(YELLOW, 0.5), loxoCol{{ n }});
        loxoRender{{ n }} = true;
    }
    if(u_loxodromic{{ n }}.selected) {
        dist = u_loxodromic{{ n }}.c1.z - distance(pos, u_loxodromic{{ n }}.c1.xy);
        if(0. < dist && dist < u_loxodromic{{ n }}.ui.z){
            loxoCol{{ n }} = blendCol(vec4(WHITE, 1.), loxoCol{{ n }});
            loxoRender{{ n }} = true;
        }

        dist = u_loxodromic{{ n }}.c2.z - distance(pos, u_loxodromic{{ n }}.c2.xy);
        if(0. < dist && dist < u_loxodromic{{ n }}.ui.z){
            loxoCol{{ n }} = blendCol(vec4(WHITE, 1.), loxoCol{{ n }});
            loxoRender{{ n }} = true;
        }
    }
    if(distance(pos, u_loxodromic{{ n }}.c1.xy) < u_loxodromic{{ n }}.c1.z) {
        loxoCol{{ n }} = blendCol(vec4(RED, 1.), loxoCol{{ n }});
        loxoRender{{ n }} = true;
    }else if(distance(pos, u_loxodromic{{ n }}.c2.xy) < u_loxodromic{{ n }}.c2.z) {
        loxoCol{{ n }} = blendCol(vec4(GREEN, 1.), loxoCol{{ n }});
        loxoRender{{ n }} = true;
    }else if(distance(pos, u_loxodromic{{ n }}.c1d.xy) < u_loxodromic{{ n }}.c1d.z) {
        loxoCol{{ n }} = blendCol(vec4(BLUE, 1.), loxoCol{{ n }});
        loxoRender{{ n }} = true;
    }
    if(loxoRender{{ n }}) {
        color = vec4(loxoCol{{ n }}.rgb, 1);
        return true;
    }
    {% endfor %}

    {% for n in range(0, numScaling) %}
    if(u_scaling{{ n }}.selected) {
        dist = u_scaling{{ n }}.c1.z - distance(pos, u_scaling{{ n }}.c1.xy);
        if(0. < dist && dist < u_scaling{{ n }}.ui.y){
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }

        dist = u_scaling{{ n }}.c2.z - distance(pos, u_scaling{{ n }}.c2.xy);
        if(0. < dist && dist < u_scaling{{ n }}.ui.y){
            color = vec4(u_generatorBoundaryColor, 1);
            return true;
        }
    }
    if(abs(dot(pos - u_scaling{{ n }}.line1.xy,
               u_scaling{{ n }}.line1.zw)) < u_scaling{{ n }}.ui.y) {
        color = vec4(YELLOW, 1);
        return true;
    }
    if(abs(dot(pos - u_scaling{{ n }}.line2.xy,
               u_scaling{{ n }}.line2.zw)) < u_scaling{{ n }}.ui.y) {
        color = vec4(u_generatorBoundaryColor, 1);
        return true;
    }
    if(distance(pos, u_scaling{{ n }}.c1.xy) < u_scaling{{ n }}.c1.z) {
        color = vec4(RED, 1);
        return true;
    }
    if(distance(pos, u_scaling{{ n }}.c2.xy) < u_scaling{{ n }}.c2.z) {
        color = vec4(GREEN, 1);
        return true;
    }
    if(distance(pos, u_scaling{{ n }}.c1d.xy) < u_scaling{{ n }}.c1d.z) {
        color = vec4(BLUE, 1);
        return true;
    }
    {% endfor %}

    return false;
}

const float MAX_SAMPLES = 20.;
void main() {
    vec4 sum = vec4(0);
    float ratio = u_resolution.x / u_resolution.y / 2.0;
    for(float i = 0.; i < MAX_SAMPLES; i++){
        vec2 position = ((gl_FragCoord.xy + rand2n(gl_FragCoord.xy, i)) / u_resolution.yy ) - vec2(ratio, 0.5);
        position = position * u_geometry.z;
        position += u_geometry.xy;

        vec4 col = u_backgroundColor;
        if(u_isRenderingOrbit == 1.0) {
            int n = computeOrbit(u_orbitOrigin);
            bool line = renderOrbit(position, col, n);
            if(line){
                sum += col;
                continue;
            }
        }

        if(renderEdgeOfSeed(position, col)) {
            sum += col;
            continue;
        }

        if(u_isRenderingGenerator == 1.0 && renderUI(position, col)) {
            sum += col;
            continue;
        }

        bool isRendered = IIS(position, col);
        if(isRendered){
            sum += col;
            continue;
        } else {
            if(u_isRenderingGenerator == 1.0 && renderGenerator(position, col)) {
                sum += col;
            } else {
                sum += u_backgroundColor;
            }
            continue;
        }
    }

    //vec3 texCol = textureLod(u_accTexture, gl_FragCoord.xy / u_resolution, 0.0).rgb;
    outColor = sum / MAX_SAMPLES;
}
