import{b as m,h as p}from"./web-0901fd59.js";import{c as C,r as x}from"./store-1bd1f121.js";import{g as u,u as h,a as A,P as E,C as N}from"./XEQHI3TD-1374c6ee.js";import"./index-cb1a4aba.js";function U(){const n=w(),s=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1]),i=u`#version 300 es
    precision lowp float;
    in vec2 vTexCoord; 
    out vec4 outColor;

    void main() {
     outColor = texture(${h.sampler2D(n,{format:"LUMINANCE",internalFormat:"LUMINANCE",dataType:"UNSIGNED_BYTE",width:v,height:d})}, vTexCoord * 0.5 + 0.5);
    }
  `,c=u`#version 300 es
  out vec2 vTexCoord;

  void main() {
    vTexCoord = ${A.vec2(s)};
    gl_Position = vec4(vTexCoord, 0, 1);
  }
`;return m(N,{get children(){return m(E,{fragment:i,vertex:c,mode:"TRIANGLES",count:6})}})}const T=(n,s)=>new Array(n).fill("").map(()=>new Array(s).fill("").map(()=>Math.random()>.75?255:0)),v=4*4,d=4*4,w=()=>{const[n,s]=C(T(v,d)),i=(o,r,e)=>{let a=0;const t=[-1,0,1];return t.forEach(l=>t.forEach(f=>{l===0&&f===0||o[r+l]?.[e+f]&&a++})),a},c=(o,r,e)=>{const a=o[r]?.[e],t=i(o,r,e);return a&&(t===2||t===3)||!a&&t===3?255:0},g=o=>{const r=[];for(let e=0;e<o.length;e++){const a=o[e];r.push([]);for(let t=0;t<a.length;t++)r[e][t]=c(o,e,t)}return r};return p(()=>{setInterval(()=>{s(x(g(n)))},1e3)}),()=>new Uint8Array(n.flat(1))};export{U as default};
