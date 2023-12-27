import{g as n}from"./XEQHI3TD-1374c6ee.js";import{C as s,S as d,l,b as t}from"./index-16d02734.js";import{b as o,e as m,m as a,S as v}from"./web-0901fd59.js";import"./index-cb1a4aba.js";import"./store-1bd1f121.js";import"./mat4-bfe45697.js";const g=()=>{const r=l("./teapot.obj"),[e,c]=m(0),i=()=>{requestAnimationFrame(i),c(p=>p+.01)};return i(),o(v,{get when(){return r()},get children(){return[o(t,a(()=>r(),{get rotation(){return[0,e(),0]},color:[1,1,0],opacity:1,position:[-5,-2,-10]})),o(t,a(()=>r(),{get rotation(){return[0,e(),0]},color:[0,0,1],opacity:1,position:[0,-2,-10],fragment:n`#version 300 es
          precision mediump float;
          in vec4 clip;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(clip.xyz);
              vec3 dpdy = dFdy(clip.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(vec3(abs(normal.x) + abs(normal.y)), 1);
          }
        `})),o(t,a(()=>r(),{get rotation(){return[0,e(),0]},color:[0,0,1],opacity:1,position:[5,-2,-10],fragment:n`#version 300 es
          precision mediump float;
          in vec4 clip;
          out vec4 fragColor;
          void main() {
              vec3 dpdx = dFdx(clip.xyz);
              vec3 dpdy = dFdy(clip.xyz);
              vec3 normal = normalize(cross(dpdx, dpdy));
              fragColor = vec4(normal, 1.0);
          }
        `}))]}})},z=()=>o(d,{background:[1,0,0,1],get children(){return[o(s,{position:[0,0,0],active:!0}),o(g,{})]}});export{z as default};
