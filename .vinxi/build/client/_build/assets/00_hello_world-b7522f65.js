import{g as t,u as s,a as v,P as l,C as u}from"./XEQHI3TD-1374c6ee.js";import{e as d,b as r}from"./web-0901fd59.js";import"./index-cb1a4aba.js";function g(){const o=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),[c,a]=d(.5),n=t`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    void main() {
      float opacity = ${s.float(c)};
      outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
    }`,i=t`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${v.vec2(o)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1) ;
    }`;return r(u,{onMouseMove:e=>a(1-e.clientY/e.currentTarget.offsetHeight),get children(){return r(l,{fragment:n,vertex:i,mode:"TRIANGLES",get count(){return o.length/2}})}})}export{g as default};
