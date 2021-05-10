import * as THREE from 'three'

// TEXTURES
const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();


//============= MATERIALS ============


// CUSTOM ELECTRIC MATERIAL
const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib["lights"],
    THREE.UniformsLib["common"]
])

uniforms.u_beachImage = { value: textureLoader.load("img/stock/beach.jpg") },
uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
// uniforms.u_light_position = { value: mainSpotLight.position.clone() };
// uniforms.u_light_intensity = { value: mainSpotLight.intensity };
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };
uniforms.u_time = { value: 1.0 },
uniforms.u_radius = { value: 1.0 },
uniforms.u_resolution = { value: 1.0 }

const vshader = `
varying vec2 v_uv;
void main() {	
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`
const fshader = `
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
const Material_01 = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader,
    fragmentShader: fshader,
    lights: true,
    transparent: true,
});
Material_01.extensions.derivatives = true;



//============ ENVIRONMENT HDR ==============
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"])
envTexture.mapping = THREE.CubeReflectionMapping
// envTexture.mapping = THREE.CubeRefractionMapping
// materialPhysical.envMap = envTexture

export {Material_01}


