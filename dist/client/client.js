import * as THREE from '/build/three.module.js';
import { OrbitControls } from '/jsm/controls/OrbitControls';
import Stats from '/jsm/libs/stats.module';
import { GUI } from '/jsm/libs/dat.gui.module';
const scene = new THREE.Scene();
const sceneMeshes = new Array();
// SET UP CAMERA
const height = window.innerHeight;
const width = window.innerWidth;
const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
camera.position.z = 10;
const renderer = new THREE.WebGLRenderer();
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
//controls.addEventListener('change', render) 
// ADD ICOSAHEDRON
const icoGeo = new THREE.IcosahedronGeometry(4, 2);
// const material: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ reflectivity: 0.0, roughness: 0.9, metalness: 0.0, color: 0x000066 })
const vshader = `
uniform float u_time;
uniform float u_radius;

void main() {
  vec3 pos = position;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
}
`;
const fshader = `
void main()
{
  vec3 color = vec3(0.5,0.4,1.0);
  gl_FragColor = vec4(color, 1.0);
}
`;
const material = new THREE.ShaderMaterial({
    uniforms: {
        u_time: { value: 1.0 },
        u_radius: { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
    },
    vertexShader: vshader,
    fragmentShader: fshader
});
const icoSphere = new THREE.Mesh(icoGeo, material);
icoSphere.position.set(0, 0, 0);
scene.add(icoSphere);
// ADD INVISIBLE PLANE
const invisiblePlaneGeo = new THREE.PlaneBufferGeometry(50, 50, 1, 1);
const invisibleMat = new THREE.MeshBasicMaterial({});
const invisiblePlane = new THREE.Mesh(invisiblePlaneGeo, invisibleMat);
invisiblePlane.visible = false;
scene.add(invisiblePlane);
// sceneMeshes.push(sphere,invisiblePlane) //<--- push all geo we will interact with
sceneMeshes.push(invisiblePlane); //<--- push all geo we will interact with
// LIGHTS
const mainSpotLight = new THREE.SpotLight(0xffffff, 25, 20, 0.4, 0.5);
mainSpotLight.position.set(0, 1, 10);
mainSpotLight.castShadow = true;
//mainSpotLight.shadow.bias = -.003
mainSpotLight.shadow.mapSize.width = 2048;
mainSpotLight.shadow.mapSize.height = 2048;
scene.add(mainSpotLight);
scene.add(mainSpotLight.target);
var ambientLightFill = new THREE.AmbientLight('', 0.1);
scene.add(ambientLightFill);
// LIGHT --- HELPER
var helper = new THREE.SpotLightHelper(mainSpotLight);
scene.add(helper);
// ENVIRONMENT HDR
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"]);
envTexture.mapping = THREE.CubeReflectionMapping;
// envTexture.mapping = THREE.CubeRefractionMapping
material.envMap = envTexture;
// RAYCASTER 
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
        // invisiblePlane.position.set(x,y,z)
        //console.log(sceneMeshes.length + " " + intersects.length)
        //console.log(intersects[0])
        //console.log(intersects[0].object.userData.name + " " + intersects[0].distance + " ")
        //console.log(intersects[0].face.normal)
        // line.position.set(0, 0, 0);
        // line.lookAt(intersects[0].face.normal);
        // line.position.copy(intersects[0].point);
        mainSpotLight.target.position.set(x, y, z);
        // let n = new THREE.Vector3();
        // n.copy(intersects[0].face.normal);
        // n.transformDirection(intersects[0].object.matrixWorld);
        // arrowHelper.setDirection(n);
        // arrowHelper.position.copy(intersects[0].point);
    }
}
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}
const stats = Stats();
document.body.appendChild(stats.dom);
const gui = new GUI();
const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(camera.position, "z", 0, 10, 0.01);
cameraFolder.open();
// console.log(sceneMeshes[0].length)
// console.log(sceneMeshes[1].name)
var animate = function () {
    requestAnimationFrame(animate);
    helper.update();
    render();
    stats.update();
};
function render() {
    renderer.render(scene, camera);
}
animate();
