import * as THREE from 'three'
import { DoubleSide } from 'three';

// TEXTURE LOADER INITIALIZATION
const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
const beachTexture = textureLoader.load("img/stock/beach.jpg")
const electricBoardTexture = textureLoader.load("img/electric_texture.png")
const chromaticNoise = textureLoader.load("img/chromatic_noise.png")


//============= MATERIALS ============
// UNIFORMS FOR CUSTOM MATERIALS
const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib["lights"],
  THREE.UniformsLib["common"]
])

uniforms.u_beachImage = { value: beachTexture },
uniforms.u_electricImage = { value: electricBoardTexture },
uniforms.u_chromaticNoise = { value: chromaticNoise },
uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
// uniforms.u_light_position = { value: mainSpotLight.position.clone() };
// uniforms.u_light_intensity = { value: mainSpotLight.intensity };
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };
uniforms.u_time = { value: 1.0 },
uniforms.u_timeDelta = { value: 0.1 },
uniforms.u_radius = { value: 1.0 },
uniforms.u_resolution = { value: new THREE.Vector2(2,2) }




// ================ STATIC MATERIAL ====================
const vshader_static = `
varying vec2 v_uv;
void main() {	
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader_static = `
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

varying vec2 v_uv;

float random (vec2 st) {
  const float a = 12.9898;
  const float b = 78.233;
  const float c = 43758.543123;
  return fract(sin(dot(st, vec2(a, b))) * c );
}

void main(){    
    vec3 color = random(v_uv)*vec3(1.0);
	gl_FragColor  = vec4(color, 1.0);
}
`
const Material_Static = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader_static,
    fragmentShader: fshader_static,
    lights: true,
    transparent: true,
});
Material_Static.extensions.derivatives = true;



// =========== FRACTED MATERIAL =============
const vshader_fracted = `
    
    uniform float u_time;
    uniform float u_radius;

    varying vec3 vDistortNormal;
    varying vec3 vNormal;
    varying vec2 v_uv;
    varying vec3 vPosition;

    void main() {


        v_uv = uv;
        vDistortNormal = normalize(normalMatrix * normal);
        vNormal = normal;
        vPosition = position;
        

        gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
    }
`
const fshader_fracted = `
    uniform mat4 modelMatrix;
    
    uniform vec3 u_light_position;
    uniform sampler2D u_beachImage;

    varying vec2 v_uv;
    varying vec3 vDistortNormal;
    varying vec3 vNormal;
    varying vec3 vPosition;


    void main()
    {
        vec3 X = dFdx(vDistortNormal);
        vec3 Y = dFdy(vDistortNormal);
        vec3 distortedNormal = normalize(cross(X,Y));

        
        float normalTwist = dot(distortedNormal, vec3(0.6));
        vec4 beachImage = texture2D(u_beachImage, v_uv * normalTwist + 0.2 );

        vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;


        vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );

        vec3 lightVector = normalize( u_light_position - worldPosition );

        float brightness = dot( worldNormal, lightVector );

        gl_FragColor = vec4(beachImage.rgb, 0.8);
    }
`
const Material_Fracted = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader_fracted,
    fragmentShader: fshader_fracted,
    lights: true,
    transparent: true,
});
Material_Fracted.extensions.derivatives = true;

// =========== ELECTRIC / CHIP MATERIAL =============

// CIRCUIT
const vshader_circuit = `
    
    uniform float u_time;
    uniform sampler2D u_electricImage;
   
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`
const fshader_circuit = `
    
    uniform sampler2D u_electricImage;
    uniform float u_time;
    uniform float u_timeDelta;
    
    
    varying vec3 vPosiiton;


uniform sampler2D u_chromaticNoise;

float contrast = 20.0;
float distortion = 1.0;
float speed = 0.01;
vec3 color = vec3(1., 1., 1.);
float brightness = 0.07;


uniform vec2 u_resolution;
varying vec2 vUv;

mat2 makem2(float theta) {
    float c = cos(theta);   
    float s = sin(theta);
    return mat2(c, -s, s, c);
}

float noise(vec2 x) {
    return texture2D(u_chromaticNoise, x * .01).x;
}

