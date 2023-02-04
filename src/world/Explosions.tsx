import React, { createRef, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Explosion as ExplosionType } from '../Types';

interface ExplosionsProps {
    explosions: ExplosionType[];
}

export const Explosions = (props: ExplosionsProps): JSX.Element => {
    const { explosions } = props;
    return (
        <scene>
            { explosions.map(({ guid, position, scale }) => <Explosion key={guid} position={position} scale={scale * 0.75} />) }
        </scene>
    );
}

const randomVector = () => {
    return -1 + Math.random() * 2;
}

const make = (color: string, speed: number) => {
    return {
        ref: createRef(),
        color,
        data: new Array(20)
            .fill(undefined)
            .map(() => [
                new THREE.Vector3(),
                new THREE.Vector3(randomVector(), randomVector(), randomVector()).normalize().multiplyScalar(speed * 0.75)
            ])
    }
}

interface ExplosionProps {
    position: any;
    scale: number;
}

export const Explosion = (props: ExplosionProps): JSX.Element => {
    const { position, scale } = props;
    const group = useRef<THREE.Group>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => [make('white', 0.8), make('orange', 0.6)], []);

    useFrame(() => {
        particles.forEach(({ data }, type) => {
            if (group.current) {
                const mesh = group.current.children[type];
                if (mesh instanceof THREE.InstancedMesh) {
                    data.forEach(([vec, normal], i) => {
                        vec.add(normal);
                        dummy.position.copy(vec);
                        dummy.updateMatrix();
                        mesh.setMatrixAt(i, dummy.matrix);
                    })
                    mesh.material.opacity -= mesh.material.opacity > 0 ? 0.025 : 0;
                    mesh.instanceMatrix.needsUpdate = true;
                }
            }
        });
    });
  
    return (
        <group ref={group} position={position} scale={[scale, scale, scale]}>
            {particles.map(({ color, data }, index) => (
                <instancedMesh key={index} args={[undefined, undefined, data.length]} frustumCulled={false}>
                    <dodecahedronGeometry args={[10, 0]} />
                    <meshBasicMaterial color={color} transparent opacity={1} fog={false} toneMapped={false} />
                </instancedMesh>
            ))}
        </group>
    )
  }