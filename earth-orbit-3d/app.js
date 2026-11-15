'use strict';
const M = OrbitModel;
const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);
const names = ['冬至', '春分', '夏至', '秋分'];
let phase = 0, playing = false, yaw = -0.35, pitch = 0.65, width = 800, height = 510;
let previous = 0, pointer = null, camera;
const texture = document.createElement('canvas');
texture.width = 360; texture.height = 180;
const tc = texture.getContext('2d');
// Simplified continents, used only as a recognizable schematic globe texture.
const continents = [
  [[-168,70],[-130,72],[-100,78],[-55,48],[-80,25],[-90,10],[-110,28],[-127,50]],
  [[-80,12],[-52,5],[-35,-8],[-48,-30],[-69,-55],[-78,-15]],
  [[-17,34],[10,37],[35,30],[50,10],[34,-28],[18,-35],[7,-5],[-15,10]],
  [[-10,36],[-10,60],[30,71],[90,77],[180,65],[150,42],[120,20],[103,0],[80,10],[65,25],[35,35]],
  [[113,-11],[139,-10],[153,-25],[145,-39],[115,-34]],
  [[-52,60],[-22,65],[-25,82],[-58,80]],
  [[-180,-72],[180,-72],[180,-90],[-180,-90]]
];
tc.fillStyle = '#fff';
for (const polygon of continents) {
  tc.beginPath(); polygon.forEach(([lon, lat], i) => tc[i ? 'lineTo' : 'moveTo'](lon + 180, 90 - lat)); tc.closePath(); tc.fill();
}
const land = tc.getImageData(0, 0, 360, 180).data;
const sphere = document.createElement('canvas'); sphere.width = sphere.height = 100;
const sc = sphere.getContext('2d');
function add(a, b, scale = 1) { return a.map((v, i) => v + b[i] * scale); }
function setupCamera() {
  camera = { right: [Math.cos(yaw), 0, -Math.sin(yaw)], up: [Math.sin(yaw) * Math.sin(pitch), Math.cos(pitch), Math.cos(yaw) * Math.sin(pitch)], depth: [Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)] };
}
function project(v) {
  const z = M.dot(v, camera.depth), scale = Math.min(width / 24, height / (23 * Math.max(.65, Math.abs(Math.sin(pitch))))) * 35 / (35 + z);
  return { x: width / 2 + M.dot(v, camera.right) * scale, y: height / 2 - M.dot(v, camera.up) * scale, z, scale };
}
function line(a, b, color, weight = 1) {
  const p = project(a), q = project(b); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.strokeStyle = color; ctx.lineWidth = weight; ctx.stroke();
}
function globe(pos, ghost) {
  const p = project(pos), r = p.scale * (ghost ? 0.43 : 0.75);
  ctx.save(); ctx.globalAlpha = ghost ? 0.45 : 1;
  if (!ghost) {
    const pixels = sc.createImageData(100, 100), light = pos.map(v => -v / 8);
    for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) {
      const nx = (x - 49.5) / 49, ny = (49.5 - y) / 49, d = nx * nx + ny * ny;
      if (d > 1) continue;
      const nz = Math.sqrt(1 - d);
      const normal = camera.right.map((v, i) => nx * v + ny * camera.up[i] - nz * camera.depth[i]);
      const localX = Math.cos(M.tilt) * normal[0] - Math.sin(M.tilt) * normal[1];
      const localY = Math.sin(M.tilt) * normal[0] + Math.cos(M.tilt) * normal[1];
      const lon = Math.atan2(-normal[2], localX) * 180 / Math.PI;
      const lat = Math.asin(Math.max(-1, Math.min(1, localY))) * 180 / Math.PI;
      const tx = Math.min(359, Math.max(0, Math.floor(lon + 180))), ty = Math.min(179, Math.max(0, Math.floor(90 - lat)));
      const isLand = land[(ty * 360 + tx) * 4 + 3] > 0;
      const color = Math.abs(lat) > 72 ? [209, 235, 237] : isLand ? [88, 184, 140] : [34, 131, 193];
      const illumination = 0.16 + 0.84 * Math.max(0, M.dot(normal, light));
      const i = (y * 100 + x) * 4;
      for (let c = 0; c < 3; c++) pixels.data[i + c] = color[c] * illumination;
      pixels.data[i + 3] = Math.min(255, (1 - d) * 12000);
    }
    sc.putImageData(pixels, 0, 0); ctx.drawImage(sphere, p.x - r, p.y - r, r * 2, r * 2);
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, M.TAU); ctx.strokeStyle = '#85cff650'; ctx.lineWidth = 2; ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, M.TAU); ctx.fillStyle = '#315a70'; ctx.fill(); ctx.strokeStyle = '#74a1ac'; ctx.stroke();
  }
  line(add(pos, M.axis, -1.35), add(pos, M.axis, 1.35), '#99f5ce', ghost ? 1 : 2);
  const north = project(add(pos, M.axis, 1.65)); ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#a5e9cd'; ctx.fillText('N', north.x, north.y);
  ctx.restore();
}
function sun() {
  const p = project([0, 0, 0]), r = p.scale * 1.05;
  const halo = ctx.createRadialGradient(p.x, p.y, r * 0.1, p.x, p.y, r * 2.4);
  halo.addColorStop(0, '#ffd77888'); halo.addColorStop(1, '#ffb34900'); ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, M.TAU); ctx.fill();
  const fill = ctx.createRadialGradient(p.x - r * .3, p.y - r * .3, 0, p.x, p.y, r);
  fill.addColorStop(0, '#fff3bb'); fill.addColorStop(.55, '#ffd471'); fill.addColorStop(1, '#ef942c'); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, M.TAU); ctx.fill();
  ctx.fillStyle = '#ffe0a0'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('太阳', p.x, p.y + r + 20);
}
function draw() {
  setupCamera(); ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < 95; i++) { ctx.fillStyle = i % 4 ? '#42607444' : '#9aaeb377'; ctx.fillRect(((i * 137.51) % 997) / 997 * width, ((i * 89.71) % 499) / 499 * height, 1, 1); }
  const commands = [{ z: 0, paint: sun }];
  for (let i = 0; i < 160; i++) {
    const a = M.position(i / 160 * M.TAU), b = M.position((i + 1) / 160 * M.TAU);
    commands.push({ z: project(a).z, paint: () => line(a, b, '#54798c88', 1.3) });
  }
  // Arrowheads lie in the orbital plane and follow the same direction as motion.
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + .65, tip = M.position(a), tail = M.position(a - .12);
    commands.push({ z: project(tip).z, paint: () => { line(tail, tip, '#8ccfc0', 2); line(add(tail, [Math.cos(a), 0, -Math.sin(a)], .25), tip, '#8ccfc0', 2); line(add(tail, [Math.cos(a), 0, -Math.sin(a)], -.25), tip, '#8ccfc0', 2); } });
  }
  for (let i = 0; i < 4; i++) {
    const pos = M.position(i * Math.PI / 2);
    if ($('ghosts').checked && Math.abs(Math.atan2(Math.sin(phase - i * Math.PI / 2), Math.cos(phase - i * Math.PI / 2))) > .16) commands.push({ z: project(pos).z, paint: () => globe(pos, true) });
    const label = project(M.position(i * Math.PI / 2, 10));
    ctx.textAlign = 'center'; ctx.font = '12px system-ui'; ctx.fillStyle = '#a1b6c2'; ctx.fillText(names[i], label.x, label.y + 4);
  }
  const pos = M.position(phase); commands.push({ z: project(pos).z, paint: () => globe(pos, false) });
  commands.sort((a, b) => b.z - a.z).forEach(command => command.paint());
}
function updateInfo() {
  const days = phase / M.TAU * 365.25, degrees = M.declination(phase) * 180 / Math.PI;
  const nearest = Math.round(phase / (Math.PI / 2)) % 4;
  const atLandmark = Math.abs(phase / (Math.PI / 2) - Math.round(phase / (Math.PI / 2))) < .015;
  $('season').textContent = `北半球 · ${atLandmark ? names[nearest] : ['冬季 → 春季', '春季 → 夏季', '夏季 → 秋季', '秋季 → 冬季'][Math.min(3, Math.floor(phase / (Math.PI / 2)))]}`;
  $('day').textContent = `自冬至起 ${Math.round(days)} 天`;
  $('progress').textContent = `${days.toFixed(1)} / 365.25 天`;
  $('timeline').value = days; $('timeline').setAttribute('aria-valuetext', `自冬至起 ${days.toFixed(1)} 天`);
  $('declination').textContent = Math.abs(degrees) < .05 ? '赤道 0°' : `${degrees > 0 ? '北纬' : '南纬'} ${Math.abs(degrees).toFixed(1)}°`;
  $('explain-title').textContent = Math.abs(degrees) < .2 ? '阳光直射赤道附近' : degrees < 0 ? '北极背向太阳' : '北极朝向太阳';
  $('explain').textContent = Math.abs(degrees) < .2 ? '南北半球获得的日照接近，两半球昼夜长度大致相等。' : degrees < 0 ? '北半球接收到的阳光更斜，白昼较短；南半球正好相反。' : '北半球接收到的阳光更直接，白昼较长；南半球正好相反。';
  document.querySelectorAll('[data-phase]').forEach((b, i) => b.setAttribute('aria-pressed', String(atLandmark && i === nearest)));
}
function setPlaying(value) { playing = value; $('play').textContent = playing ? 'Ⅱ 暂停公转' : '▶ 开始公转'; $('play').setAttribute('aria-pressed', String(playing)); }
$('play').onclick = () => setPlaying(!playing);
$('timeline').oninput = () => { setPlaying(false); phase = Number($('timeline').value) / 365.25 * M.TAU; updateInfo(); draw(); };
$('ghosts').onchange = draw;
document.querySelectorAll('[data-phase]').forEach(button => button.onclick = () => { setPlaying(false); phase = Number(button.dataset.phase) * Math.PI / 2; updateInfo(); draw(); });
function markView(view) { document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === view))); }
document.querySelectorAll('[data-view]').forEach(button => button.onclick = () => {
  const view = button.dataset.view; [yaw, pitch] = view === 'top' ? [0, Math.PI / 2] : view === 'side' ? [0, .07] : [-.35, .65]; markView(view); draw();
});
canvas.onpointerdown = event => { pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); };
canvas.onpointermove = event => { if (!pointer || pointer.id !== event.pointerId) return; yaw -= (event.clientX - pointer.x) * .008; pitch = Math.max(-1.5, Math.min(Math.PI / 2, pitch + (event.clientY - pointer.y) * .008)); pointer.x = event.clientX; pointer.y = event.clientY; markView('custom'); draw(); };
canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { pointer = null; };
canvas.onkeydown = event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); yaw += event.key === 'ArrowLeft' ? .12 : event.key === 'ArrowRight' ? -.12 : 0; pitch = Math.max(-1.5, Math.min(Math.PI / 2, pitch + (event.key === 'ArrowUp' ? .12 : event.key === 'ArrowDown' ? -.12 : 0))); markView('custom'); draw(); };
function resize() { const box = canvas.getBoundingClientRect(); width = box.width; height = box.height; const ratio = Math.min(window.devicePixelRatio || 1, 2); canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); draw(); }
new ResizeObserver(resize).observe(canvas);
document.addEventListener('visibilitychange', () => { previous = 0; });
function frame(time) { const elapsed = previous ? Math.min((time - previous) / 1000, .1) : 0; previous = time; if (playing && !document.hidden) { phase = (phase + elapsed * Number($('speed').value)) % M.TAU; updateInfo(); draw(); } requestAnimationFrame(frame); }
updateInfo(); resize(); requestAnimationFrame(frame);
