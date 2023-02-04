import React, { useCallback, useEffect, useRef, useState } from 'react';
import { WorldName } from '../world/WorldLoader';
import { Utils } from '../Utils';
import { Engine } from '../game/Engine';
import { Rock } from '../Types';

interface HudProps {
    engine: Engine;
    gameStarted: boolean;
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    timeoutRef: React.RefObject<HTMLInputElement>;
}

export const Hud = (props: HudProps): JSX.Element => {
    const { engine, gameStarted, worldName, setWorldName, timeoutRef } = props;
    [ engine.world.currentRock, engine.world.setCurrentRock ] = useState<Rock>();
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        if (preRef.current) {
            preRef.current.innerHTML = engine.world.currentRock ? JSON.stringify(engine.world.currentRock.data, undefined, 2) : '';
        }
    }, [preRef, engine.world.currentRock])

    return (
        <div id = 'hud'>
            { !gameStarted && <GameStartOptions worldName={worldName} setWorldName={setWorldName} engine={engine} timeoutRef={timeoutRef} /> }
            <div id='rockData' >
                <pre ref={preRef}/>
            </div>
        </div>
    )
}

interface GameStartOptionsProps {
    worldName: WorldName;
    setWorldName: React.Dispatch<React.SetStateAction<WorldName>>;
    engine: Engine;
    timeoutRef: React.RefObject<HTMLInputElement>;
}

export const GameStartOptions = (props: GameStartOptionsProps): JSX.Element => {
    const { worldName, setWorldName, engine, timeoutRef } = props;
    const webSocketUrl = useRef<HTMLInputElement>(null);

    const startGame = useCallback(() => {
        if (webSocketUrl.current && webSocketUrl.current.value) {
            engine.setClient && engine.setClient(new WebSocket(webSocketUrl.current.value));
        }
    }, [webSocketUrl, engine]);

    return (
        <div>
            Select World<br/>
            <select value={worldName} onChange={e => setWorldName(WorldName[e.target.value as keyof typeof WorldName])}>
                { Utils.getEnumKeys(WorldName).map((key, i) => (
                    <option key={i} value={WorldName[key]}>
                        {key}
                    </option>
                )) }
            </select>
            <div>WebSocket: <input type='text' ref={webSocketUrl} defaultValue={process.env.REACT_APP_WEBSOCKET_CONNECTION || window.location.origin.replace(/^http/, 'ws')} /></div>
            <div>Timeout (in seconds): <input type='number' min='5' max='60' ref={timeoutRef} defaultValue={20} /></div>
            <button onClick={startGame}>
                Click to start
            </button>
        </div>
    )
}