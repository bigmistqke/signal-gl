import{C as f,g as d,a as p,u as s,P as x}from"./XEQHI3TD-1374c6ee.js";import{e as h,b as l,C as M,I as y,y as _,m as C}from"./web-0901fd59.js";import"./index-cb1a4aba.js";const g=new Float32Array([-1,-1,1,-1,-1,1,1,-1,1,1,-1,1].map(a=>a/2)),b=a=>{const o=C({rotation:0,scale:[1,1],position:[0,0]},a),e=d`#version 300 es
    out vec2 v_coord;  
    out vec3 v_color;
    void main() {
      vec2 a_coord = ${p.vec2(g)};
      float rotation =  ${s.float(()=>o.rotation)};
      vec2 scale =  ${s.vec2(()=>o.scale)};
      vec2 translation = ${s.vec2(()=>o.position)};

      // Scaling
      mat3 scaleMatrix = mat3(
          scale.x, 0, 0,
          0, scale.y, 0,
          0, 0, 1
      );

      // Convert angle to radians
      float angle = radians(rotation);
      float c = cos(angle);
      float s = sin(angle);

      // Rotation
      mat3 rotateMatrix = mat3(
          c, -s, 0,
          s, c, 0,
          0, 0, 1
      );

      // Combine transformations
      mat3 transformMatrix = rotateMatrix * scaleMatrix;

      // Apply the transformation
      a_coord = (transformMatrix * vec3(a_coord, 1.0)).xy;
      v_coord = a_coord;
      gl_Position = vec4(a_coord + translation, 1.0, 1.0);
    }`;return l(x,{cacheEnabled:!0,get fragment(){return a.fragment},vertex:e,mode:"TRIANGLES",get count(){return g.length/2}})};function A(a,o=200,e=200,n=1){for(let t=0;t<a.length;t++){let{x:r,y:c,z:i,vx:m,vy:v,vz:u}=a[t];r+=m*n,c+=v*n,i+=u*n,r=(r+o)%o,c=(c+e)%e,a[t]={x:r,y:c,z:i,vx:m,vy:v,vz:u}}}const P=5e3;function w(){const[a,o]=h(new Array(P).fill("").map(()=>({x:Math.random()*200-50,y:Math.random()*200-50,z:Math.random()*200-50,vx:Math.random()-.5,vy:Math.random()-.5,vz:Math.random()-.5})),{equals:!1}),e=()=>{requestAnimationFrame(e),A(a()),M(()=>o(t=>t))};e();const n=t=>d`#version 300 es
   precision mediump float;
   in vec2 v_coord; 
   out vec4 outColor;
   void main() {
     float blue = ${s.float(t)};
     outColor = vec4(0, 0.0, blue, 0.25);
   }`;return l(f,{style:{width:"100vw",height:"100vh",background:"black"},onProgramCreate:()=>{console.log("created a program")},get children(){return l(y,{get each(){return a()},children:(t,r)=>l(b,{get fragment(){return n(.5-r/_(()=>a().length))},scale:[.0125,.0125],get position(){return[t().x/100-1,t().y/100-1]}})})}})}export{w as default};
