import { createComponent, mergeProps } from "solid-js/web";
import { c as createRaycaster, S as Scene, d as ColliderProvider, C as Camera, f as fly, A as AxisAlignedBoxCollider, a as Cube } from "./index-ac642af0.js";
import { createEffect, For, createSignal } from "solid-js";
import "gl-matrix";
import "./get-6158dfbd.js";
import "node:crypto";
import "@solid-primitives/scheduled";
import "solid-js/store";
const SIZE = 50;
const randomVector3 = () => [Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2, Math.random() * SIZE - SIZE / 2];
const HitBox = (props) => {
  const [hit, setHit] = createSignal(false);
  const color = [Math.random(), Math.random(), Math.random()];
  return createComponent(AxisAlignedBoxCollider, mergeProps(props, {
    onEvent: ({
      hit: hit2
    }) => setHit(hit2),
    get children() {
      return createComponent(Cube, {
        get color() {
          return hit() ? [1, 1, 1] : color;
        }
      });
    }
  }));
};
function _16_raycast() {
  const raycaster = createRaycaster();
  createEffect(raycaster.castCursor);
  return createComponent(Scene, {
    background: [1, 0, 0, 1],
    get children() {
      return createComponent(ColliderProvider, {
        plugins: [raycaster],
        get children() {
          return [createComponent(For, {
            get each() {
              return Array.from({
                length: 1e3
              }).map(randomVector3);
            },
            children: (position) => createComponent(HitBox, {
              position
            })
          }), createComponent(Camera, mergeProps({
            active: true,
            fov: 33
          }, fly))];
        }
      });
    }
  });
}
export {
  _16_raycast as default
};
