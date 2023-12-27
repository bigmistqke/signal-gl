import{_ as e}from"./preload-helper-9f02f19c.js";import{m as p,n as f,a as h,s as L,t as n,i as l,b as u,p as d,q as x,F as P}from"./web-0901fd59.js";import{u as O,f as A,h as R,n as E}from"./routing-de3a4576.js";const D=n("<a>");function I(s){s=p({inactiveClass:"inactive",activeClass:"active"},s);const[,a]=f(s,["href","state","class","activeClass","inactiveClass","end"]),t=O(()=>s.href),i=A(t),o=R(),_=h(()=>{const r=t();if(r===void 0)return!1;const c=E(r.split(/[?#]/,1)[0]).toLowerCase(),m=E(o.pathname).toLowerCase();return s.end?c===m:m.startsWith(c)});return(()=>{const r=D();return L(r,p(a,{get href(){return i()||s.href},get state(){return JSON.stringify(s.state)},get classList(){return{...s.class&&{[s.class]:!0},[s.inactiveClass]:!_(),[s.activeClass]:_(),...a.classList}},link:"",get"aria-current"(){return _()?"page":void 0}}),!1,!1),r})()}const T="_page_6tps2_1",V="_list_6tps2_7",v={page:T,list:V},g=n("<div><ul>"),C=n("<li>");function y(s){const a=Object.keys(Object.assign({"./examples/00_hello_world.tsx":()=>e(()=>import("./00_hello_world-b7522f65.js"),["assets/00_hello_world-b7522f65.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js"]),"./examples/01_scope_and_modules.tsx":()=>e(()=>import("./01_scope_and_modules-68bf4c7b.js"),["assets/01_scope_and_modules-68bf4c7b.js","assets/web-0901fd59.js","assets/XEQHI3TD-1374c6ee.js","assets/index-cb1a4aba.js"]),"./examples/02_multiple_shaders.tsx":()=>e(()=>import("./02_multiple_shaders-fc2bacc2.js"),["assets/02_multiple_shaders-fc2bacc2.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js"]),"./examples/03_caching_shaders.tsx":()=>e(()=>import("./03_caching_shaders-c0580202.js"),["assets/03_caching_shaders-c0580202.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js"]),"./examples/04_vanilla.tsx":()=>e(()=>import("./04_vanilla-0efcc578.js"),["assets/04_vanilla-0efcc578.js","assets/web-0901fd59.js","assets/XEQHI3TD-1374c6ee.js","assets/index-cb1a4aba.js"]),"./examples/05_shared_uniforms.tsx":()=>e(()=>import("./05_shared_uniforms-1909c3f2.js"),["assets/05_shared_uniforms-1909c3f2.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js"]),"./examples/06_game_of_life.tsx":()=>e(()=>import("./06_game_of_life-b7b31a81.js"),["assets/06_game_of_life-b7b31a81.js","assets/web-0901fd59.js","assets/store-1bd1f121.js","assets/XEQHI3TD-1374c6ee.js","assets/index-cb1a4aba.js"]),"./examples/08_cube.tsx":()=>e(()=>import("./08_cube-913b7e08.js"),["assets/08_cube-913b7e08.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/mat4-bfe45697.js"]),"./examples/09_cube_with_indices.tsx":()=>e(()=>import("./09_cube_with_indices-6f3b6521.js"),["assets/09_cube_with_indices-6f3b6521.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/mat4-bfe45697.js"]),"./examples/10_classes.tsx":()=>e(()=>import("./10_classes-93df20db.js"),["assets/10_classes-93df20db.js","assets/web-0901fd59.js","assets/XEQHI3TD-1374c6ee.js","assets/index-cb1a4aba.js"]),"./examples/11_render_texture.tsx":()=>e(()=>import("./11_render_texture-ebdf0370.js"),["assets/11_render_texture-ebdf0370.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/mat4-bfe45697.js"]),"./examples/12_tetris.tsx":()=>e(()=>import("./12_tetris-256a90fa.js"),["assets/12_tetris-256a90fa.js","assets/index-16d02734.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js","assets/names-f7f818c5.js"]),"./examples/13_teapot_obj.tsx":()=>e(()=>import("./13_teapot_obj-51ca4192.js"),["assets/13_teapot_obj-51ca4192.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/index-16d02734.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js"]),"./examples/14_controls_orbit.tsx":()=>e(()=>import("./14_controls_orbit-bfb75868.js"),["assets/14_controls_orbit-bfb75868.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/index-16d02734.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js"]),"./examples/15_controls_fly.tsx":()=>e(()=>import("./15_controls_fly-5e0e5ce2.js"),["assets/15_controls_fly-5e0e5ce2.js","assets/XEQHI3TD-1374c6ee.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/index-16d02734.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js"]),"./examples/16_raycast.tsx":()=>e(()=>import("./16_raycast-c16b0f46.js"),["assets/16_raycast-c16b0f46.js","assets/index-16d02734.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js"]),"./examples/17_raycast_explosion.tsx":()=>e(()=>import("./17_raycast_explosion-220740bc.js"),["assets/17_raycast_explosion-220740bc.js","assets/index-16d02734.js","assets/web-0901fd59.js","assets/index-cb1a4aba.js","assets/store-1bd1f121.js","assets/mat4-bfe45697.js"]),"./examples/index.tsx":()=>e(()=>import("./index-938eeb37.js"),[])})).filter(t=>!t.includes("index")).map(t=>t.replace("./","")).sort((t,i)=>t<i?-1:1).map(t=>t.split(".").slice(0,-1).join("").split("/").slice(1).join("/"));return console.log("examples",a),(()=>{const t=g(),i=t.firstChild;return l(i,u(P,{each:a,children:o=>(()=>{const _=C();return l(_,u(I,{href:`./${o}`,get children(){return o.split("_").slice(1).join(" ")}})),d(()=>x(_,v.list)),_})()})),l(t,()=>s.children,null),d(()=>x(t,v.page)),t})()}export{y as default};
