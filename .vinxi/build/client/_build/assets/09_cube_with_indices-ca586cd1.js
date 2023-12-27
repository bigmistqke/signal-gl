import{a as r,P as w,g as a,u as c,C as h}from"./XEQHI3TD-1374c6ee.js";import{e,b as l}from"./web-0901fd59.js";import{c as o,t as P,r as A,p as C}from"./mat4-bfe45697.js";import"./index-cb1a4aba.js";function F(){const[t,m]=e(null),[u,v]=e(o(),{equals:!1}),i=o(),[d,p]=e(P(i,i,[0,0,-6]),{equals:!1}),_=r.vec3(new Float32Array([-1,-1,1,1,-1,1,1,1,1,-1,1,1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,-1,1,-1,-1,1,1,1,1,1,1,1,-1,-1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,1,-1,-1,1,1,-1,1,1,1,1,-1,1,-1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1])),f=r.vec3(new Float32Array([1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,1,0,0,1,0,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1,0,0,1,0,0,1,0,0,1,0])),g=[0,1,2,0,2,3,4,5,6,4,6,7,8,9,10,8,10,11,12,13,14,12,14,15,16,17,18,16,18,19,20,21,22,20,22,23],n=()=>(p(s=>A(s,s,.05,[1,1,1])),requestAnimationFrame(n));return n(),l(h,{ref:m,onResize:()=>{v(C(o(),45*Math.PI/180,t().clientWidth/t().clientHeight,.1,100))},get children(){return l(w,{get vertex(){return a`#version 300 es
          precision mediump float;
          out vec3 color_in;
          void main(void) {
            color_in = ${f};
            gl_Position = ${c.mat4(u)} * ${c.mat4(d)} * vec4(${_}, 1.);
          }`},fragment:a`#version 300 es
          precision mediump float;
          in vec3 color_in;
          out vec4 color_out;
          void main(void) {
            color_out = vec4(color_in, 1.);
          }`,mode:"TRIANGLES",indices:g})}})}export{F as default};
