import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'
import { GLTFLoader } from '/jsm/loaders/GLTFLoader'
import { DragControls } from '/jsm/controls/DragControls'

const scene: THREE.Scene = new THREE.Scene()
const sceneMeshes = new Array()

// HELPERS
var axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

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

// ADD sphere
const sphereGeo: THREE.SphereGeometry = new THREE.SphereGeometry(3,10,10)
const material: THREE.MeshPhysicalMaterial  = new THREE.MeshPhysicalMaterial ({ color: 0x999999 })
const sphere: THREE.Mesh = new THREE.Mesh(sphereGeo, material)
sphere.position.set(10,0,0)
scene.add(sphere)

// ADD INVISIBLE PLANE
const invisiblePlaneGeo: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(50,50,1,1)
const invisibleMat: THREE.MeshBasicMaterial  = new THREE.MeshBasicMaterial({});
const invisiblePlane: THREE.Mesh = new THREE.Mesh(invisiblePlaneGeo, invisibleMat)
invisiblePlane.visible = false
scene.add(invisiblePlane)

// sceneMeshes.push(sphere,invisiblePlane) //<--- push all geo we will interact with
sceneMeshes.push(invisiblePlane) //<--- push all geo we will interact with

// LIGHTS

const mainSpotLight = new THREE.SpotLight(0xffffff, 5,15,0.4,0.5);
mainSpotLight.position.set(0, 1, 10);
mainSpotLight.castShadow = true
//mainSpotLight.shadow.bias = -.003
mainSpotLight.shadow.mapSize.width = 2048
mainSpotLight.shadow.mapSize.height = 2048
scene.add(mainSpotLight);
scene.add(mainSpotLight.target);


var ambientLightFill = new THREE.AmbientLight( '',0.2);
scene.add(ambientLightFill);

// LIGHT --- HELPER
var helper = new THREE.SpotLightHelper(mainSpotLight);
scene.add(helper);

const loader = new GLTFLoader()
loader.load(
    './models/icoSphere.glb',
    function (gltf) {
        gltf.scene.traverse(function (child) {
            if ((<THREE.Mesh>child).isMesh) {
                let m = <THREE.Mesh>child
                m.scale.set(3,3,3)
                m.receiveShadow = true
                m.castShadow = true
            }
        })
        scene.add(gltf.scene);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    (error) => {
        console.log(error);
    }
);

// RAYCASTER 
renderer.domElement.addEventListener('mousemove', onMouseMove, false);

const raycaster = new THREE.Raycaster();


function onMouseMove(event: MouseEvent) {
    // mouse is normalized screen. x-left = -1, x-right = 1, y-top = 1, y-bottom = -1
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
    }
    

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, false);

    if (intersects.length > 0) {
        const {x,y,z} = intersects[0].point
        // invisiblePlane.position.set(x,y,z)
        //console.log(sceneMeshes.length + " " + intersects.length)
        //console.log(intersects[0])
        //console.log(intersects[0].object.userData.name + " " + intersects[0].distance + " ")
        //console.log(intersects[0].face.normal)
        // line.position.set(0, 0, 0);
        // line.lookAt(intersects[0].face.normal);
        // line.position.copy(intersects[0].point);

        mainSpotLight.target.position.set(x,y,z)

        // let n = new THREE.Vector3();
        // n.copy(intersects[0].face.normal);
        // n.transformDirection(intersects[0].object.matrixWorld);

        // arrowHelper.setDirection(n);
        // arrowHelper.position.copy(intersects[0].point);
    }
}

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
const cubeFolder = gui.addFolder("sphere")
// cubeFolder.add(sphere.rotation, "x", 0, Math.PI * 2, 0.01)
// cubeFolder.add(sphere.rotation, "y", 0, Math.PI * 2, 0.01)
// cubeFolder.add(sphere.rotation, "z", 0, Math.PI * 2, 0.01)
cubeFolder.open()
const cameraFolder = gui.addFolder("Camera")
cameraFolder.add(camera.position, "z", 0, 10, 0.01)
cameraFolder.open()



var animate = function () {
    requestAnimationFrame(animate)
    helper.update()
    render()

    stats.update()
};

function render() {
    renderer.render(scene, camera)
}
animate();