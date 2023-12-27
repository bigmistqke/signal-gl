import { ssr, ssrHydrationKey, ssrAttribute, escape, createComponent, ssrElement, mergeProps as mergeProps$1 } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/web/dist/server.js';
import { For, mergeProps, splitProps, createMemo } from 'file:///Users/bigmistqke/Documents/GitHub/signal-gl/node_modules/.pnpm/solid-js@1.8.7/node_modules/solid-js/dist/server.js';
import { u as useResolvedPath, a as useHref, b as useLocation, n as normalizePath } from './routing-c0f8b6f3.mjs';

function A(props) {
  props = mergeProps({
    inactiveClass: "inactive",
    activeClass: "active"
  }, props);
  const [, rest] = splitProps(props, ["href", "state", "class", "activeClass", "inactiveClass", "end"]);
  const to = useResolvedPath(() => props.href);
  const href = useHref(to);
  const location = useLocation();
  const isActive = createMemo(() => {
    const to_ = to();
    if (to_ === void 0)
      return false;
    const path = normalizePath(to_.split(/[?#]/, 1)[0]).toLowerCase();
    const loc = normalizePath(location.pathname).toLowerCase();
    return props.end ? path === loc : loc.startsWith(path);
  });
  return ssrElement("a", mergeProps$1(rest, {
    get href() {
      return href() || props.href;
    },
    get state() {
      return JSON.stringify(props.state);
    },
    get classList() {
      return {
        ...props.class && {
          [props.class]: true
        },
        [props.inactiveClass]: !isActive(),
        [props.activeClass]: isActive(),
        ...rest.classList
      };
    },
    link: true,
    get ["aria-current"]() {
      return isActive() ? "page" : void 0;
    }
  }), void 0, true);
}
const page = "_page_6tps2_1";
const list = "_list_6tps2_7";
const styles = {
  page,
  list
};
const _tmpl$ = ["<div", "><ul>", "</ul><!--$-->", "<!--/--></div>"], _tmpl$2 = ["<li", ">", "</li>"];
function examples(props) {
  const examples2 = Object.keys(/* @__PURE__ */ Object.assign({ "./examples/00_hello_world.tsx": () => import('./00_hello_world-b9125ba3.mjs'), "./examples/01_scope_and_modules.tsx": () => import('./01_scope_and_modules-c7520ae1.mjs'), "./examples/02_multiple_shaders.tsx": () => import('./02_multiple_shaders-14281337.mjs'), "./examples/03_caching_shaders.tsx": () => import('./03_caching_shaders-f9fe47a5.mjs'), "./examples/04_vanilla.tsx": () => import('./04_vanilla-515e9c92.mjs'), "./examples/05_shared_uniforms.tsx": () => import('./05_shared_uniforms-1f08b893.mjs'), "./examples/06_game_of_life.tsx": () => import('./06_game_of_life-1aa3b827.mjs'), "./examples/08_cube.tsx": () => import('./08_cube-51881a7c.mjs'), "./examples/09_cube_with_indices.tsx": () => import('./09_cube_with_indices-014292e3.mjs'), "./examples/10_classes.tsx": () => import('./10_classes-4966f7d0.mjs'), "./examples/11_render_texture.tsx": () => import('./11_render_texture-b3ee4858.mjs'), "./examples/12_tetris.tsx": () => import('./12_tetris-b7c98996.mjs'), "./examples/13_teapot_obj.tsx": () => import('./13_teapot_obj-77b99518.mjs'), "./examples/14_controls_orbit.tsx": () => import('./14_controls_orbit-4d994048.mjs'), "./examples/15_controls_fly.tsx": () => import('./15_controls_fly-a52285cb.mjs'), "./examples/16_raycast.tsx": () => import('./16_raycast-29566a89.mjs'), "./examples/17_raycast_explosion.tsx": () => import('./17_raycast_explosion-d7481fb0.mjs'), "./examples/index.tsx": () => import('./index-4a36294d.mjs') })).filter((v) => !v.includes("index")).map((v) => v.replace("./", "")).sort((a, b) => a < b ? -1 : 1).map((v) => v.split(".").slice(0, -1).join("").split("/").slice(1).join("/"));
  console.log("examples", examples2);
  return ssr(_tmpl$, ssrHydrationKey() + ssrAttribute("class", escape(styles.page, true), false), escape(createComponent(For, {
    each: examples2,
    children: (example) => ssr(_tmpl$2, ssrHydrationKey() + ssrAttribute("class", escape(styles.list, true), false), escape(createComponent(A, {
      href: `./${example}`,
      get children() {
        return example.split("_").slice(1).join(" ");
      }
    })))
  })), escape(props.children));
}

export { examples as default };
//# sourceMappingURL=examples.mjs.map
