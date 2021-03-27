import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
// import { GUI } from '/jsm/libs/dat.gui.module'
// import { GLTFLoader } from '/jsm/loaders/GLTFLoader'
// import { DragControls } from '/jsm/controls/DragControls'



const scene: THREE.Scene = new THREE.Scene()
scene.background = new THREE.Color(0xDDDDDD);
const sceneMeshes = new Array()


// SET UP CAMERA
const height: number = window.innerHeight
const width: number = window.innerWidth
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
camera.position.z = 10


const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer()
renderer.physicallyCorrectLights = true
renderer.shadowMap.enabled = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
//controls.addEventListener('change', render) 

// ADD ICOSAHEDRON
const icoGeo: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(4, 1)
// const material: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ reflectivity: 0.0, roughness: 0.9, metalness: 0.0, color: 0x000066 })

const vshader = `
    uniform float u_time;
    uniform float u_radius;

    varying vec3 vNormal;
    varying vec2 v_uv;

    void main() {
        v_uv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 pos = position;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
    }
`
const fshader = `
    uniform sampler2D u_beachImage;

    varying vec2 v_uv;
    varying vec3 vNormal;

    void main()
    {
        vec3 X = dFdx(vNormal);
        vec3 Y = dFdy(vNormal);
        vec3 normal = normalize(cross(X,Y));

        float diffuse = dot(normal, vec3(1.0));

        vec4 beachImage = texture2D(u_beachImage, v_uv * diffuse );

        gl_FragColor = beachImage;
        // gl_FragColor = vec4(diffuse);
    }
`
const uniforms = {

    u_beachImage: {value: new THREE.TextureLoader().load("img/stock/beach.jpg")},
    u_time: { value: 1.0 },
    u_radius: {value: 1.0},
    u_resolution: { value: new THREE.Vector2() }

}
const material = new THREE.ShaderMaterial( {

	uniforms,

	vertexShader: vshader,

	fragmentShader: fshader,
    // wireframe:true

} );
const icoSphere: THREE.Mesh = new THREE.Mesh(icoGeo, material)
icoSphere.position.set(0, 0, 0)
scene.add(icoSphere)

// ADD INVISIBLE PLANE
const invisiblePlaneGeo: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(50, 50, 1, 1)
const invisibleMat: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({});
const invisiblePlane: THREE.Mesh = new THREE.Mesh(invisiblePlaneGeo, invisibleMat)
invisiblePlane.visible = false
scene.add(invisiblePlane)

// sceneMeshes.push(sphere,invisiblePlane) //<--- push all geo we will interact with
sceneMeshes.push(invisiblePlane) //<--- push all geo we will interact with
// ====================================LIGHTS=================================================
// // LIGHTS

// const mainSpotLight = new THREE.SpotLight(0xffffff, 25, 20, 0.4, 0.5);
// mainSpotLight.position.set(0, 1, 10);
// mainSpotLight.castShadow = true
// //mainSpotLight.shadow.bias = -.003
// mainSpotLight.shadow.mapSize.width = 2048
// mainSpotLight.shadow.mapSize.height = 2048
// scene.add(mainSpotLight);
// scene.add(mainSpotLight.target);


// var ambientLightFill = new THREE.AmbientLight( '',0.1);
// scene.add(ambientLightFill);

// // LIGHT --- HELPER
// var helper = new THREE.SpotLightHelper(mainSpotLight);
// scene.add(helper);
// ====================================LIGHTS=================================================

// ENVIRONMENT HDR
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"])
envTexture.mapping = THREE.CubeReflectionMapping
// envTexture.mapping = THREE.CubeRefractionMapping
material.envMap = envTexture



// RAYCASTER 
// renderer.domElement.addEventListener('mousemove', onMouseMove, false);

const raycaster = new THREE.Raycaster();


// function onMouseMove(event: MouseEvent) {
//     // mouse is normalized screen. x-left = -1, x-right = 1, y-top = 1, y-bottom = -1
//     const mouse = {
//         x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
//         y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
//     }

//     raycaster.setFromCamera(mouse, camera);

//     const intersects = raycaster.intersectObjects(sceneMeshes, false);

//     if (intersects.length > 0) {
//         const { x, y, z } = intersects[0].point

//         mainSpotLight.target.position.set(x, y, z)

//     }
// }

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats()
document.body.appendChild(stats.dom)




const clock = new THREE.Clock();

var animate = function () {

    requestAnimationFrame(animate)

    // helper.update() //LIGHT HELPER

    uniforms.u_time.value += clock.getDelta();

    icoSphere.rotateY(0.001)
    icoSphere.rotateZ(0.001)

    render()
    stats.update()
};

function render() {
    renderer.render(scene, camera)
}
animate();