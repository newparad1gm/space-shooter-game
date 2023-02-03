import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three';
import { GUI } from 'lil-gui';
import { Player } from './game/Player';
import { Engine } from './game/Engine';
import { WorldLoader, WorldName } from './world/WorldLoader';
import { Hud } from './options/GameOptions';
import './Game.css';


export const Game = (): JSX.Element => {
    const player = useMemo(() => new Player('single', 'Your Name', 'Soldier.glb'), []);
    const engine = useMemo(() => new Engine(player), [player]);
    [ engine.client, engine.setClient ] = useState<WebSocket>();
    const [ gameStarted, setGameStarted ] = useState<boolean>(false);
    const [ worldName, setWorldName ] = useState<WorldName>(WorldName.Space);
    const glRef = useRef<HTMLDivElement>(null);
    const cssRef = useRef<HTMLDivElement>(null);
    const divRef = useRef<HTMLDivElement>(null);
    
    const initContainer = () => {
        if (glRef.current && engine.controls) {
            const container = glRef.current;
            container.appendChild(engine.stats.domElement);

            engine.controls.addControls(document, engine.shoot);
            container.addEventListener('mousedown', () => {
                document.body.requestPointerLock();
                if (engine.controls) {
                    engine.controls.mouseTime = performance.now();
                }
            });
        }
    }

    useEffect(() => {
        if (engine.client) {
            const client = engine.client;
            
            client.onopen = () => {
                setGameStarted(true);
                console.log('Connected');
            };

            client.onmessage = (message) => {
                let messageData;
                try {
                    messageData = JSON.parse(message.data as string);
                } catch (e) {
                    messageData = JSON.parse(JSON.stringify(message.data));
                }
                if (messageData.new) {
                    engine.world.addRock(messageData.new);
                } else if (messageData.started) {
                    engine.world.destroyRock(messageData.started.id);
                }
            };
        }
    }, [engine.client])

    const startGame = () => {
        const gui = new GUI({ width: 200 });
        gui.add({ debug: false }, 'debug')
            .onChange((value: boolean) => {
                engine.world.helper.visible = value;
            });

        engine.startGame();
        initContainer();

        const onWindowResize = () => {
            if (engine.camera && engine.renderer) {
                const camera = engine.camera;

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
    
                engine.setupRenderer();
                engine.setupCSSRenderer();
            }
        };
        window.addEventListener('resize', onWindowResize);
    }

    useEffect(() => {
        if (cssRef.current) {
            const renderer = engine.startCSSRenderer();
            engine.setupCSSRenderer();
            cssRef.current.appendChild(renderer.domElement);
        }
    }, [cssRef, engine]);

    return (
        <div style={{width: '100%'}}>
            { gameStarted && <div id='css' ref={cssRef} /> }
            { gameStarted && <div id='webgl' ref={glRef}>
                <Canvas linear
                    gl={{ antialias: false }}
                    camera={{ position: [0, 0, 2000], near: 0.01, far: 10000, fov: 70 }}
                    onCreated={({gl, scene, camera}) => {
                        engine.camera = camera as THREE.PerspectiveCamera;
                        engine.renderer = gl;
                        engine.world.scene = scene;
                        engine.camera.layers.enable(1);
                        engine.world.scene.add(engine.camera);
                }}>
                    <WorldLoader engine={engine} worldName={worldName} divRef={divRef} startGame={startGame}/>
                    <EffectComposer>
                        <Bloom luminanceThreshold={1} luminanceSmoothing={0.9} height={300} />
                    </EffectComposer>
                </Canvas>
            </div> }
            <Hud worldName={worldName} setWorldName={setWorldName} engine={engine} gameStarted={gameStarted}/>
            <div id='screen' ref={divRef}/>
        </div>
    )
}