const renderVertexShaderSource = `
    #version 100
    precision highp float;
    attribute vec2 pos;
    attribute vec2 in_tex_coord;
    varying highp vec2 tex_coord;
    void main() {
        gl_Position = vec4(pos, 0.0, 1.0);
        tex_coord = in_tex_coord;
    }
`;

const renderFragmentShaderSource = `
    #version 100
    precision mediump float;
    varying mediump vec2 tex_coord;
    uniform sampler2D sampler;
    void main() {
        gl_FragColor = texture2D(sampler, tex_coord) + vec4(0.0, 0.0, 0.0, 1.0);
    }
`;

const computeVertexShaderSource = renderVertexShaderSource;

const computeFragmentShaderSource = `
    #version 100
    precision mediump float;
    varying highp vec2 tex_coord;
    uniform sampler2D sampler;
    uniform highp vec2 delta; // Needs to be highp because of high resolutions
    void main() {
        bool current = texture2D(sampler, tex_coord).w == 1.0;
        float neighbors = texture2D(sampler, tex_coord + vec2(  delta.x,         0)).w +
                          texture2D(sampler, tex_coord + vec2(- delta.x,         0)).w +
                          texture2D(sampler, tex_coord + vec2(        0,   delta.y)).w +
                          texture2D(sampler, tex_coord + vec2(        0, - delta.y)).w +
                          texture2D(sampler, tex_coord + vec2(  delta.x,   delta.y)).w +
                          texture2D(sampler, tex_coord + vec2(- delta.x,   delta.y)).w +
                          texture2D(sampler, tex_coord + vec2(  delta.x, - delta.y)).w +
                          texture2D(sampler, tex_coord + vec2(- delta.x, - delta.y)).w;
        bool alive = (current && (neighbors == 2.0 || neighbors == 3.0)) ||
                     (!current && neighbors == 3.0);
        gl_FragColor = vec4(float(alive));
    }
`;
