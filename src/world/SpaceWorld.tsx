import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three';
import { World } from './World';
import { Explosions } from './Explosions';
import { Rocks } from './Rocks';
import { Explosion, Rock } from '../Types';
import { useLoader } from '@react-three/fiber';

interface WorldProps {
    world: World;
	startGame: () => void;
	divRef: React.RefObject<HTMLDivElement>;
}

export const SpaceWorld = (props: WorldProps): JSX.Element => {
	const { world, startGame, divRef } = props;
	const sceneRef = useRef<THREE.Scene>(null);
    [ world.explosions, world.setExplosions ] = useState<Explosion[]>([]);
    [ world.rocks, world.setRocks ] = useState<Rock[]>([]);
    const count = 2000;
    const [ earth, moon ] = useLoader(THREE.TextureLoader, ['/textures/earth.jpg', '/textures/moon.png']);
    const planetsRef = useRef<THREE.Group>(null);
    
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
		if (sceneRef.current && divRef.current && world.setRocks && planetsRef.current) {
			const object = world.addScreen(divRef.current);
			if (object) {
				sceneRef.current.add(object);
			}

			world.worldScene = sceneRef.current;
			world.octree.fromGraphNode(sceneRef.current);
            sceneRef.current.add(world.cameraObjects);
            world.cameraObjects.add(planetsRef.current);

            startGame();
        }
    }, [world, divRef, sceneRef, planetsRef, startGame]);

	return (
		<group {...props} dispose={null}>
			<scene ref={sceneRef}>
                <fog attach="fog" args={['#070710', 100, 700]} />
                <ambientLight intensity={0.25} />
                <points>      
                    <bufferGeometry attach="geometry">
                        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
                    </bufferGeometry>
                    <pointsMaterial size={15} sizeAttenuation color="white" fog={false} />
                </points>
                <Rocks world={world} />
                <Explosions explosions={world.explosions} />
                <group ref={planetsRef} scale={[50, 50, 50]} position={[-500, -400, 1000]}>
                    <mesh>
                        <sphereGeometry args={[5, 32, 32]} />
                        <meshStandardMaterial map={earth} roughness={1} fog={false} />
                    </mesh>
                    <mesh position={[30, 0, -5]}>
                        <sphereGeometry args={[0.8, 32, 32]} />
                        <meshStandardMaterial map={moon} roughness={1} fog={false} />
                    </mesh>
                    <mesh position={[10, 40, 60]}>
                        <sphereGeometry args={[10, 32, 32]} />
                        <meshStandardMaterial emissive='yellow' emissiveIntensity={3} toneMapped={false} />
                        <pointLight distance={6100} intensity={50} color='white' />
                    </mesh>
                </group>
			</scene>
		</group>
	)
}
