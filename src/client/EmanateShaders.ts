import * as THREE from 'three'

// TEXTURE LOADER INITIALIZATION
const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
const beachTexture = textureLoader.load("img/stock/beach.jpg")
const electricBoardTexture = textureLoader.load("img/electric_texture.png")


//============= MATERIALS ============
// UNIFORMS FOR CUSTOM MATERIALS
const uniforms = THREE.UniformsUtils.merge([
  THREE.UniformsLib["lights"],
  THREE.UniformsLib["common"]
])

uniforms.u_beachImage = { value: beachTexture },
uniforms.u_electricImage = { value: electricBoardTexture },
uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
// uniforms.u_light_position = { value: mainSpotLight.position.clone() };
// uniforms.u_light_intensity = { value: mainSpotLight.intensity };
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };
uniforms.u_time = { value: 1.0 },
uniforms.u_timeDelta = { value: 0.1 },
uniforms.u_radius = { value: 1.0 },
uniforms.u_resolution = { value: new THREE.Vector2() }


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
const vshader_electric = `
    
    uniform float u_time;
   
    varying vec2 v_uv;
    varying vec3 v_position;

    void main() {
      v_uv = uv;
      v_position = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( v_position, 1.0 );
    }
`
const fshader_electric = `
    
    uniform sampler2D u_electricImage;
    uniform float u_time;
    uniform float u_timeDelta;
    
    varying vec2 v_uv;
    varying vec3 v_posiiton;
    

    void main()
    {
      vec2 offset = vec2(u_time/4.0);
      float tileCount = 3.0;
      vec2 phase = fract(v_uv * tileCount);
      vec2 movingPhase = fract((v_uv.y * tileCount)-offset);

      vec4 electricImage = texture2D(u_electricImage, phase);

      vec4 mask = texture2D(u_electricImage, movingPhase);


      gl_FragColor = vec4(vec3(electricImage.g), (mask.r * electricImage.b));
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

export {Material_Static, Material_Fracted, Material_Electric, uniforms}


