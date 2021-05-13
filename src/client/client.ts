import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TTFLoader  } from 'three/examples/jsm/loaders/TTFLoader'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import {UnrealBloomPass} from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { DragControls } from 'three/examples/jsm/controls/DragControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import {gsap} from 'gsap';
// IMPORT FONTS WE WANT TO USE
import HelvetikerFont from 'three/examples/fonts/helvetiker_regular.typeface.json'; 
// IMPORT CUSTOM MATERIALS
import {Material_Fracted, Material_Static, Material_Circuit, Material_Electric, uniforms } from './EmanateShaders'

console.log(HelvetikerFont)


// ========================= HELPER FUNCTIONS =================================
const alignmentsForObject = (object: THREE.Mesh, currentCamera:THREE.PerspectiveCamera) => {
    const w = canvasContainer.clientWidth
    const h = canvasContainer.clientHeight
    const desiredRatio = w / h
    const rightAlign = (((Math.tan((currentCamera.fov/2) * Math.PI / 180) * (currentCamera.position.z - object.position.z)) * desiredRatio) );
    const leftAlign = rightAlign * -1;
    const topAlign = (((Math.tan((currentCamera.fov/2) * Math.PI / 180) * (currentCamera.position.z - object.position.z))));
    const bottomAlign = topAlign * -1;

    return {
        top:topAlign, 
        right:rightAlign, 
        bottom:bottomAlign, 
        left:leftAlign
    }
}

// SET UP SCENE
const scene: THREE.Scene = new THREE.Scene()
const sceneMeshes = new Array()


const canvasContainer: HTMLElement = <HTMLElement>document.querySelector(".threeContainer");


// WINDOW ATTRIBUTES
let height: number = canvasContainer.clientHeight;
let width: number = canvasContainer.clientWidth;
let landscape: boolean = height < width ? true : false

// CAMERA
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(40, width / height, 0.6, 1000)
camera.position.z = 5

// TEXTURES
const textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
const bgTexture = textureLoader.load( 'https://t4.ftcdn.net/jpg/02/34/98/73/360_F_234987365_1bwmHyUjVOKIibWEbnwaayE9FQiq2xpu.jpg' );

scene.background = bgTexture
// scene.background = new THREE.Color(0x333333);

// RENDERER
const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// renderer.setClearColor(new THREE.Color('#21282a'),1)

canvasContainer.appendChild(renderer.domElement);

var parameters = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, stencilBuffer: true };

var renderTarget = new THREE.WebGLRenderTarget( width, height, parameters );

// EFFECTS COMPOSER
const composerResolution: THREE.Vector2 = new THREE.Vector2(1024, 1024);
const composer = new EffectComposer(renderer, renderTarget);
const renderPass = new RenderPass(scene, camera );

composer.addPass(renderPass);

// BLOOM PARAMETERS
const bloom = {
    strength: 0.8,
    radius: 1.0,
    threshold: 0.75
}

const bloomPass = new UnrealBloomPass( composerResolution, bloom.strength, bloom.radius, bloom.threshold)
composer.addPass(bloomPass);


// ====================================LIGHTS=================================================

//-------------------------------------- MAIN SPOTLIGHT
const mainSpotLight = new THREE.SpotLight(0xffffff, 0.7, 15, 0.4, 0.6,1); //color, intensity, distance, angle, penumbra, decay
mainSpotLight.position.set(0, 1, 10);
mainSpotLight.castShadow = true
// mainSpotLight.shadow.bias = -.003
mainSpotLight.shadow.mapSize.width = 2048
mainSpotLight.shadow.mapSize.height = 2048
// mainSpotLight.shadow.radius = 8

scene.add(mainSpotLight);

//-------------------------------- TOP DOWN SUPPORT SPOTLIGHT
const supportSpotLight = new THREE.SpotLight(0xffffff, 1.2, 16, 0.2, 0.6); //color, intensity, distance, angle, penumbra, decay
supportSpotLight.position.set(0, 10, 10);
supportSpotLight.castShadow = false;

scene.add(supportSpotLight);

// MAIN SPOT LIGHT --- HELPER
// const helper = new THREE.SpotLightHelper(mainSpotLight);
// const helper = new THREE.CameraHelper(mainSpotLight.shadow.camera);
// scene.add(helper);

//----------------------------------- AMBIENT LIGHT
const ambientLightFill = new THREE.AmbientLight('', 0.1);
scene.add(ambientLightFill);




//============= MATERIALS ============



const shadowMaterial = new THREE.ShadowMaterial();
shadowMaterial.opacity = 0.5;

const materialPhysical: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ reflectivity: 1.0, roughness: 0.1, metalness: 0.8, color: 0xffffff });

