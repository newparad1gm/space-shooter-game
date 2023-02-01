/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.0.9 collision-world.glb
*/

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { World } from './World';
import { Explosions } from './Explosions';

interface WorldProps {
    world: World;
	startGame: () => void;
	divRef: React.RefObject<HTMLDivElement>;
}

export const SpaceWorld = (props: WorldProps): JSX.Element => {
	const { world, startGame, divRef } = props;
	const sceneRef = useRef<THREE.Scene>(null);
    const count = 2000;
    
    const positions = useMemo(() => {
        let positions = []
        for (let i = 0; i < count; i++) {
            const r = 4000
            const theta = 2 * Math.PI * Math.random()
            const phi = Math.acos(2 * Math.random() - 1)
            const x = r * Math.cos(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
            const y = r * Math.sin(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
            const z = r * Math.cos(phi) + (-1000 + Math.random() * 2000)
            positions.push(x)
            positions.push(y)
            positions.push(z)
        }
        return new Float32Array(positions)
    }, [count]);

    useEffect(() => {
		if (sceneRef.current && divRef.current) {
			const object = world.addScreen(divRef.current);
			if (object) {
				sceneRef.current.add(object);
			}

			world.worldScene = sceneRef.current;
			world.octree.fromGraphNode(sceneRef.current);

			startGame();
		}
    }, [world, divRef, sceneRef, startGame]);

	return (
		<group {...props} dispose={null}>
			<scene ref={sceneRef}>
                <fog attach="fog" args={['#070710', 100, 700]} />
                <ambientLight intensity={0.25} />
                <mesh>
                    <sphereGeometry args={[5, 32, 32]} />
                    <meshBasicMaterial color="#FFFF99" fog={false} />
                </mesh>
                <points>      
                    <bufferGeometry attach="geometry">
                        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial size={15} sizeAttenuation color="white" fog={false} />
                </points>
                <Explosions explosions={world.explosions} />
			</scene>
		</group>
	)
}