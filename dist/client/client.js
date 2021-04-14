import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
import { GUI } from '/jsm/libs/dat.gui.module';
import { GLTFLoader } from '/jsm/loaders/GLTFLoader';
import { EffectComposer } from '/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/jsm/postprocessing/UnrealBloomPass.js';
// import { DragControls } from '/jsm/controls/DragControls'
// SET UP SCENE
const scene = new THREE.Scene();
const sceneMeshes = new Array();
const canvasContainer = document.querySelector(".threeContainer");
// WINDOW ATTRIBUTES
let height = canvasContainer.clientHeight;
let width = canvasContainer.clientWidth;
let landscape = height < width ? true : false;
// CAMERA
const camera = new THREE.PerspectiveCamera(40, width / height, 0.6, 1000);
camera.position.z = 5;
// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
canvasContainer.appendChild(renderer.domElement);
// EFFECTS COMPOSER
const composerResolution = new THREE.Vector2(1024, 1024);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
// BLOOM PARAMETERS
const bloom = {
    strength: 1.5,
    radius: 1.0,
    threshold: 0.75
};
composer.addPass(new UnrealBloomPass(composerResolution, bloom.strength, bloom.radius, bloom.threshold));
const controls = new OrbitControls(camera, renderer.domElement);
//controls.addEventListener('change', render) 
// ====================================LIGHTS=================================================
// LIGHTS
const mainSpotLight = new THREE.SpotLight(0xffffff, 1, 20, 0.4, 0.5);
mainSpotLight.position.set(0, 1, 10);
mainSpotLight.castShadow = true;
// mainSpotLight.shadow.bias = -.003
mainSpotLight.shadow.mapSize.width = 2048;
mainSpotLight.shadow.mapSize.height = 2048;
// mainSpotLight.shadow.radius = 8
scene.add(mainSpotLight);
scene.add(mainSpotLight.target);
// MAIN SPOT LIGHT --- HELPER
// const helper = new THREE.SpotLightHelper(mainSpotLight);
const helper = new THREE.CameraHelper(mainSpotLight.shadow.camera);
scene.add(helper);
const ambientLightFill = new THREE.AmbientLight('', 0.2);
scene.add(ambientLightFill);
//============= MATERIALS ============
const materialPhysical = new THREE.MeshPhysicalMaterial({ reflectivity: 1.0, roughness: 0.1, metalness: 0.8, color: 0xffffff });
const backgroundMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff });
// CUSTOM SHADER/MATERIAL
const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib["lights"],
    THREE.UniformsLib["common"]
]);
uniforms.u_beachImage = { value: new THREE.TextureLoader().load("img/stock/beach.jpg") },
    uniforms.u_color = { value: new THREE.Color(0xa6e4fa) };
uniforms.u_light_position = { value: mainSpotLight.position.clone() };
uniforms.u_light_intensity = { value: mainSpotLight.intensity };
uniforms.u_rim_color = { value: new THREE.Color(0xffffff) };
uniforms.u_rim_strength = { value: 1.6 };
uniforms.u_rim_width = { value: 0.6 };
uniforms.u_time = { value: 1.0 },
    uniforms.u_radius = { value: 1.0 },
    uniforms.u_resolution = { value: new THREE.Vector2() };
const vshader = `
    
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
`;
const fshader = `
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

        gl_FragColor = vec4(beachImage.rgb, 1.0);
    }
`;
const vVertexLights = `



varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;

void main() {


    vNormal = normal;
    vUv = uv;
    vPosition = position;


    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`;
