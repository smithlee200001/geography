/* Shared mathematical model. Angles are radians; y is orbital north. */
(function (root) {
  const TAU = Math.PI * 2;
  const tilt = 23.4 * Math.PI / 180;
  const axis = [Math.sin(tilt), Math.cos(tilt), 0];
  function position(phase, radius = 8) {
    return [radius * Math.cos(phase), 0, -radius * Math.sin(phase)];
  }
  function dot(a, b) { return a.reduce((sum, value, i) => sum + value * b[i], 0); }
  function declination(phase) { return Math.asin(-Math.sin(tilt) * Math.cos(phase)); }
  const api = { TAU, tilt, axis, position, dot, declination };
  if (typeof module !== 'undefined') module.exports = api;
  else root.OrbitModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