float fbm(vec2 p) {
    float z = 2.;
    float rz = 0.;
    vec2 bp = p;
    for (float i = 1.; i < 6.0; i++) {
        rz += abs((noise(p) - 0.5) * 2.0) / z;
        z = z * 2.;
        p = p * 2.;
    }
    return rz;
}

float dualfbm(vec2 p) {
    vec2 p2 = p * distortion;
    vec2 basis = vec2(fbm(p2 - u_time * speed * 1.6), fbm(p2 + u_time * speed * 1.7));
    basis = (basis - .5) * .2;
    p += basis;
    return fbm(p * makem2(u_time *  speed * 0.2));
}
    

    void main()
    {


     
      
        vec2 offset = vec2(u_time/4.0);
      float tileCount = 4.0;
      vec2 phase = fract(vUv * tileCount);
      vec2 movingPhase = fract((vUv.y * tileCount)-offset);

      vec4 electricImage = texture2D(u_electricImage, phase);

      vec4 mask = texture2D(u_electricImage, movingPhase);

      vec2 p = ( vUv.xy  ) * u_resolution;
      float rz = dualfbm( p );
      vec4 col = vec4(vec3( (color / rz ) * brightness), electricImage.b);

      col += vec4(vec3(0.0, 0.4, 0.4), electricImage.b);
      col += vec4(vec3(( (col - 0.5 ) * max( contrast, 0.0 ) ) + 0.0), ( ((col - 0.5 ) * max( contrast, 0.0 ) ) + 0.5) * (1.0-electricImage.b)) * 0.1;
      gl_FragColor = col;
      // gl_FragColor = vec4(vec3(electricImage.b), electricImage.b);

      
    


      
    }
`
const Material_Circuit = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader_circuit,
    fragmentShader: fshader_circuit,
    lights: true,
    transparent: true,
    depthTest: false,
    side: DoubleSide,
    
});
Material_Circuit.extensions.derivatives = true;

// ELECTRIC
const vshader_electric = `
    
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {

      
      vNormal = normal;
      vUv = uv;
      vPosition = position;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

  }
`
const fshader_electric = `
    


uniform float u_time;

uniform sampler2D u_chromaticNoise;

float contrast = 5.0;
float distortion = 0.9;
float speed = 0.01;
vec3 color = vec3(1., 1., 1.);
float brightness = 0.12;


uniform vec2 u_resolution;
varying vec2 vUv;

mat2 makem2(float theta) {
    float c = cos(theta);   
    float s = sin(theta);
    return mat2(c, -s, s, c);
}

float noise(vec2 x) {
    return texture2D(u_chromaticNoise, x * .01).x;
}

float fbm(vec2 p) {
    float z = 2.;
    float rz = 0.;
    vec2 bp = p;
    for (float i = 1.; i < 6.0; i++) {
        rz += abs((noise(p) - 0.5) * 2.0) / z;
        z = z * 2.;
        p = p * 2.;
    }
    return rz;
}

float dualfbm(vec2 p) {
    vec2 p2 = p * distortion;
    vec2 basis = vec2(fbm(p2 - u_time * speed * 1.6), fbm(p2 + u_time * speed * 1.7));
    basis = (basis - .5) * .2;
    p += basis;
    return fbm(p * makem2(u_time *  speed * 0.2));
}

void main() {
  
  
    vec2 p = ( vUv.xy  ) * u_resolution;
    float rz = dualfbm( p );
    
    vec3 col = ( color / rz ) * brightness;
    
    col = ( (col - 0.5 ) * max( contrast, 0.0 ) ) + 0.5;

    gl_FragColor = vec4( col, 1.0 );
}

`
const Material_Electric = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader_electric,
    fragmentShader: fshader_electric,
    lights: true,
    transparent: true,
});
Material_Electric.extensions.derivatives = true;


//============ ENVIRONMENT HDR ==============
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"])
envTexture.mapping = THREE.CubeReflectionMapping
// envTexture.mapping = THREE.CubeRefractionMapping
// materialPhysical.envMap = envTexture

export {Material_Static, Material_Fracted, Material_Circuit, Material_Electric, uniforms}