const vFragLights = `
uniform mat4 modelMatrix;

uniform vec3 u_color;
uniform vec3 u_light_position;

// Example varyings passed from the vertex shader
varying vec3 vPosition;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vUv2;

void main() {


    vec3 worldPosition = ( modelMatrix * vec4( vPosition, 1.0 )).xyz;


    vec3 worldNormal = normalize( vec3( modelMatrix * vec4( vNormal, 0.0 ) ) );

    vec3 lightVector = normalize( u_light_position - worldPosition );

    float brightness = dot( worldNormal, lightVector );
    // float brightness = dot( vec3(0.0, 1.0, 0.0), vNormal );

    // Fragment shaders set the gl_FragColor, which is a vector4 of
    // ( red, green, blue, alpha ).
    gl_FragColor = vec4( u_color.rgb * brightness, 1.0 );
    // gl_FragColor = vec4( 1.0 );

}
`;
const fractedMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader,
    fragmentShader: fshader,
    lights: true,
    transparent: true,
});
fractedMaterial.extensions.derivatives = true;
// materialPhysical.onBeforeCompile = aha => console.log(aha.vertexShader, aha.fragmentShader)
// =========== GEOMETRY ==================
// CREATE SPHERE USING DIMENSIONS OF PAGE
// !!!!!!!!!!!!!!!!!!! ^^^^^^^^^ TO DO ^^^^!!!!!!!!!!!!!!!!!!!!!!!!
// ADD ICOSAHEDRON
const icoRadius = 0.5;
const icoGeo = new THREE.IcosahedronGeometry(icoRadius, 1);
const icoSphere = new THREE.Mesh(icoGeo, fractedMaterial);
icoSphere.position.set(0, 0, 1);
icoSphere.castShadow = true;
icoSphere.receiveShadow = true;
scene.add(icoSphere);
// const ballGeo: THREE.SphereGeometry = new THREE.SphereGeometry(1,6,6)
// const ballMesh: THREE.Mesh = new THREE.Mesh(ballGeo,materialPhysical);
// ballMesh.receiveShadow = true
// ballMesh.castShadow = true
// ballMesh.position.x = 2;
// scene.add(ballMesh)
// ADD INVISIBLE PLANE
const invisiblePlaneGeo = new THREE.PlaneBufferGeometry(50, 50, 1, 1);
const backgroundPlane = new THREE.Mesh(invisiblePlaneGeo, backgroundMaterial);
backgroundPlane.visible = true;
backgroundPlane.receiveShadow = true;
backgroundPlane.castShadow = true;
// backgroundPlane.position.z = -1;
scene.add(backgroundPlane);
sceneMeshes.push(backgroundPlane);
// ======== IMPORT OBJECTS =============
const loader = new GLTFLoader();
loader.load('models/EmanuelSiu_Text_Curved.gltf', function (gltf) {
    gltf.scene.traverse(function (child) {
        if (child.isMesh) {
            let m = child;
            m.receiveShadow = true;
            m.castShadow = true;
            m.material = materialPhysical;
            m.position.setZ(1.5);
            m.position.setY(0.6);
            m.scale.set(0.6, 0.6, 0.6);
        }
    });
    scene.add(gltf.scene);
}, (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, (error) => {
    console.log(error);
});
//============ ENVIRONMENT HDR ==============
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"]);
envTexture.mapping = THREE.CubeReflectionMapping;
// envTexture.mapping = THREE.CubeRefractionMapping
materialPhysical.envMap = envTexture;
// ======== RAYCASTER ==========
renderer.domElement.addEventListener('mousemove', onMouseMove, false);
const raycaster = new THREE.Raycaster();
function onMouseMove(event) {
    // mouse is normalized screen. x-left = -1, x-right = 1, y-top = 1, y-bottom = -1
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    };
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(sceneMeshes, false);
    if (intersects.length > 0) {
        const { x, y, z } = intersects[0].point;
        mainSpotLight.target.position.set(x, y, z);
    }
}
// ============ GUI ============-
const gui = new GUI();
const customParameters = {
    sFactor: 1
};
const scaleAll = () => {
    icoSphere.scale.set(customParameters.sFactor, customParameters.sFactor, customParameters.sFactor);
};
const icoFolder = gui.addFolder("Ico Transforms");
icoFolder.add(icoSphere.position, "x", -10, 10);
icoFolder.add(icoSphere.position, "y", -10, 10);
icoFolder.add(icoSphere.position, "z", -10, 10);
icoFolder.add(customParameters, "sFactor", 0.1, 2).onChange(scaleAll);
icoFolder.open();
const lightFolder = gui.addFolder("Light Properties");
lightFolder.add(mainSpotLight, "intensity", 0, 10);
lightFolder.open();
const onWindowResize = () => {
    const paddingSpace = 0.1;
    let w = canvasContainer.clientWidth;
    let h = canvasContainer.clientHeight;
    let desiredRatio = w / h;
    console.log(camera.fov);
    // formula for left align below
    // let leftAlign = (((Math.tan((camera.fov/2) * Math.PI / 180) * camera.position.z) *desiredRatio) * -1 ) + ((1 * icoSphere.scale.x) + paddingSpace)
    // icoSphere.position.setX(leftAlign);
    landscape = canvasContainer.clientHeight < canvasContainer.clientWidth ? true : false;
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    render();
};
window.addEventListener('resize', onWindowResize, false);
//====  STATS =====
const stats = Stats();
document.body.appendChild(stats.dom);
// ======== BEGIN ANIMATION LOOP
const clock = new THREE.Clock();
const animate = () => {
    requestAnimationFrame(animate);
    helper.update(); //LIGHT HELPER
    uniforms.u_time.value += clock.getDelta();
    icoSphere.rotateY(0.001);
    icoSphere.rotateZ(0.001);
    // icoSphere.position.y = Math.sin(clock.elapsedTime)/18;
    mainSpotLight.updateWorldMatrix;
    render();
    stats.update();
};
const render = () => {
    // renderer.render(scene, camera)
    composer.render();
};
animate();
