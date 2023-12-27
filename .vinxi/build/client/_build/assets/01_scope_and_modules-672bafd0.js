import{e as o,b as c}from"./web-0901fd59.js";import{g as t,u as a,a as l,P as f,C as h}from"./XEQHI3TD-1374c6ee.js";import"./index-cb1a4aba.js";function p(){const[r,v]=o([1,1]),[n]=o(new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),{equals:!1}),[i,s]=o(new Float32Array(new Array(6*3).fill("").map(e=>Math.random())),{equals:!1});setInterval(()=>{s(e=>(e[0]+=.001,e[10]+=.002,e[0]>1&&(e[0]=0),e[10]>1&&(e[10]=0),e))});const u=t`
    float ${"getLength"}(float x, float y){
      return length(x - y);
    }

    vec4 getColor(vec3 color, vec2 coord){
      vec2 cursor = ${a.vec2(r)};

      float lengthX = ${"getLength"}(cursor.x, coord.x);
      float lengthY = ${"getLength"}(cursor.y, coord.y);

      if(lengthX < 0.25 && lengthY < 0.25){
        return vec4(1. - color, 1.0);
      }else{
        return vec4(color, 1.0);
      }
    }`,g=t`#version 300 es
    precision mediump float;
    ${u}

    in vec2 v_coord; 
    in vec3 v_color;
    out vec4 outColor;

    void main() {
      outColor = getColor(v_color, v_coord);
    }`,d=t`#version 300 es

    out vec2 v_coord;  
    out vec3 v_color;

    void main() {
      vec2 a_coord = ${l.vec2(n)};
      v_color = ${l.vec3(i)};
      v_coord = a_coord - ${a.vec2(r)};
      gl_Position = vec4(a_coord, 0, 1) ;
    }`;return c(h,{style:{width:"100%",height:"100vh"},onMouseMove:e=>v([e.clientX/e.currentTarget.clientWidth-.5,(e.currentTarget.clientHeight-e.clientY)/e.currentTarget.clientHeight-.5]),get children(){return c(f,{fragment:g,vertex:d,mode:"TRIANGLES",get count(){return n.length/2}})}})}export{p as default};
