import{u as s,a as g,g as c,P as w,C}from"./XEQHI3TD-1374c6ee.js";import{e as o,h,b as l,y as m}from"./web-0901fd59.js";import{c as r,p as P,t as j,r as S}from"./mat4-bfe45697.js";import"./index-cb1a4aba.js";function $(){const[t,a]=o(null),[i,u]=o(r(),{equals:!1}),[v,p]=o(r(),{equals:!1}),n=()=>{const e=r();j(e,e,[0,0,-6]),S(e,e,performance.now()/1e3,[1,1,1]),p(e),requestAnimationFrame(n)};h(()=>{if(!t())return;m(n);const e=m(i);P(e,90*Math.PI/180,t().clientWidth/t().clientHeight,.1,100),u(e)});const f=s.mat4(i),d=s.mat4(v),x=g.vec3(new Float32Array([-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,.5,.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,-.5,.5,-.5,.5,.5,.5,-.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,-.5,.5])),M=c`#version 300 es
out lowp vec4 vColor;
void main(void) {
    gl_Position = ${f} * ${d} * vec4(${x}, 1);
}
`,_=c`#version 300 es
precision mediump float;
in lowp vec4 vColor;
out vec4 color;
void main(void) {
  
  color = vec4(1.,0.,0.,1.);
}
`;return l(C,{ref:a,get children(){return l(w,{ref:a,vertex:M,fragment:_,mode:"TRIANGLES",count:36})}})}export{$ as default};
