import{m as d,a as g,p as A,y as $,e as W,n as q,s as Q,b as p,c as F,D as j,t as Y,x as _,w as V,h as b}from"./web-0901fd59.js";import{g as m,c as K,t as J}from"./index-cb1a4aba.js";var S=e=>typeof e=="object"&&Array.isArray(e)?e:[e];function Z(e,r,t){const n=e.createProgram();var s=x(e,r,"vertex"),i=x(e,t,"fragment");return!n||!s||!i?null:(e.attachShader(n,s),e.attachShader(n,i),e.deleteShader(s),e.deleteShader(i),e.linkProgram(n),e.getProgramParameter(n,e.LINK_STATUS)?n:(console.error("error while creating program",e.getProgramInfoLog(n)),e.deleteProgram(n),null))}function x(e,r,t){const n=e.createShader(t==="fragment"?e.FRAGMENT_SHADER:e.VERTEX_SHADER);return n?(e.shaderSource(n,r),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(console.error(t,e.getShaderInfoLog(n)),e.deleteShader(n),null)):(console.error(t,"error while creating shader"),null)}var k=({token:e,gl:r,program:t,addToRenderQueue:n})=>{const s=r.getUniformLocation(t,e.name),o=e.dataType.includes("mat")?()=>r[e.functionName](s,!1,e.value):()=>r[e.functionName](s,e.value);n(e.name,o)},ee=({token:e,gl:r,program:t,addToRenderQueue:n,requestRender:s})=>{const i=r.getAttribLocation(t,e.name);B({token:e.buffer,gl:r,addToRenderQueue:n,requestRender:s,cb:()=>{r.enableVertexAttribArray(i),r.vertexAttribPointer(i,e.size,r.FLOAT,!1,e.options.stride,e.options.offset)}})},B=({token:e,gl:r,addToRenderQueue:t,requestRender:n,cb:s})=>{const i=r.createBuffer();t(e.name,()=>{r.bindBuffer(r[e.options.target],i),s?.(i)}),A(()=>{r.bindBuffer(r[e.options.target],i),r.bufferData(r[e.options.target],e.value,r.STATIC_DRAW),r.finish(),n()})},re=({token:e,gl:r,program:t,addToRenderQueue:n,requestRender:s})=>{const i=c=>c instanceof y,o=r.createTexture(),a=()=>i(e.value)?e.value.texture:o;n(e.name,()=>{r.activeTexture(r[`TEXTURE${e.textureIndex}`]),r.bindTexture(r.TEXTURE_2D,a())}),A(()=>{r.useProgram(t);const{format:c,width:u,height:f,border:h,minFilter:E,magFilter:l,wrapS:O,wrapT:z,internalFormat:X,dataType:H}=e.options;r.activeTexture(r[`TEXTURE${e.textureIndex}`]),r.bindTexture(r.TEXTURE_2D,a()),$(()=>i(e.value))||r.texImage2D(r.TEXTURE_2D,0,r[X],u,f,h,r[c],r[H],e.value),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r[E]),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MAG_FILTER,r[l]),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r[O]),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r[z]),r.uniform1i(r.getUniformLocation(t,e.name),e.textureIndex),s()})},w=e=>{switch(e){case"float":return"uniform1f";case"int":case"bool":return"uniform1i";default:e.includes("mat");const r=e[e.length-1];if(e.includes("mat"))return`uniformMatrix${r}fv`;const t=e[0]==="b"||e[0]==="i"?"i":"f";return`uniform${r}${t}v`}},te=0,Re=new Proxy({},{get(e,r){return(...[t,n])=>r==="sampler2D"?{dataType:r,name:"u_"+m(),functionName:w(r),tokenType:r,get value(){return typeof t=="function"?t():t},options:d({border:0,dataType:"UNSIGNED_BYTE",format:"RGBA",height:2,internalFormat:"RGBA8",magFilter:"NEAREST",minFilter:"NEAREST",width:2,wrapS:"CLAMP_TO_EDGE",wrapT:"CLAMP_TO_EDGE"},n),textureIndex:te++}:{dataType:r,functionName:w(r),get value(){return typeof t=="function"?t():t},name:"u_"+m(),options:n,tokenType:"uniform"}}}),Ee=new Proxy({},{get(e,r){return(...[t,n])=>{const s=d({stride:0,offset:0},n),i=typeof r=="string"?+r[r.length-1]:void 0;return{buffer:P(t,{target:"ARRAY_BUFFER"}),dataType:r,name:"a_"+m(),options:s,size:i&&!isNaN(i)?i:1,tokenType:"attribute"}}}}),P=(e,r)=>({name:r.name||m(),tokenType:"buffer",get value(){return typeof e=="function"?e():e},options:r}),U=class{gl;canvas;config;constructor(e){const r=d({background:[0,0,0,1]},e);this.config=r,this.canvas=r.canvas;const t=r.canvas.getContext("webgl2");if(!t)throw"can not get webgl2 context";this.gl=t,this.gl.enable(this.gl.DEPTH_TEST),this.gl.depthFunc(this.gl.LEQUAL),this.gl.depthRange(.2,10),this.gl.clearDepth(1)}render(){return this}clear(){return this.gl.clearColor(...this.config.background),this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT),this.gl.depthMask(!0),this.gl.enable(this.gl.BLEND),this.gl.blendFunc(this.gl.SRC_ALPHA,this.gl.ONE_MINUS_SRC_ALPHA),this}autosize(e){if(this.canvas instanceof OffscreenCanvas)throw"can not autosize OffscreenCanvas";return new ResizeObserver(()=>{if(this.canvas instanceof OffscreenCanvas)throw"can not autosize OffscreenCanvas";this.canvas.width=this.canvas.clientWidth,this.canvas.height=this.canvas.clientHeight,this.gl.viewport(0,0,this.canvas.width,this.canvas.height),this.clear(),this.render(),e?.(this)}).observe(this.canvas),this}read(e,r){const t={format:"RGBA",dataType:"UNSIGNED_BYTE",internalFormat:"RGBA8",width:this.gl.canvas.width,height:this.gl.canvas.height,...r};return this.render().gl.readPixels(0,0,t.width,t.height,this.gl[t.format],this.gl[t.dataType],e),e}},D=class extends U{config;program;constructor(e){super(e);const r=d({mode:"TRIANGLES",cacheEnabled:!1,first:0,offset:0},e);if(this.config=r,!this.gl)throw"webgl2 is not supported";const n=r.cacheEnabled&&se(r)||Z(this.gl,r.vertex.source.code,r.fragment.source.code);if(!n)throw"error while building program";if(this.program=n,r.cacheEnabled&&ae({...r,program:this.program}),r.vertex.bind(this),r.fragment.bind(this),"indices"in r&&r.indices){const s=P(Array.isArray(r.indices)?new Uint16Array(r.indices):r.indices,{target:"ELEMENT_ARRAY_BUFFER"});B(d(this,{token:s}))}}renderQueue=new Map;addToRenderQueue=(e,r)=>(this.renderQueue.set(e,r),()=>this.renderQueue.delete(e));renderRequestSignal=W(0);getRenderRequest=this.renderRequestSignal[0];setRenderRequest=this.renderRequestSignal[1];requestRender=()=>{this.setRenderRequest(e=>(e+1)%1e8)};render=()=>{this.getRenderRequest(),this.gl.useProgram(this.program);const e=this.renderQueue.values();for(const r of e)r();return this.config.onRender?.(this.gl,this.program),"indices"in this.config&&this.config.indices?this.gl.drawElements(this.gl[this.config.mode||"TRIANGLES"],this.config.indices.length,this.gl.UNSIGNED_SHORT,this.config.offset||0):"count"in this.config?this.gl.drawArrays(this.gl[this.config.mode||"TRIANGLES"],this.config.first||0,this.config.count):console.error("neither indices nor count defined"),this}},N=e=>e instanceof D,L=e=>S(e).filter(N),ne=e=>S(e).filter(r=>!N(r)),R=new WeakMap,se=e=>R.get(e.vertex.template)?.get(e.fragment.template),ae=({vertex:e,fragment:r,program:t})=>{R.get(e.template)||R.set(e.template,new WeakMap),R.get(e.template).get(r.template)||R.get(e.template).set(r.template,t)},C=class extends U{config;get programs(){return this.config.programs}constructor(e){super(e),this.config=e}render(){const e=this.programs;for(const r of e)r.render();return this}},ie=class extends C{texture;constructor(e){super(e),this.texture=new y(this.gl,e)}render(){return super.clear(),this.texture.activate(),super.render(),this.texture.deactivate(),this}},G=class{gl;config;constructor(e,r){this.gl=e,this.config=r||{}}},oe=class extends G{texture;constructor(e,r={}){super(e,r);const t=this.gl.createTexture();if(!t)throw"unable to create texture";this.texture=t}},y=class extends oe{renderBuffer;constructor(e,r={}){super(e,r),this.renderBuffer=new ce(e,r)}activate(){this.renderBuffer.activate(),this.gl.bindTexture(this.gl.TEXTURE_2D,this.texture),this.gl.texImage2D(this.gl.TEXTURE_2D,0,this.gl[this.config.internalFormat||"RGBA8"],this.gl.drawingBufferWidth,this.gl.drawingBufferHeight,0,this.gl[this.config.format||"RGBA"],this.gl[this.config.dataType||"UNSIGNED_BYTE"],null),this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.TEXTURE_2D,this.texture,0)}deactivate(){this.renderBuffer.deactivate()}},ce=class extends G{framebuffer;depthbuffer;colorbuffer;constructor(e,r={}){super(e,r);const t=e.createFramebuffer(),n=e.createRenderbuffer(),s=e.createRenderbuffer();if(!t||!n||!s)throw"could not create framebuffer or renderbuffer";this.config=d({color:!0,depth:!0},r),this.framebuffer=t,this.colorbuffer=n,this.depthbuffer=s}activate(){return this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,this.framebuffer),this.config.color&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.colorbuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.RGBA8,this.gl.drawingBufferWidth,this.gl.drawingBufferHeight),this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.COLOR_ATTACHMENT0,this.gl.RENDERBUFFER,this.colorbuffer)),this.config.depth&&(this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,this.depthbuffer),this.gl.renderbufferStorage(this.gl.RENDERBUFFER,this.gl.DEPTH_COMPONENT16,this.gl.drawingBufferWidth,this.gl.drawingBufferHeight),this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER,this.gl.DEPTH_ATTACHMENT,this.gl.RENDERBUFFER,this.depthbuffer)),this}deactivate(){this.gl.bindFramebuffer(this.gl.FRAMEBUFFER,null),this.gl.bindRenderbuffer(this.gl.RENDERBUFFER,null)}},fe=Y("<canvas>"),M=_(),T=()=>V(M),ue=_(),I=e=>{const r=T();if(!r)return;e.stack.autosize(()=>{e.onResize?.(e.stack);for(const o of r.events.onResize)o()}),performance.now();const t=()=>{e.onBeforeRender?.(),e.clear&&(typeof e.clear=="function"?e.clear(e.stack):e.stack.clear());for(const o of r.events.onResize)o();e.stack.render(),e.onAfterRender?.()},n=K(o=>J(o,1e3/120));let s;const i=()=>{if(e.animate){if(e.animate!==!0){let o=Date.now();(!s||o-s>e.animate)&&(t(),s=o)}else t();requestAnimationFrame(i)}};b(()=>{e.animate?setTimeout(i):(b(()=>{n()&&t()}),s=void 0)})},ve=e=>{const[r,t]=q(e,["children"]),n=d({clear:!0,background:[0,0,0,1]},t),s=(()=>{const a=fe();return Q(a,t,!1,!1),a})(),i=s.getContext("webgl2"),o={onResize:new Set,onRender:new Set};return p(M.Provider,{value:{canvas:s,events:o,gl:i,get onProgramCreate(){return e.onProgramCreate}},get children(){return p(ue.Provider,{value:{canvas:s,gl:i,onRender:a=>(o.onRender.add(a),()=>o.onRender.delete(a)),onResize:a=>(o.onResize.add(a),()=>o.onResize.delete(a))},get children(){return[g(()=>(()=>{const a=F(()=>r.children),c=g(()=>L(a())),u=g(()=>ne(a()));return j(()=>{try{const f=new C({canvas:s,background:n.background,get programs(){return c()}});I(d(n,{stack:f}))}catch(f){console.error(f)}}),g(u)})()),s]}})}})},Te=e=>{const r=T();if(!r)throw"no context";const t=d({canvas:r.canvas},e);return()=>new D(t)},pe=e=>{const r=d({clear:!0},e),t=T();if(!t)throw"internal context undefined";const n=F(()=>e.children);try{const s=new ie({canvas:t.canvas,get programs(){return L(n())},width:t.canvas.width,height:t.canvas.width});I(d(r,{stack:s,onAfterRender:()=>e.onTextureUpdate(s.texture)}))}catch(s){console.error(s)}return()=>e.passthrough?e.children:[]},he=!1,v=new WeakMap,be=function(e,...r){const t=v.has(e);t||v.set(e,[]);const n=v.get(e),s=new Map,i=g(()=>r.map((a,c)=>{if(typeof a=="function")return a();if(typeof a=="string"){const f=t&&n[c]||s.get(a)||`${a}_${m()}`;return s.has(a)||s.set(a,f),(!t||!n[c])&&(n[c]=f),{name:f,tokenType:"scope"}}const u=t&&n[c]||a.name;return t||(n[c]=u),d(a,{name:u})}).filter(a=>a!==void 0));return{get source(){const a=le(e,i());return he&&console.log("source",a.code),a},bind:({gl:a,program:c,addToRenderQueue:u,requestRender:f})=>{a.useProgram(c);const h={gl:a,program:c,addToRenderQueue:u,requestRender:f},E=new Set;i().forEach(l=>{if(!E.has(l.name))switch(E.add(l.name),l.tokenType){case"attribute":return ee({token:l,...h});case"sampler2D":case"isampler2D":return re({token:l,...h});case"uniform":return k({token:l,...h});case"shader":return l.bind(h)}})},tokenType:"shader",template:e,name:"s_"+m()}},de=e=>{switch(e.tokenType){case"shader":return e.source.parts.variables;case"attribute":return`in ${e.dataType} ${e.name};`;case"uniform":case"sampler2D":return`uniform ${e.dataType} ${e.name};`;case"isampler2D":return`uniform highp ${e.dataType} ${e.name};`}},le=(e,r)=>{const t=[...e.flatMap((u,f)=>{const h=r[f];return h&&h.tokenType==="shader"?[u,h.source.parts.body]:!h||!("name"in h)?u:[u,h.name]})].join(""),n=Array.from(new Set(r.flatMap(de))).join(`
`),s=t.match(/precision.*;/)?.[0];if(s){const[u,f]=t.split(/precision.*;/);return{code:[u,s,n,f].join(`
`),parts:{version:u,precision:s,variables:n,body:f}}}const i=t.match(/#version.*/)?.[0],[o,a]=t.split(/#version.*/),c=a||o;return{code:[i,n,c].join(`
`),parts:{version:i,variables:n,body:c}}};export{ve as C,D as G,Te as P,pe as R,Ee as a,C as b,be as g,Re as u};
