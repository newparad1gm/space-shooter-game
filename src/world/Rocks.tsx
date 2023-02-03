import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { Rock as RockType } from '../Types';
import { World } from './World';

interface RocksProps {
    world: World
}

export const Rocks = (props: RocksProps): JSX.Element => {
    const { world } = props;
    const rockModel = useGLTF('/gltf/rock.gltf');
    const rockGroup = useRef<THREE.Group>(null);
    const rockGeometry = useMemo(() => {
        const nodeMaterial = rockModel.nodes.node_id4_Material_52_0 as THREE.Mesh;
        return nodeMaterial.geometry;
    }, []);

    useEffect(() => {
        if (rockGroup.current) {
            world.rockGroup = rockGroup.current;
        }
    }, [rockGroup]);

    return (
        <group ref={rockGroup}>
            { world.rocks.map(rock => <Rock key={rock.guid} rock={rock} geometry={rockGeometry} material={rockModel.materials.Material_52} meshIdToRockId={world.meshIdToRockId} />) }
        </group>
    );
}

const randomScale = () => {
    return (Math.random() + 0.5) * 10
}

interface RockProps {
    rock: RockType;
    geometry: THREE.BufferGeometry;
    material: THREE.Material; 
    meshIdToRockId: Map<string, string>;
}

export const Rock = (props: RockProps): JSX.Element => {
    const { rock, geometry, material, meshIdToRockId } = props;
    const mesh = useRef<THREE.Mesh>(null);
    const scale = useMemo(() => new THREE.Vector3(randomScale(), randomScale(), randomScale()), []);
    const textMaterial = useMemo(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.font = '50px Georgia';
            ctx.fillStyle = '#ff0000';
            ctx.fillText(JSON.stringify(rock.data.activity.name), 0, 50);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;
            const material = new THREE.SpriteMaterial({ map: texture });
            material.depthWrite = false;
            return material;
        }
    }, [rock]);

    useEffect(() => {
        if (mesh.current) {
            rock.mesh = mesh.current;
            meshIdToRockId.set(mesh.current.uuid, rock.guid);
        }
    }, [mesh]);
  
    return (
        <group position={rock.position}>
            <sprite position={[0, (scale.y / 2) + 2, 0]} material={textMaterial} scale={[5, 3, 1]}/>
            <mesh ref={mesh} geometry={geometry} material={material} material-roughness={1} material-metalness={0.5} layers={1} scale={scale} />
        </group>
    )
  }