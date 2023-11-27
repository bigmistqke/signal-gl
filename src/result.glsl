source #version 300 es
precision mediump float;
uniform vec2 signal_c290268db4ae671c078f223427886d16;
float getLength_ef35cd355fb732161c74975b2b44fcb0(float x, float y){
  return length(x - y);
}
vec4 getColor(vec3 color, vec2 coord){
  vec2 cursor = signal_c290268db4ae671c078f223427886d16;
  float lengthX = getLength_ef35cd355fb732161c74975b2b44fcb0(cursor.x, coord.x);
  float lengthY = getLength_ef35cd355fb732161c74975b2b44fcb0(cursor.y, coord.y);
  if(lengthX < 0.25 && lengthY < 0.25){
  return vec4(1. - color, 1.0);
  }else{
  return vec4(color, 1.0);
}
}
in vec2 v_coord;
in vec3 v_color;
out vec4 outColor;
void main() {
  outColor = getColor(v_color, v_coord);
}