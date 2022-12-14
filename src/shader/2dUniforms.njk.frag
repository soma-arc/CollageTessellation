uniform sampler2D u_accTexture;
uniform vec2 u_resolution;
// [translateX, translateY, scale]
uniform vec3 u_geometry;
uniform int u_maxIISIterations;
uniform sampler2D u_videoTexture;
uniform sampler2D u_imageTextures[{{ maxNumImageTextures }}];
uniform sampler2D u_canvasTextures[{{ maxNumCanvasTextures }}];
uniform float u_isRenderingGenerator;
uniform bool u_isPressingShift;
uniform bool u_isPressingCtrl;

struct Circle {
    vec4 centerAndRadius; // [x, y, r, r * r]
    float ui; // [boundaryThickness]
    bool selected;
};

struct HalfPlane {
    vec2 p;
    vec4 normal; //[x, y, normal ring radius, point radius]
    bool selected;
};

struct ParallelTranslation {
    vec2 p;
    vec4 normal; //[x, y, halfplane distance, translation length]
    vec2 ui; //[normal ring radius, point radius]
    bool selected;
};

struct ParallelInversions {
    vec2 p;
    vec4 normal; //[x, y, halfplane distance, translation length]
    vec2 ui; //[normal ring radius, point radius]
    bool selected;
};

struct CrossingInversions {
    vec2 p;
    vec4 normal; // [normal1, normal2]
    vec4 boundaryPoint; // [p1, p2]
    vec2 ui; //[normal ring radius, point radius]
    bool selected;
};

struct Rotation {
    vec2 p;
    vec4 normal; // [normal1, normal2]
    vec4 boundaryPoint; // [p1, p2]
    vec2 ui; //[normal ring radius, point radius]
    bool selected;
    float rotationRad;
};

struct TwoCircles {
    vec4 c1;
    vec4 c2;
    vec4 c1d;
    float ui; //[boundaryThickness]
    bool selected;
};

struct Loxodromic {
    vec4 c1;
    vec4 c2;
    vec4 c1d;
    vec4 c3;
    vec2 p;
    vec4 line; // [dirX, dirY, normalX, normalY]
    vec3 ui; //[normal ring radius, point radius, circumferenceThickness]
    bool selected;
};

struct Seed {
    vec2 corner;
    vec2 size;
    float rotationRadian;
    vec4 ui;
    bool selected;
    vec2 cropPolygon[10];
};

struct Scaling {
    vec4 c1;
    vec4 c2;
    vec4 c1d;
    vec4 line1;
    vec4 line2;
    vec2 ui; // [pointRadius, lineWidth]
    bool selected;
};

//[x, y, r, r * r]
{% for n  in range(0,  numCircle ) %}
uniform Circle u_circle{{ n }};
{% endfor %}

//[x, y, r, r * r]
{% for n  in range(0,  numCircleFromPoints ) %}
uniform Circle u_circleFromPoints{{ n }};
{% endfor %}

{% for n in range(0, numHalfPlane) %}
uniform HalfPlane u_halfPlane{{ n }};
{% endfor %}

//[x, y, r]
{% for n in range(0, numPoint) %}
uniform vec3 u_point{{ n }};
{% endfor %}

{% for n in range(0, numParallelTranslation) %}
uniform ParallelTranslation u_translate{{ n }};
{% endfor %}

{% for n in range(0, numParallelInversions) %}
uniform ParallelInversions u_parallelInversions{{ n }};
{% endfor %}

{% for n in range(0, numGlideReflection) %}
uniform ParallelTranslation u_glideReflection{{ n }};
{% endfor %}

{% for n in range(0, numCrossingInversions) %}
uniform CrossingInversions u_crossingInversions{{ n }};
{% endfor %}

{% for n in range(0, numRotation) %}
uniform Rotation u_rotation{{ n }};
{% endfor %}

{% for n in range(0, numTwoCircles) %}
uniform TwoCircles u_hyperbolic{{ n }};
{% endfor %}

{% for n in range(0, numLoxodromic) %}
uniform Loxodromic u_loxodromic{{ n }};
{% endfor %}

{% for n in range(0, numTextureSeed) %}
uniform Seed u_textureSeed{{ n }};
{% endfor %}

{% for n in range(0, numVideoSeed) %}
uniform Seed u_videoSeed{{ n }};
{% endfor %}

{% for n in range(0, numScaling) %}
uniform Scaling u_scaling{{ n }};
{% endfor %}

{% for n in range(0, numCanvasSeed) %}
uniform Seed u_canvasSeed{{ n }};
{% endfor %}

uniform vec2 u_orbitOrigin;
uniform float u_isRenderingOrbit;
uniform vec4 u_backgroundColor;
uniform vec3 u_generatorBoundaryColor;
{% if numFundamentalDomainPoints > 2 %}
uniform vec2 u_fundamentalDomain[{{ numFundamentalDomainPoints }}];
{% endif %}
