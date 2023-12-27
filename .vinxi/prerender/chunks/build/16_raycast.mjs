import { createComponent, mergeProps } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { c as createRaycaster, S as Scene, d as ColliderProvider, C as Camera, f as fly, A as AxisAlignedBoxCollider, a as Cube } from './index-ac642af0.mjs';
import { createEffect, For, createSignal } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';

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

export { _16_raycast as default };
//# sourceMappingURL=16_raycast.mjs.map
