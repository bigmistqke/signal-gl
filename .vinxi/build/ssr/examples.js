import { ssrElement, mergeProps as mergeProps$1, ssr, ssrHydrationKey, ssrAttribute, escape, createComponent } from "solid-js/web";
import { mergeProps, splitProps, createMemo, For } from "solid-js";
import { u as useResolvedPath, a as useHref, b as useLocation, n as normalizePath } from "./assets/routing-c0f8b6f3.js";
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
  const examples2 = Object.keys(/* @__PURE__ */ Object.assign({ "./examples/00_hello_world.tsx": () => import("./assets/00_hello_world-b9125ba3.js"), "./examples/01_scope_and_modules.tsx": () => import("./assets/01_scope_and_modules-c7520ae1.js"), "./examples/02_multiple_shaders.tsx": () => import("./assets/02_multiple_shaders-14281337.js"), "./examples/03_caching_shaders.tsx": () => import("./assets/03_caching_shaders-f9fe47a5.js"), "./examples/04_vanilla.tsx": () => import("./assets/04_vanilla-515e9c92.js"), "./examples/05_shared_uniforms.tsx": () => import("./assets/05_shared_uniforms-1f08b893.js"), "./examples/06_game_of_life.tsx": () => import("./assets/06_game_of_life-1aa3b827.js"), "./examples/08_cube.tsx": () => import("./assets/08_cube-51881a7c.js"), "./examples/09_cube_with_indices.tsx": () => import("./assets/09_cube_with_indices-014292e3.js"), "./examples/10_classes.tsx": () => import("./assets/10_classes-4966f7d0.js"), "./examples/11_render_texture.tsx": () => import("./assets/11_render_texture-b3ee4858.js"), "./examples/12_tetris.tsx": () => import("./assets/12_tetris-b7c98996.js"), "./examples/13_teapot_obj.tsx": () => import("./assets/13_teapot_obj-77b99518.js"), "./examples/14_controls_orbit.tsx": () => import("./assets/14_controls_orbit-4d994048.js"), "./examples/15_controls_fly.tsx": () => import("./assets/15_controls_fly-a52285cb.js"), "./examples/16_raycast.tsx": () => import("./assets/16_raycast-29566a89.js"), "./examples/17_raycast_explosion.tsx": () => import("./assets/17_raycast_explosion-d7481fb0.js"), "./examples/index.tsx": () => import("./assets/index-4a36294d.js") })).filter((v) => !v.includes("index")).map((v) => v.replace("./", "")).sort((a, b) => a < b ? -1 : 1).map((v) => v.split(".").slice(0, -1).join("").split("/").slice(1).join("/"));
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
export {
  examples as default
};
