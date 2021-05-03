import http from "http"
import path from "path"
import express from "express"

const port: any = process.env.PORT || 3000

class App {
    private server: http.Server
    private port: number

    constructor(port: number) {
        this.port = port
        const app = express()
        app.use(express.static(path.join(__dirname, '../client')))
        // app.use('/build/three.module.js', express.static(path.join(__dirname, '../../node_modules/three/build/three.module.js')))
        // app.use('/jsm/controls/OrbitControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')))
        // app.use('/jsm/libs/stats.module', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')))
        // app.use('/jsm/loaders/GLTFLoader', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js')))
        // app.use('/jsm/libs/dat.gui.module', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')))
        // app.use('/jsm/postprocessing/RenderPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js')))
        // // effect composer and dependencies
        // app.use('/jsm/postprocessing/EffectComposer.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js')))
        // app.use('/jsm/postprocessing/Pass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/Pass.js')))
        // app.use('/jsm/postprocessing/ShaderPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js')))
        // app.use('/jsm/postprocessing/MaskPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/MaskPass.js')))
        // app.use('/jsm/shaders/CopyShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/CopyShader.js')))
        // // unreal bloom pass and dependenceies
        // app.use('/jsm/postprocessing/UnrealBloomPass.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js')))
        // app.use('/jsm/shaders/LuminosityHighPassShader.js', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/shaders/LuminosityHighPassShader.js')))
        // // fonts to serve
        app.use('/fonts/helvetiker_regular.typeface.json', express.static(path.join(__dirname, '../../node_modules/three/examples/fonts/helvetiker_regular.typeface.json')))
        // // drag controls
        // app.use('/jsm/controls/DragControls', express.static(path.join(__dirname, '../../node_modules/three/examples/jsm/controls/DragControls.js')))
        this.server = new http.Server(app);
    }

    public Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on Port ${this.port}.`)
        })
    }
}

new App(port).Start()