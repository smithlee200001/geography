const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./model.js');
const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-10, `${a} != ${b}`);
test('orbit is planar, constant radius and closes after a year', () => {
  for (let i=0;i<360;i++) { const p=M.position(i*Math.PI/180); close(Math.hypot(...p),8); close(p[1],0); }
  M.position(0).forEach((v,i)=>close(v,M.position(M.TAU)[i]));
});
test('axis is fixed and normalized; seasonal illumination is consistent', () => {
  close(Math.hypot(...M.axis),1);
  close(M.declination(0),-M.tilt); close(M.declination(Math.PI),M.tilt);
  close(M.declination(Math.PI/2),0); close(M.declination(Math.PI*1.5),0);
  for (let i=0;i<4;i++) { const light=M.position(i*Math.PI/2).map(v=>-v/8); close(Math.asin(M.dot(M.axis,light)),M.declination(i*Math.PI/2)); }
});
test('north-view orbit advances counterclockwise', () => {
  const p=M.position(.01); assert.ok(p[0]>0); assert.ok(p[2]<0);
});
