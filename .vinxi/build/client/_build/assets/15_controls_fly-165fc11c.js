import{g as n}from"./XEQHI3TD-1374c6ee.js";import{l as i,b as m,C as s,f as d,S as c}from"./index-16d02734.js";import{b as r,F as p,S as l,m as e}from"./web-0901fd59.js";import"./index-cb1a4aba.js";import"./store-1bd1f121.js";import"./mat4-bfe45697.js";const o=100,g=()=>({rotation:[Math.random()*o-o/2,Math.random()*o-o/2,Math.random()*o-o/2],position:[Math.random()*o-o/2,Math.random()*o-o/2,Math.random()*o-o/2]}),b=()=>{const a=i("./teapot.obj");return r(c,{background:[1,0,0,1],get children(){return[r(p,{get each(){return Array.from({length:1e3}).map(g)},children:t=>r(l,{get when(){return a()},get children(){return r(m,e(()=>a(),{get rotation(){return t.rotation},get position(){return t.position},opacity:1,fragment:n`#version 300 es
                precision mediump float;
                in vec4 view;
                out vec4 fragColor;
                void main() {
                    vec3 dpdx = dFdx(view.xyz);
                    vec3 dpdy = dFdy(view.xyz);
                    vec3 normal = normalize(cross(dpdx, dpdy));
                    fragColor = vec4(abs(normal.x), abs(normal.x), abs(normal.x), 1);
                }
              `}))}})}),r(s,e(d,{active:!0,fov:33}))]}})};export{b as default};
