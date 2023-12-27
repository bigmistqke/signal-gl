import { createComponent, mergeProps } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { c as createRaycaster, S as Scene, d as ColliderProvider, C as Camera, f as fly, G as Group, A as AxisAlignedBoxCollider, a as Cube } from './index-ac642af0.mjs';
import { createEffect, For, createSignal, Show } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import { createScheduled, throttle } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/@solid-primitives+scheduled@1.4.1_solid-js@1.8.7/node_modules/@solid-primitives/scheduled/dist/index.js';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/gl-matrix@3.4.3/node_modules/gl-matrix/cjs/index.js';
import './get-6158dfbd.mjs';
import 'node:crypto';
import 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/store/dist/server.js';

const randomVector3 = (size = 50) => [Math.random() * size - size / 2, Math.random() * size - size / 2, Math.random() * size - size / 2];
const Explosion = (props) => {
  const [delta, setDelta] = createSignal(0);
  const pieces = Array.from({
    length: 10
  }).map(() => ({
    start: [0, 0, 0],
    end: randomVector3(5)
  }));
  const tweenPosition = ({
    start,
    end
  }) => start.map((v, i) => v * (1 - delta()) + end[i] * delta());
  const loop = () => {
    if (delta() < 1) {
      requestAnimationFrame(loop);
    }
    setDelta((delta2) => Math.min(1, delta2 + 0.01));
  };
  loop();
  return createComponent(Show, {
    get when() {
      return delta() < 1;
    },
    get children() {
      return createComponent(For, {
        each: pieces,
        children: (piece) => createComponent(Cube, mergeProps({
          get position() {
            return tweenPosition(piece);
          },
          get scale() {
            return [1 - delta(), 1 - delta(), 1 - delta()];
          }
        }, props))
      });
    }
  });
};
const HitBox = (props) => {
  const [hit, setHit] = createSignal(false);
  const color = [Math.random(), Math.random(), Math.random()];
  return createComponent(Group, mergeProps(props, {
    get children() {
      return createComponent(Show, {
        get when() {
          return !hit();
        },
        get fallback() {
          return createComponent(Explosion, {
            color
          });
        },
        get children() {
          return createComponent(AxisAlignedBoxCollider, {
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
          });
        }
      });
    }
  }));
};
function _17_raycast_explosion() {
  const scheduled = createScheduled((fn) => throttle(fn, 1e3 / 30));
  const raycaster = createRaycaster();
  createEffect(() => {
    if (!scheduled())
      return;
    raycaster.castCursor();
  });
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
              }).map(() => randomVector3());
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

export { _17_raycast_explosion as default };
//# sourceMappingURL=17_raycast_explosion.mjs.map
