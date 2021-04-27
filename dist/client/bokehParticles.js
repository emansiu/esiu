"use strict";
// PARTICLE MATERIAL SHADER
const particleUniform = {
    pointTexture: { value: new THREE.TextureLoader().load("img/bokeh.png") },
    u_time: { value: 1.0 }
};
const vertexParticleShader = `
    attribute float size;

    uniform float u_time;
    varying vec3 vColor;

    void main() {

        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
        gl_PointSize = size * ( 300.0 / -mvPosition.z );
        gl_Position = projectionMatrix * mvPosition;

    }
`;
const fragmentParticleShader = `
    uniform sampler2D pointTexture;
    uniform float u_time;

    varying vec3 vColor;

    void main() {

        gl_FragColor = vec4( vColor, 1.0 );
        gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );

    }
`;
const particleMaterial = new THREE.ShaderMaterial({
    uniforms: particleUniform,
    vertexShader: vertexParticleShader,
    fragmentShader: fragmentParticleShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
});
// PARTICLES ---
const particleGeometry = new THREE.BufferGeometry;
const radius = 5;
const particleCount = 40;
const positions = [];
const colors = [];
const color = new THREE.Color();
const sizes = [];
const posArray = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
    positions.push((Math.random() * 2 - 1) * radius);
    positions.push((Math.random() * 2 - 1) * radius);
    positions.push((Math.random() * 2 - 1) * radius);
    color.setHSL(i / particleCount, 0.08, 0.03);
    colors.push(color.r, color.g, color.b);
    sizes.push(2);
}
particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);
const render = () => {
    const elapsedTime = clock.elapsedTime * 0.5;
    particleSystem.rotation.z = 0.01 * elapsedTime;
    const sizes = particleGeometry.attributes.size.array;
    for (let i = 0; i < particleCount; i++) {
        sizes[i] = 0.5 * (10.0 + Math.sin(0.8 * i + elapsedTime));
    }
    particleGeometry.attributes.size.needsUpdate = true;
};
