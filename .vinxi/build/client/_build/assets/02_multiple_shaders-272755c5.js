import{g as t,u as n,C as g,a as u,P as d}from"./XEQHI3TD-1374c6ee.js";import{e as a,b as r}from"./web-0901fd59.js";import"./index-cb1a4aba.js";const i=o=>{const c=t`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${u.vec2(o.vertices)};
      v_coord = a_coord;
      gl_Position = vec4(a_coord, 0, 1.0);
    }`;return r(d,{vertex:c,get fragment(){return o.fragment},mode:"TRIANGLES",get count(){return o.vertices.length/2}})};function _(){const[o,c]=a(.5),[l,v]=a([1,1]),s=t`
    float ${"getLength"}(float x, float y){
      return length(x - y);
    }

    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${n.vec2(l)};

      float lengthX = ${"getLength"}(cursor.x, coord.x);
      float lengthY = ${"getLength"}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        discard;
      }
    }`;return r(g,{style:{width:"100vw",height:"100vh"},onMouseMove:e=>{c(1-e.clientY/e.currentTarget.offsetHeight),v([2*(e.clientX/e.currentTarget.clientWidth)-1,2*((e.currentTarget.clientHeight-e.clientY)/e.currentTarget.clientHeight)-1])},get children(){return[r(i,{get fragment(){return t`#version 300 es
          precision mediump float;
          in vec2 v_coord; 
          out vec4 outColor;
          void main() {
            float opacity = ${n.float(o)};
            outColor = vec4(v_coord[0], v_coord[1], v_coord[0], opacity);
          }`},vertices:new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1])}),r(i,{fragment:t`#version 300 es
          precision mediump float;
          ${s}

          in vec2 v_coord; 
          out vec4 outColor;

          void main() {
            outColor = getColor(vec3(1.0, 0.0, 0.0), v_coord);
          }`,vertices:new Float32Array([-.5,-.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,-.5,.5])})]}})}export{_ as default};
