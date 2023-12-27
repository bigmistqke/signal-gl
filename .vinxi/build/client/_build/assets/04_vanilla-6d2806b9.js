import{e as l,D as m,t as u,G as d,g as f,h as _}from"./web-0901fd59.js";import{g as c,u as p,a as g,G as $,b as y}from"./XEQHI3TD-1374c6ee.js";import"./index-cb1a4aba.js";const G=u("<canvas>");function L(){const[n,s]=l(.5),a=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),i=c`#version 300 es
  precision mediump float;
  in vec2 v_coord; 
  out vec4 outColor;
  void main() {
    float opacity = ${p.float(n)};
    outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
  }`,v=c`#version 300 es
  out vec2 v_coord;  
  out vec3 v_color;
  void main() {
    vec2 a_coord = ${g.vec2(a)};
    v_coord = a_coord;
    gl_Position = vec4(a_coord, 0, 1) ;
  }`;let t;return m(()=>{const o=new $({canvas:t,vertex:v,fragment:i,mode:"TRIANGLES",count:a.length/2}),e=new y({canvas:t,programs:[o]});_(()=>e?.render())}),(()=>{const o=G();o.$$mousemove=r=>s(1-r.clientY/r.currentTarget.offsetHeight);const e=t;return typeof e=="function"?d(e,o):t=o,o})()}f(["mousemove"]);export{L as default};
