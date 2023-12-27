import { vec3, mat4 } from 'gl-matrix';
import * as solid_js from 'solid-js';
import { ParentComponent, Component, ComponentProps, ParentProps } from 'solid-js';
import { v as RenderMode, o as uniform, l as SignalGLContext, m as Canvas, S as ShaderToken, $ as Vector3$1 } from '../tokens-9AvW-2wz.js';

type Vector3 = [number, number, number];
type Pose = {
    position?: Vector3 | vec3;
    rotation?: Vector3 | vec3;
    scale?: Vector3 | vec3;
    matrix?: mat4;
};

type ColliderPlugin = ReturnType<typeof createRaycaster>;
declare const ColliderProvider: ParentComponent<{
    plugins: ColliderPlugin[];
}>;
declare const createRaycaster: () => {
    initialize(): void;
    cast: (origin: vec3, direction: vec3) => void;
    castCenter(): void;
    castCursor(): undefined;
};
declare const AxisAlignedBoxCollider: ParentComponent<Partial<{
    scale: Vector3 | vec3;
    position: Vector3 | vec3;
    color: Vector3 | vec3;
    onEvent: (event: {
        type: string;
        hit: boolean;
    }) => void;
    mode: RenderMode;
}>>;

type Spaces = {
    projection: {
        uniform: ReturnType<typeof uniform.mat4>;
        matrix: mat4;
        invertedMatrix: mat4;
    };
    view: {
        uniform: ReturnType<typeof uniform.mat4>;
        matrix: mat4;
        invertedMatrix: mat4;
    };
    model: {
        uniform: ReturnType<typeof uniform.mat4>;
        matrix: mat4;
    };
};
declare const useScene: () => (Spaces & SignalGLContext & {
    setView: (view: mat4) => void;
    setProjection: (view: mat4) => void;
}) | undefined;
declare const Scene: Component<ComponentProps<typeof Canvas>>;
/**
 * GROUP
 */
declare const Group: Component<ParentProps<Pose>>;
/**
 * SHAPE
 */
type ShapeProps = Pose & {
    /** in vec4 position */
    fragment?: ShaderToken;
    vertex?: ShaderToken;
    indices: number[];
    color?: Vector3$1 | vec3;
    opacity: number;
    vertices: Float32Array;
    mode: RenderMode;
};
declare const Shape: Component<ParentProps<ShapeProps>>;
/**
 * CUBE
 */
declare const Cube: Component<ParentProps<Partial<ShapeProps>>>;
type CameraProps = Partial<Pose & {
    active: boolean;
    fov: number;
    near: number;
    far: number;
    realMatrix: mat4;
}>;
declare const Camera: Component<CameraProps>;

declare const orbit: (_config?: {
    near?: number;
    far?: number;
    target?: Vector3$1;
    up?: Vector3$1;
}) => {
    readonly realMatrix: mat4;
};
declare const fly: () => {
    readonly matrix: mat4;
};

declare const loadOBJ: (url: string) => solid_js.Accessor<{
    vertices: Float32Array;
    indices: any[];
} | undefined>;

declare const directionFromCursor: ({ cursor, projection, view, }: {
    cursor: [number, number];
    projection: mat4;
    view: mat4;
}) => vec3;

export { AxisAlignedBoxCollider, Camera, type CameraProps, ColliderProvider, Cube, Group, type Pose, Scene, Shape, type Spaces, type Vector3, createRaycaster, directionFromCursor, fly, loadOBJ, orbit, useScene };
