import React from 'react';
import * as THREE from 'three';
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { Octree } from "three/examples/jsm/math/Octree";
import { CSSPlane } from '../game/CSSPlane';
import { Explosion, Rock, JsonResponse } from '../Types';

export class World {
    GRAVITY: number = 0;

    octree: Octree;
    helper: OctreeHelper;
    cssPlanes: CSSPlane[];
    
    scene?: THREE.Scene;
    cssScene: THREE.Scene;
    worldScene: THREE.Scene;

    screenDimensions: THREE.Vector2;
    screenPos: THREE.Vector3;

    explosions: Explosion[];
    setExplosions?: React.Dispatch<React.SetStateAction<Explosion[]>>;
    explosionTimeout: NodeJS.Timeout | undefined;

    meshIdToRockId: Map<string, string>;
    idToRock: Map<string, Rock>;
    rocks: Rock[];
    setRocks?: React.Dispatch<React.SetStateAction<Rock[]>>;
    rockGroup: THREE.Group;
    firstRock?: Rock;
    rockCount: number = 0;

    currentRock?: Rock;
    setCurrentRock?: React.Dispatch<React.SetStateAction<Rock | undefined>>;

    cameraObjects: THREE.Object3D;

    constructor() {
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
        this.cssPlanes = [];
        this.cssScene = new THREE.Scene();
        this.worldScene = new THREE.Scene();
        this.screenDimensions = new THREE.Vector2();
        this.screenPos = new THREE.Vector3();
        this.explosions = [];
        this.rocks = [];
        this.meshIdToRockId = new Map();
        this.idToRock = new Map();
        this.rockGroup = new THREE.Group();
        this.cameraObjects = new THREE.Object3D();
    }

    renderCSSPlanes = () => {
        if (this.scene) {
            for (const plane of this.cssPlanes) {
                plane.renderObject(this.scene);
            }
        }
    }

	addScreen = (div: HTMLDivElement): THREE.Object3D<THREE.Event> | undefined => {
        const cssPlane = new CSSPlane(
            this.screenPos,
            new THREE.Euler(0, -(Math.PI / 2), 0),
            new THREE.Vector2(this.screenDimensions.x * 64, this.screenDimensions.y * 64),
            this.screenDimensions
        );
        this.cssScene.add(cssPlane.createCSSObject(div));
        
        this.cssPlanes.push(cssPlane);
        return cssPlane.createObject();
	}

    startScene = () => {
        if (!this.scene) {
            return;
        }
    }

    shootRay = (raycaster: THREE.Raycaster) => {
        const intersects: THREE.Intersection<THREE.Object3D<THREE.Event>>[] = [];
        raycaster.layers.set(1);
        raycaster.intersectObject(this.rockGroup, true, intersects);
        this.setCurrentRock && this.setCurrentRock(undefined);
        if (intersects.length) {
            const intersection = intersects[0];
            const object = intersection.object;

            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    const rockId = this.meshIdToRockId.get(child.uuid);
                    if (rockId && this.idToRock.has(rockId)) {
                        this.setCurrentRock && this.setCurrentRock(this.idToRock.get(rockId));
                    }
                }
            });
        }
    }

    destroyRock = (rockId: string) => {
        if (this.idToRock.has(rockId)) {
            const rock = this.idToRock.get(rockId)!;
            rock.mesh && this.addExplosion(rock.position, rock.mesh);
            this.setRocks && this.setRocks(this.rocks.filter(r => r.guid !== rock.guid));
            this.idToRock.delete(rock.guid);
            rock.mesh && this.meshIdToRockId.delete(rock.mesh.uuid);
            this.setCurrentRock && this.setCurrentRock(undefined);
        }
    }

    addExplosion = (position: THREE.Vector3, object: THREE.Object3D) => {
        if (this.setExplosions) {
            const now = Date.now();
            this.setExplosions([...this.explosions, { guid: object.id, position: position, scale: 1, time: now }]);
            clearTimeout(this.explosionTimeout);
            this.explosionTimeout = setTimeout(() => this.setExplosions!(this.explosions.filter(({ time }) => Date.now() - time <= 1000)), 1000);
        }
    }

    addRock = (rockData: JsonResponse) => {
        let zPos = 25 + this.rockCount * 10;
        /*if (this.firstRock) {
            zPos += (rockData.time - this.firstRock.data.time) / 1000;
        }*/
        const rock: Rock = {
            guid: rockData.id,
            position: new THREE.Vector3((-1 + Math.random() * 2) * 20, (-1 + Math.random() * 2) * 20, zPos),
            data: rockData
        }
        if (!this.firstRock) {
            this.firstRock = rock;
        }
        this.idToRock.set(rock.guid, rock);
        this.setRocks && this.setRocks([...this.rocks, rock]);
        this.rockCount += 1;
    }
}