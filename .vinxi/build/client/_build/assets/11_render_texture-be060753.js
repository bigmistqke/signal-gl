import{u as v,R as h,g as m,C as x,a as l,P as _}from"./XEQHI3TD-1374c6ee.js";import{e as n,b as t}from"./web-0901fd59.js";import{c as d,t as w,p as $,r as j}from"./mat4-bfe45697.js";import"./index-cb1a4aba.js";const f=e=>{const o=d(),[r,s]=n(w(o,o,e.position),{equals:!1}),a=l.vec3(new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1])),i=l.vec2(new Float32Array([0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1])),c=l.vec3(new Float32Array([1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1,0,0,1,0,0,1,0,0,1,0])),u=[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23],p=()=>{s(g=>j(g,g,.05,[1,1,1])),requestAnimationFrame(p)};return p(),t(_,{get vertex(){return m`#version 300 es
          precision mediump float;
          out vec3 color;
          out vec2 uv;
          void main(void) {
            color = ${c};
            uv = ${i};
            gl_Position = ${v.mat4(e.projection)} * ${v.mat4(r)} * vec4(${a}, 1.);
          }`},get fragment(){return e.fragment||m`#version 300 es
        precision mediump float;
        in vec3 color;
        out vec4 result;
        void main(void) {
          result = vec4(color, 1.);
        }`},mode:"TRIANGLES",indices:u,cacheEnabled:!0})};function b(){const[e,o]=n(null),[r,s]=n(d(),{equals:!1}),a=()=>{s($(d(),45*Math.PI/180,e().clientWidth/e().clientHeight,.1,1e4))},[i,c]=n(null,{equals:!1}),u=v.sampler2D(i);return t(x,{ref:o,onResize:a,get children(){return[t(h,{onTextureUpdate:c,passthrough:!0,get children(){return t(f,{get projection(){return r()},position:[0,0,-10]})}}),t(f,{get projection(){return r()},position:[0,-2,-5],fragment:m`#version 300 es
        precision highp float;
        in vec2 uv;
        out vec4 result;
        void main(void) {
          result = texture(${u}, mod(uv, 1.0)) + vec4(0.125, 0., 0.25, 1.0);
        }`})]}})}export{b as default};
