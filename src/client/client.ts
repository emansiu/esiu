import * as THREE from '/build/three.module.js'
import { OrbitControls } from '/jsm/controls/OrbitControls'
import Stats from '/jsm/libs/stats.module'
import { GUI } from '/jsm/libs/dat.gui.module'
// import { GLTFLoader } from '/jsm/loaders/GLTFLoader'
// import { DragControls } from '/jsm/controls/DragControls'



const scene: THREE.Scene = new THREE.Scene()
const sceneMeshes = new Array()


// SET UP CAMERA
const canvasContainer: HTMLElement = <HTMLElement>document.querySelector(".threeContainer");



let height: number = canvasContainer.clientHeight;
let width: number = canvasContainer.clientWidth;
let landscape: boolean = height < width ? true : false
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(50, width/height, 0.6, 1000)
// const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, .001, 1000 )
camera.position.z = 5


const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({ antialias:true, alpha:true});
renderer.setSize(width, height);
canvasContainer.appendChild(renderer.domElement);

console.log(height, width)
const controls = new OrbitControls(camera, renderer.domElement)
//controls.addEventListener('change', render) 

// ADD ICOSAHEDRON
const icoRadius = 1
const icoGeo: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(icoRadius, 1)
const materialPhysical: THREE.MeshPhysicalMaterial = new THREE.MeshPhysicalMaterial({ reflectivity: 0.0, roughness: 0.9, metalness: 0.0, color: 0x000066 })

const vshader = `
    uniform float u_time;
    uniform float u_radius;

    varying vec3 vNormal;
    varying vec2 v_uv;
    varying vec3 vPosition;

    void main() {
        v_uv = uv;
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
    }
`
const fshader = `
    // #extension GL_OES_standard_derivatives : enable

    uniform sampler2D u_beachImage;

    varying vec2 v_uv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float line(float a, float b, float line_width, float edge_thickness){
        float half_line_width = line_width * 0.5;
        return smoothstep(a - half_line_width - edge_thickness, a - half_line_width, b) - smoothstep(a + half_line_width, a + half_line_width + edge_thickness, b);
    }

  

    void main()
    {
        vec3 X = dFdx(vNormal);
        vec3 Y = dFdy(vNormal);
        vec3 normal = normalize(cross(X,Y));

        float diffuse = dot(normal, vec3(0.5));

        vec4 beachImage = texture2D(u_beachImage, v_uv * diffuse + 0.2 );
        
        vec3 color = vec3(1.0) * line(vPosition.x, vPosition.y, 0.1, 0.1);

        gl_FragColor = vec4(beachImage.rgb,0.9);
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
    transparent:true

} );
material.extensions.derivatives = true;

// CREATE SPHERE USING DIMENSIONS OF PAGE
const icoSphere: THREE.Mesh = new THREE.Mesh(icoGeo, material)
icoSphere.position.set(0, 0, 0)
scene.add(icoSphere)

// ADD INVISIBLE PLANE
const invisiblePlaneGeo: THREE.PlaneBufferGeometry = new THREE.PlaneBufferGeometry(50, 50, 1, 1)
const invisibleMat: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({});
const invisiblePlane: THREE.Mesh = new THREE.Mesh(invisiblePlaneGeo, invisibleMat)
invisiblePlane.visible = false
scene.add(invisiblePlane)

// TEMPORARY CUBE
// const boxGeo: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1)
// const boxMesh: THREE.Mesh = new THREE.Mesh(boxGeo, materialPhysical)
// boxMesh.rotateY(45)

// scene.add(boxMesh)


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
// const envTexture = new THREE.CubeTextureLoader().load(["img/HDRI/boxed/friarsLivingRoom/px.png", "img/HDRI/boxed/friarsLivingRoom/nx.png", "img/HDRI/boxed/friarsLivingRoom/py.png", "img/HDRI/boxed/friarsLivingRoom/ny.png", "img/HDRI/boxed/friarsLivingRoom/pz.png", "img/HDRI/boxed/friarsLivingRoom/nz.png"])
// envTexture.mapping = THREE.CubeReflectionMapping
// envTexture.mapping = THREE.CubeRefractionMapping
// material.envMap = envTexture



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

const gui = new GUI()

const customParameters = {
    sFactor: 1
}

const scaleAll = () =>{
    icoSphere.scale.set(customParameters.sFactor,customParameters.sFactor,customParameters.sFactor)
}

const icoFolder = gui.addFolder("Ico Transforms")
icoFolder.add(icoSphere.position, "x", -10, 10)
icoFolder.add(icoSphere.position, "y", -10, 10)
icoFolder.add(icoSphere.position, "z", -10, 10)
icoFolder.add(customParameters, "sFactor", 0.1, 2).onChange(scaleAll);
icoFolder.open()

const onWindowResize = () => {

    const paddingSpace = 1

    let w = canvasContainer.clientWidth
    let h = canvasContainer.clientHeight

    let radius = (h/w )
    
    console.log(`w/h: ${(canvasContainer.clientWidth/canvasContainer.clientHeight).toFixed(3)}, h/w: ${(canvasContainer.clientHeight/canvasContainer.clientWidth).toFixed(3)}, w: ${w}, h: ${h}`)

    
    let leftAlign = (Math.tan(25 * Math.PI / 180) * camera.position.z) * (w/h) * -1 + icoRadius

    icoSphere.position.setX(leftAlign);
    console.log(icoSphere.scale)

    landscape = canvasContainer.clientHeight < canvasContainer.clientWidth ? true : false
    camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight)
    render()
}
window.addEventListener('resize', onWindowResize, false)

const stats = Stats()
document.body.appendChild(stats.dom)




const clock = new THREE.Clock();

const animate = () => {

    requestAnimationFrame(animate)

    // helper.update() //LIGHT HELPER

    uniforms.u_time.value += clock.getDelta();

    icoSphere.rotateY(0.001);
    icoSphere.rotateZ(0.001);
    

    render()
    stats.update()
};

const render = () => {
    renderer.render(scene, camera)
}
animate();