// const backgroundMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map:bgTexture, displacementMap:bgTexture, displacementScale:0});
// const breadcrumbMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({color:0x999999})




// materialPhysical.onBeforeCompile = aha => console.log(aha.vertexShader, aha.fragmentShader)




// =========== GEOMETRY =============================

// CREATE SPHERE USING DIMENSIONS OF PAGE &&&& ALSO MAKE MESH CLASS CLASS / CONSTRUCTOR
// !!!!!!!!!!!!!!!!!!! ^^^^^^^^^ TO DO ^^^^!!!!!!!!!!!!!!!!!!!!!!!!

// const MeshClass = class {
//     constructor(name:string, geo:any, material:any) {
//         this.name = name;
//         this.geo = geo;
//         this.material = material;
//     }
// }


//------- ADD ICOSAHEDRON
// const icoRadius = 0.5
let icoRadius:number ;
let screenMultiplier: number;

if (landscape){
    icoRadius = (((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (height/width)) * 1 )/2
    // screenMultiplier = (((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (height/width)) )
} else {
    icoRadius = (((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (width/height)) * 1 )/2
    // screenMultiplier = (((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (width/height)) )
}

// screenMultiplier =  (((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (width/height)) )
screenMultiplier =  width/height > 1 ? 1 : width/height



// ELECTRIC BALL
const electricBallGeo: THREE.SphereBufferGeometry = new THREE.SphereBufferGeometry(0.5,16,16)

const electricBallMesh: THREE.Mesh = new THREE.Mesh(electricBallGeo, Material_Circuit)
electricBallMesh.position.set(0, 0 , 1)
electricBallMesh.castShadow = true;
electricBallMesh.receiveShadow = true;
scene.add(electricBallMesh)



//---------- CREATE SOME TEXT-----------

const loader = new TTFLoader();
loader.load('fonts/Azonix.ttf', (fnt) => {

    const font = new THREE.Font(fnt)

    const textGeo = new THREE.TextGeometry( 'Project History', {
        font,
        size: 0.15 * screenMultiplier,
        height: 0.05,
        curveSegments: 16,
        bevelEnabled: true,
        bevelThickness: .01,
        bevelSize: 0.006,
        bevelOffset: 0,
        bevelSegments: 4,
    } );
    
    const textMesh = new THREE.Mesh(textGeo, materialPhysical)
    textMesh.castShadow = true;
    textMesh.name = "ProjectHistory"
    textMesh.position.set(0,0.8,1)
    
    
    textMesh.geometry.center();
    
    
    scene.add(textMesh)
    sceneMeshes.push(textMesh)

})

loader.load('fonts/Azonix.ttf', (fnt) => {

    const font = new THREE.Font(fnt)

    const textGeo = new THREE.TextGeometry( 'About', {
        font,
        size: 0.15 * screenMultiplier,
        height: 0.05,
        curveSegments: 16,
        bevelEnabled: true,
        bevelThickness: .01,
        bevelSize: 0.006,
        bevelOffset: 0,
        bevelSegments: 4,
    } );
    
    const textMesh = new THREE.Mesh(textGeo, materialPhysical)
    textMesh.castShadow = true;
    textMesh.name = "About"
    textMesh.position.set(0,-0.8,1)
    
    
    textMesh.geometry.center();
    
    
    scene.add(textMesh)
    sceneMeshes.push(textMesh)

})

loader.load('fonts/Azonix.ttf', (fnt) => {

    const font = new THREE.Font(fnt)

    const textGeo = new THREE.TextGeometry( 'Contact', {
        font,
        size: 0.15 * screenMultiplier,
        height: 0.05,
        curveSegments: 16,
        bevelEnabled: true,
        bevelThickness: .01,
        bevelSize: 0.006,
        bevelOffset: 0,
        bevelSegments: 4,
    } );
    
    const textMesh = new THREE.Mesh(textGeo, materialPhysical)
    textMesh.castShadow = true;
    textMesh.name = "Contact"
    textMesh.position.set(1.2,0,1)
    
    
    textMesh.geometry.center();
    
    
    scene.add(textMesh)
    sceneMeshes.push(textMesh)

})


// POTENTIAL BACKGROUND PLANE MESH
// const invisiblePlaneGeo: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(15, 10, 10, 10)
// const backgroundPlane: THREE.Mesh = new THREE.Mesh(invisiblePlaneGeo, backgroundMaterial)
// backgroundPlane.visible = true;
// backgroundPlane.receiveShadow = true
// backgroundPlane.castShadow = true
// backgroundPlane.position.z = -1;
// scene.add(backgroundPlane)

// ======== IMPORT OBJECTS =============
const gltfLoader = new GLTFLoader()
//---------- MY NAME
// let EmanuelSiu:THREE.Mesh
// gltfLoader.load(
//     'models/EmanuelSiu_Text_Curved.gltf',
//     function (gltf) {

        

//         gltf.scene.traverse(function (child) {
//             if ((<THREE.Mesh>child).isMesh) {
//                 EmanuelSiu = <THREE.Mesh>child
//                 EmanuelSiu.receiveShadow = true
//                 EmanuelSiu.castShadow = true
//                 EmanuelSiu.material = materialPhysical
//                 EmanuelSiu.position.setZ(1.25)
//                 EmanuelSiu.position.setY(0.6)
//                 EmanuelSiu.scale.set( screenMultiplier, screenMultiplier, screenMultiplier)
//             }
//         })
//         scene.add(gltf.scene);
//     },
//     (xhr) => {
//         // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
//     },
//     (error) => {
//         console.log(error);
//     }
// );





//============ ENVIRONMENT HDR ==============
const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"])
envTexture.mapping = THREE.CubeReflectionMapping
// envTexture.mapping = THREE.CubeRefractionMapping
materialPhysical.envMap = envTexture



// ================ CONTROLS =====================

// --- ORBIT CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement)
// orbitControls.minPolarAngle = Math.PI/2.3;
// orbitControls.maxPolarAngle = (Math.PI) - (Math.PI/2.3);
// orbitControls.minAzimuthAngle = - Math.PI /10
// orbitControls.maxAzimuthAngle = Math.PI /10
// orbitControls.enablePan = false;
// orbitControls.enableZoom = false;
orbitControls.target.set(0,0,1)



// ======== RAYCASTER ==========

const raycaster = new THREE.Raycaster();


// const onRelease = (event: any) => {
    
//     orbitControls.enabled = true;

//     // mouse is normalized screen. x-left = -1, x-right = 1, y-top = 1, y-bottom = -1
//     let mouse: any
//     if (event.touches){
//         // Events in case of computer
//         mouse = {
//             x: (event.changedTouches[0].clientX / renderer.domElement.clientWidth) * 2 - 1,
//             y: -(event.changedTouches[0].clientY / renderer.domElement.clientHeight) * 2 + 1
//         }
        
//     }else {
//         // Events in case of phone
//         mouse = {
//             x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
//             y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
//         }
//     }
    
//     raycaster.setFromCamera(mouse, camera);

//     const intersects = raycaster.intersectObjects(sceneMeshes, false);

//     if(intersects.length > 0 ){
        
//         if (intersects[0].object.name === "AboutButton") {

//             const menuAnimation = gsap.timeline()
            
//             menuAnimation.to(icoSphere.position,{
//                 x: inputShape.position.x , 
//                 y:inputShape.position.y,
//                 z: inputShape.position.z + 0.1,
//                 duration:1,
//                 ease:"power3.in"
//             });
//             menuAnimation.to(icoSphere.scale,{
//                 x: 0.30, 
//                 y:0.30,
//                 z:0.30,
//                 duration:1.0,
//                 ease:"power3.in"
//             },0);

//         }
//     }
// }

// renderer.domElement.addEventListener('click', onRelease, false);
// renderer.domElement.addEventListener('touchend', onRelease, false);



const onWindowResize = () => {

    // icoSphere.position.setX( alignmentsForObject(icoSphere).right )
    // console.log(screenMultiplier)

    const h: number = canvasContainer.clientHeight;
    const w: number = canvasContainer.clientWidth;

    if (w/h < 1.0){
        const cgWidth =  Math.abs((((Math.tan((camera.fov/2) * Math.PI / 180) * (camera.position.z - 1)) * (w/h)) ))
        screenMultiplier =  w/h
    }

    // icoSphere.scale.set(screenMultiplier,screenMultiplier,screenMultiplier)
    // EmanuelSiu.scale.set( screenMultiplier, screenMultiplier, screenMultiplier)

    // icoSphere.position.setX(alignmentsForObject(icoSphere,camera).right);
    // inputShape.position.setX(alignmentsForObject(icoSphere,camera).left);
    // inputShape.position.setY(alignmentsForObject(icoSphere,camera).bottom);


    landscape = canvasContainer.clientHeight < canvasContainer.clientWidth ? true : false

    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight)
    render()
}

window.addEventListener('resize', onWindowResize, false)



//====  STATS =====
const stats = Stats()
document.body.appendChild(stats.dom)

// ======== BEGIN ANIMATION LOOP

const clock = new THREE.Clock();

const animate = () => {

    requestAnimationFrame(animate)


    uniforms.u_time.value += clock.getDelta();
    uniforms.u_timeDelta.value = clock.getDelta();

    electricBallMesh.rotateY(0.001);


    render()
    stats.update()
};

const render = () => {
    composer.render();
}

animate();



