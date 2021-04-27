"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const port = process.env.PORT || 3000;
class App {
    constructor(port) {
        this.port = port;
        const app = express_1.default();
        app.use(express_1.default.static(path_1.default.join(__dirname, '../client')));
        app.use('/build/three.module.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/build/three.module.js')));
        app.use('/jsm/controls/OrbitControls', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/controls/OrbitControls.js')));
        app.use('/jsm/libs/stats.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/stats.module.js')));
        app.use('/jsm/loaders/GLTFLoader', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/loaders/GLTFLoader.js')));
        app.use('/jsm/libs/dat.gui.module', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/libs/dat.gui.module.js')));
        app.use('/jsm/postprocessing/RenderPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js')));
        // effect composer and dependencies
        app.use('/jsm/postprocessing/EffectComposer.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js')));
        app.use('/jsm/postprocessing/Pass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/Pass.js')));
        app.use('/jsm/postprocessing/ShaderPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js')));
        app.use('/jsm/postprocessing/MaskPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/MaskPass.js')));
        app.use('/jsm/shaders/CopyShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/CopyShader.js')));
        // unreal bloom pass and dependenceies
        app.use('/jsm/postprocessing/UnrealBloomPass.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js')));
        app.use('/jsm/shaders/LuminosityHighPassShader.js', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/jsm/shaders/LuminosityHighPassShader.js')));
        // fonts to serve
        app.use('/fonts/helvetiker_regular.typeface.json', express_1.default.static(path_1.default.join(__dirname, '../../node_modules/three/examples/fonts/helvetiker_regular.typeface.json')));
        this.server = new http_1.default.Server(app);
    }
    Start() {
        this.server.listen(this.port, () => {
            console.log(`Server listening on Port ${this.port}.`);
        });
    }
}
new App(port).Start();
//# sourceMappingURL=server.js.map