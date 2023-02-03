import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer';
import { Player } from './Player';
import { Vectors, SimplePlayer, Shot } from '../Types';
import { Controls } from './Controls';
import { Utils } from '../Utils';
import { World } from '../world/World';

export class Engine {
    STEPS_PER_FRAME: number = 5;

    protected clock: THREE.Clock;

    renderer?: THREE.WebGLRenderer;
    cssRenderer?: CSS3DRenderer;
    camera?: THREE.PerspectiveCamera;
    controls?: Controls;
    raycaster: THREE.Raycaster;
    
    player: Player;
    players: Map<string, Player>;
    stats: Stats;
    world: World;

    textureLoader: THREE.TextureLoader;
    animating: boolean = false;

    client?: WebSocket;
    setClient?: React.Dispatch<React.SetStateAction<WebSocket | undefined>>

    protected vectors: Vectors = { 
        vector1: new THREE.Vector3(), 
        vector2: new THREE.Vector3(), 
        vector3: new THREE.Vector3() 
    };

    constructor(player: Player) {
        this.clock = new THREE.Clock();
        this.stats = this.startStats();

        this.player = player;
        this.world = new World();

        this.raycaster = new THREE.Raycaster();

        this.textureLoader = new THREE.TextureLoader();

        // network players
        this.players = new Map();
    }

    createControls = () => {
        if (this.camera) {
            this.controls = new Controls(this.camera, this.player);
        }
    }

    protected startStats = (): Stats => {
        const stats: Stats = new (Stats as any)();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        return stats;
    }

    protected teleportPlayerIfOob = () => {
        if (this.camera && this.player && this.camera.position.y <= - 25) {
            this.player.initializeCollider();
            this.camera.position.copy(this.player.collider.end);
            this.camera.rotation.set(0, 0, 0);
        }
    }

    protected playerCollisions = (player: Player) => {
        const result = this.world.octree.capsuleIntersect(player.collider);
        player.onFloor = false;
        if (result) {
            player.onFloor = result.normal.y > 0;
            if (!player.onFloor) {
                player.velocity.addScaledVector(result.normal, -result.normal.dot(player.velocity));
            }
            player.collider.translate(result.normal.multiplyScalar(result.depth));
        }
    }

    /*protected playerSphereCollision = (player: Player, sphere: Model, vectors: Vectors) => {
        const center = vectors.vector1.addVectors(player.collider.start, player.collider.end).multiplyScalar(0.5);
        const sphere_center = sphere.collider.center;
        const r = player.collider.radius + sphere.collider.radius;
        const r2 = r * r;

        // approximation: player = 3 spheres
        for (const point of [player.collider.start, player.collider.end, center]) {
            const d2 = point.distanceToSquared(sphere_center);
            if (d2 < r2) {
                const normal = vectors.vector1.subVectors(point, sphere_center).normalize();
                const v1 = vectors.vector2.copy(normal).multiplyScalar(normal.dot(player.velocity));
                const v2 = vectors.vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

                player.velocity.add(v2).sub(v1);
                sphere.velocity.add(v1).sub(v2);

                const d = (r - Math.sqrt(d2)) / 2;
                sphere_center.addScaledVector(normal, -d);
            }
        }
    }*/

    setupRenderer = () => {
        if (this.renderer) {
            const renderer = this.renderer;
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.top = '0';
            renderer.domElement.style.margin = '0';
            renderer.domElement.style.padding = '0';
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.VSMShadowMap;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
			renderer.toneMappingExposure = 1;
            renderer.domElement.style.zIndex = '1';
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(new THREE.Color('#020209'));
            THREE.ColorManagement.legacyMode = false;
        }
    }

    startCSSRenderer = () =>{
        const cssRenderer = new CSS3DRenderer();
        this.cssRenderer = cssRenderer;
        return cssRenderer;
    }

    setupCSSRenderer = () => {
        if (this.cssRenderer) {
            const cssRenderer = this.cssRenderer;
            cssRenderer.domElement.style.position = 'absolute';
            cssRenderer.domElement.style.top = '0';
            cssRenderer.domElement.style.margin	= '0';
            cssRenderer.domElement.style.padding = '0';
            cssRenderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    startGame = () => {
        this.setupRenderer();

        if (this.world.scene && this.camera) {
            this.createControls();
            //this.world.createSpheres();
            //this.scene.add(this.controls!.mouseHelper);
            this.world.startScene();
            this.animate();
        }
    }

    setRay = () => {
        if (this.camera) {
            const cameraPos = new THREE.Vector3();
            const cameraDir = new THREE.Vector3();
            this.raycaster.set(this.camera.getWorldPosition(cameraPos), this.camera.getWorldDirection(cameraDir));
            this.world.shootRay(this.raycaster);
        }
    }

    protected animate = () => {
        if (!this.controls || !this.camera || !this.renderer || !this.world.scene) {
            return;
        }

        const deltaTime = Math.min(0.05, this.clock.getDelta()) / this.STEPS_PER_FRAME;

        // we look for collisions in substeps to mitigate the risk of
        // an object traversing another too quickly for detection.
        for (let i = 0; i < this.STEPS_PER_FRAME; i++) {
            this.controls.controls(deltaTime);
            this.player.orientation.y = this.camera.rotation.y;
            this.player.updatePlayer(deltaTime, this.world.GRAVITY);
            this.playerCollisions(this.player);
            this.updatePlayers(deltaTime);
            this.camera.position.copy(this.player.collider.end);
            this.setRay();
            //this.teleportPlayerIfOob();
        }

        if (!this.animating) {
            this.camera?.lookAt(0, 0, 100);
        }

        if (this.cssRenderer) {
            this.cssRenderer.render(this.world.cssScene, this.camera);
            this.world.renderCSSPlanes();
        }

        this.stats.update();
        this.animating = true;
        requestAnimationFrame(this.animate);
    }

    updatePlayers = (deltaTime: number) => {
        for (let player of Array.from(this.players.values())) {
            player.updatePlayer(deltaTime, 0);
        }
    }

    shots: Shot[] = [];

    shoot = () => {
        if (this.client && this.world.currentRock) {
            this.client.send(JSON.stringify({
                id: this.world.currentRock.guid
            }));
        }
    }

    createStateMessage = (): SimplePlayer | undefined => {
        const shots: Shot[] = [];
        while (this.shots.length) {
            shots.push(this.shots.pop()!);
        }
        return {
            playerID: this.player.playerID,
            playerName: this.player.playerName,
            position: Utils.createVectorJSON(this.player.collider.end),
            velocity: Utils.createVectorJSON(this.player.velocity),
            orientation: Utils.createVectorJSON(this.player.orientation),
            direction: Utils.createVectorJSON(this.player.direction),
            shots: shots
        }
    }
}