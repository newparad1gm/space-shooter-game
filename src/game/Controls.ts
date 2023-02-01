import * as THREE from 'three';
import { Player } from './Player';

export class Controls {
    mouseTime = 0;

    protected keyStates: Set<string> = new Set();
    protected camera: THREE.PerspectiveCamera;
    protected player: Player;

    mouseHelper: THREE.Mesh;

    constructor(camera: THREE.PerspectiveCamera, player: Player) {
        this.camera = camera;
        this.camera.rotation.order = 'YXZ';
        this.player = player;

        this.mouseHelper = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 10 ), new THREE.MeshNormalMaterial() );
        this.mouseHelper.visible = false;
    }

    protected getForwardVector = (): THREE.Vector3 => {
        this.camera.getWorldDirection(this.player.direction);
        this.player.direction.normalize();

        return this.player.direction;
    }

    protected getSideVector = (): THREE.Vector3 => {
        this.camera.getWorldDirection(this.player.direction);
        this.player.direction.y = 0;
        this.player.direction.normalize();
        this.player.direction.cross(this.camera.up);

        return this.player.direction;
    }

    addControls = (document: Document, shootCallback: () => void) => {
        document.addEventListener('keydown', event => {
            this.keyStates.add(event.code);
        });
        document.addEventListener('keyup', event => {
            this.keyStates.delete(event.code);
        });
        document.addEventListener('mouseup', () => {
            if (document.pointerLockElement !== null) {
                shootCallback();
            }
        });
        document.body.addEventListener('mousemove', event => {
            if (document.pointerLockElement === document.body) {
                this.camera.rotation.y -= event.movementX / 500;
                const verticalLook = this.camera.rotation.x - (event.movementY / 500);
                if (verticalLook < 1.5 && verticalLook > -1.5) {
                    this.camera.rotation.x = verticalLook;
                }
            }
        });
    }

    controls = (deltaTime: number) => {
        // gives a bit of air control
        const speedDelta = deltaTime * (this.player.onFloor ? 25 : 8);

        if (this.keyStates.has('KeyW')) {
            this.player.velocity.add(this.getForwardVector().multiplyScalar(speedDelta));
        }
        if (this.keyStates.has('KeyS')) {
            this.player.velocity.add(this.getForwardVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates.has('KeyA')) {
            this.player.velocity.add(this.getSideVector().multiplyScalar(-speedDelta));
        }
        if (this.keyStates.has('KeyD')) {
            this.player.velocity.add(this.getSideVector().multiplyScalar(speedDelta));
        }
        if (this.player.onFloor) {
            if (this.keyStates.has('Space')) {
                this.player.velocity.y = 15;
            }
        }
    }
}