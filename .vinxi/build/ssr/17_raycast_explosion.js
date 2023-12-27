import { createComponent, mergeProps } from "solid-js/web";
import { c as createRaycaster, S as Scene, d as ColliderProvider, C as Camera, f as fly, G as Group, A as AxisAlignedBoxCollider, a as Cube } from "./assets/index-ac642af0.js";
import { createEffect, For, createSignal, Show } from "solid-js";
import { createScheduled, throttle } from "@solid-primitives/scheduled";
import "gl-matrix";
import "./assets/get-6158dfbd.js";
import "node:crypto";
import "solid-js/store";
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
export {
  _17_raycast_explosion as default
};
