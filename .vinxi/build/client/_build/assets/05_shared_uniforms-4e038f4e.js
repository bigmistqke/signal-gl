import{u as t,a as w,g as i,P as y,C as P}from"./XEQHI3TD-1374c6ee.js";import{e as r,a as $,b as s}from"./web-0901fd59.js";import"./index-cb1a4aba.js";function b(){const a=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),[d,m]=r(.5),[v,l]=r([0,0]),[c,u]=r(1),f=$(()=>v().map(o=>o/c())),e=t.vec2(f),n=t.float(c),p=t.float(d),_=w.vec2(a),g=i`#version 300 es
    precision mediump float;
    in vec2 v_coord; 
    out vec4 outColor;
    
    void main() {
      float opacity = ${p};
      vec2 scaledCoord = (v_coord - ${e}) * ${n};
      outColor = vec4(scaledCoord[0], scaledCoord[1], scaledCoord[0], opacity);
    }`,h=i`#version 300 es
    precision mediump float;

    out vec2 v_coord;  
    out vec3 v_color;
    
    void main() {
      vec2 a_coord = ${_};
      v_coord = a_coord + ${e};
      gl_Position = vec4((a_coord - ${e}) * ${n}, 0, 1);
    }`;return s(P,{style:{width:"100vw",height:"100vh"},onMouseMove:o=>{m(1-o.clientY/o.currentTarget.offsetHeight),l([(o.clientX/window.innerWidth-.5)*-2,(o.clientY/window.innerHeight-.5)*2])},onWheel:o=>{o.preventDefault(),u(C=>C-o.deltaY*.01)},get children(){return s(y,{fragment:g,vertex:h,mode:"TRIANGLES",get count(){return a.length/2}})}})}export{b as default};
