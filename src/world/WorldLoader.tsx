import React, { Suspense, useEffect, useState } from "react"
import { Engine } from "../game/Engine";
import { Crosshair } from "../game/Crosshair";
import { SpaceWorld } from "./SpaceWorld";
import { Explosion } from "../Types";

export enum WorldName {
    Space = 'Space'
}

interface WorldLoaderProps {
    engine: Engine;
    worldName: WorldName;
	divRef: React.RefObject<HTMLDivElement>;
	startGame: () => void;
}

export const WorldLoader = (props: WorldLoaderProps): JSX.Element => {
    const { engine, worldName, divRef, startGame } = props;
    [ engine.world.explosions, engine.world.setExplosions ] = useState<Explosion[]>([]);

    useEffect(() => {

    })

    return (
        <Suspense>
            { worldName === WorldName.Space && <SpaceWorld world={engine.world} startGame={startGame} divRef={divRef}/> }
            <Crosshair engine={engine}/>
        </Suspense>
    )
}