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
import {Material_01} from './EmanateShaders'

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
const bgTexture = textureLoader.load( 'https://i.imgur.com/wkjbzYZ.png' );

scene.background = bgTexture;

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

const backgroundMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, map:bgTexture, displacementMap:bgTexture, displacementScale:0});
const breadcrumbMaterial: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({color:0x999999})

// CUSTOM FRACTED SHADER/MATERIAL
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
uniforms.u_resolution = { value: new THREE.Vector2() }

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
`
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

        gl_FragColor = vec4(beachImage.rgb, 0.8);
    }
`
const fractedMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: vshader,
    fragmentShader: fshader,
    lights: true,
    transparent: true,
});
fractedMaterial.extensions.derivatives = true;

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


const icoGeo: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(0.5 * screenMultiplier, 1)

const icoSphere: THREE.Mesh = new THREE.Mesh(icoGeo, fractedMaterial)
icoSphere.position.set(0, 0, 1)
icoSphere.castShadow = true;
icoSphere.receiveShadow = true;
scene.add(icoSphere)

const ball: THREE.SphereBufferGeometry = new THREE.SphereBufferGeometry(0.5,12,12)

const ballMesh: THREE.Mesh = new THREE.Mesh(ball, Material_01)
ballMesh.position.set(1,0 , 1)
ballMesh.castShadow = true;
ballMesh.receiveShadow = true;
scene.add(ballMesh)



//---------- CREATE SOME TEXT

const loader = new TTFLoader();
loader.load('fonts/Azonix.ttf', (fnt) => {

    const font = new THREE.Font(fnt)

    const textGeo = new THREE.TextGeometry( 'Project History', {
        font,
        size: 0.2 * screenMultiplier,
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
    
    
    // textMesh.geometry.center();
    
    
    scene.add(textMesh)
    sceneMeshes.push(textMesh)

})

const textGeo = new THREE.TextGeometry( 'About', {
    font: new THREE.Font( HelvetikerFont ),
    size: 0.2 * screenMultiplier,
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
textMesh.name = "AboutButton"
textMesh.position.set(0,-0.8,1)


textMesh.geometry.center();


scene.add(textMesh)
sceneMeshes.push(textMesh)




// POTENTIAL BACKGROUND PLANE MESH
const invisiblePlaneGeo: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(15, 10, 10, 10)
const backgroundPlane: THREE.Mesh = new THREE.Mesh(invisiblePlaneGeo, backgroundMaterial)
backgroundPlane.visible = true;
backgroundPlane.receiveShadow = true
backgroundPlane.castShadow = true
// backgroundPlane.position.z = -1;
scene.add(backgroundPlane)

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

// ------------------ INPUT SHAPE
let inputShape: THREE.Mesh
gltfLoader.load(
    'models/ShapeInput.glb',
    function (gltf) {

        gltf.scene.traverse(function (child) {
            if ((<THREE.Mesh>child).isMesh) {
                inputShape = <THREE.Mesh>child
                inputShape.receiveShadow = true
                inputShape.castShadow = true
                inputShape.material = breadcrumbMaterial
                inputShape.scale.set( screenMultiplier, screenMultiplier, screenMultiplier)

                //object.geometry.center();
                var box = new THREE.Box3().setFromObject( inputShape )
                var boundingBoxSize = box.max.sub( box.min );
                
                // var height = boundingBoxSize.y;
                // inputShape.position.y = - height / 2;
                
                inputShape.position.set(
                    alignmentsForObject(icoSphere,camera).left + (boundingBoxSize.x /1.3) ,
                    alignmentsForObject(icoSphere,camera).bottom + (boundingBoxSize.y /1.3),
                    1
                    )
                    
                
                
            }
        })
        scene.add(gltf.scene);
    },
    (xhr) => {
        // console.log((xhr.loaded / xhr.total * 100) + '% loaded')
    },
    (error) => {
        console.log(error);
    }
);



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


const onRelease = (event: any) => {
    
    orbitControls.enabled = true;

    // mouse is normalized screen. x-left = -1, x-right = 1, y-top = 1, y-bottom = -1
    let mouse: any
    if (event.touches){
        // Events in case of computer
        mouse = {
            x: (event.changedTouches[0].clientX / renderer.domElement.clientWidth) * 2 - 1,
            y: -(event.changedTouches[0].clientY / renderer.domElement.clientHeight) * 2 + 1
        }
        
    }else {
        // Events in case of phone
        mouse = {
            x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
            y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1
        }
    }
    
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(sceneMeshes, false);

    if(intersects.length > 0 ){
        
        if (intersects[0].object.name === "AboutButton") {

            const menuAnimation = gsap.timeline()
            
            menuAnimation.to(icoSphere.position,{
                x: inputShape.position.x , 
                y:inputShape.position.y,
                z: inputShape.position.z + 0.1,
                duration:1,
                ease:"power3.in"
            });
            menuAnimation.to(icoSphere.scale,{
                x: 0.30, 
                y:0.30,
                z:0.30,
                duration:1.0,
                ease:"power3.in"
            },0);

        }
    }
}

renderer.domElement.addEventListener('click', onRelease, false);
renderer.domElement.addEventListener('touchend', onRelease, false);



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

    // helper.update() //LIGHT HELPER

    uniforms.u_time.value += clock.getDelta();

    icoSphere.rotateY(0.001);
    icoSphere.rotateZ(0.001);
    // mainSpotLight.updateWorldMatrix


    render()
    stats.update()
};

const render = () => {
    composer.render();
}

animate();



