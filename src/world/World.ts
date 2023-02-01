import React from 'react';
import * as THREE from 'three';
import { OctreeHelper } from "three/examples/jsm/helpers/OctreeHelper";
import { Octree } from "three/examples/jsm/math/Octree";
import { CSSPlane } from '../game/CSSPlane';
import { Model, Explosion } from '../Types';
import { Utils } from '../Utils';

export class World {
    NUM_SPHERES: number = 100;
    SPHERE_RADIUS: number = 0.2;

    octree: Octree;
    helper: OctreeHelper;
    cssPlanes: CSSPlane[];
    
    scene?: THREE.Scene;
    cssScene: THREE.Scene;
    worldScene: THREE.Scene;

    screenDimensions: THREE.Vector2;
    screenPos: THREE.Vector3;

    splatters: THREE.Mesh[];
    explosions: Explosion[];
    setExplosions?: React.Dispatch<React.SetStateAction<Explosion[]>>;
    explosionTimeout: NodeJS.Timeout | undefined;
    spheres: Model[];
    sphereIdx = 0;

    constructor() {
        this.octree = new Octree();
        this.helper = new OctreeHelper(this.octree, new THREE.Color(0x88ccee));
        this.helper.visible = false;
        this.cssPlanes = [];
        this.spheres = [];
        this.cssScene = new THREE.Scene();
        this.worldScene = new THREE.Scene();
        this.screenDimensions = new THREE.Vector2();
        this.screenPos = new THREE.Vector3();
        this.splatters = [];
        this.explosions = [];
    }

    renderCSSPlanes = () => {
        if (this.scene) {
            for (const plane of this.cssPlanes) {
                plane.renderObject(this.scene);
            }
        }
    }

    createSpheres = () => {
        if (!this.scene) {
            return;
        }

        const sphereGeometry = new THREE.IcosahedronGeometry(this.SPHERE_RADIUS, 5);
        const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xbbbb44 });

        for (let i = 0; i < this.NUM_SPHERES; i++) {
            const sphere = Utils.createModel(sphereGeometry, sphereMaterial);
            this.scene.add(sphere);

            this.spheres.push({
                mesh: sphere,
                collider: new THREE.Sphere(new THREE.Vector3(0, - 100, 0), this.SPHERE_RADIUS),
                velocity: new THREE.Vector3()
            });
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

    addExplosion = (object: THREE.Object3D) => {
        if (this.setExplosions) {
            const now = Date.now();
            this.setExplosions([...this.explosions, { guid: object.id, position: object.position, scale: 2, time: now }]);
            clearTimeout(this.explosionTimeout);
            this.explosionTimeout = setTimeout(() => this.setExplosions!(this.explosions.filter(({ time }) => now - time <= 1000)), 1000);
        }
    }
}