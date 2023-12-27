import{g as a}from"./XEQHI3TD-1374c6ee.js";import{C as n,o as i,S as s,l as m,b as c}from"./index-16d02734.js";import{b as o,m as t,S as d}from"./web-0901fd59.js";import"./index-cb1a4aba.js";import"./store-1bd1f121.js";import"./mat4-bfe45697.js";const p=r=>{const e=m("./teapot.obj");return o(d,{get when(){return e()},get children(){return o(c,t(()=>e(),{get rotation(){return r.rotation},get position(){return r.position},color:[0,0,1],opacity:1,fragment:a`#version 300 es
          precision mediump float;
          in vec4 view;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(view.xyz);
              vec3 dpdy = dFdy(view.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(abs(normal.x), abs(normal.x), abs(normal.x), 1);
          }
        `}))}})},x=()=>o(s,{background:[1,0,0,1],get children(){return[o(p,{}),o(n,t(()=>i({target:[0,1,0],near:3}),{active:!0,fov:33}))]}});export{x as default};
