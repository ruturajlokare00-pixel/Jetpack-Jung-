'use strict';
// ================= JETPACK JUNG v2 =================
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
let DPR = 1, VW = 0, VH = 0, SCALE = 1, ROT = false;
const IS_TOUCH = ('ontouchstart' in window) || matchMedia('(pointer:coarse)').matches;
const rootEl = $('root');
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  const iw = window.innerWidth, ih = window.innerHeight;
  ROT = IS_TOUCH && ih > iw;
  document.documentElement.classList.toggle('rot', ROT);
  VW = ROT ? ih : iw; VH = ROT ? iw : ih;
  rootEl.style.width = VW + 'px'; rootEl.style.height = VH + 'px';
  document.body.classList.toggle('short', VH < 560);
  cv.width = Math.floor(VW * DPR); cv.height = Math.floor(VH * DPR);
  SCALE = Math.max(0.5, Math.min(VW / 1250, VH / 720));
  if (VH < 560) SCALE = Math.max(SCALE, VH / 520);
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 150)); resize();
function toGame(cx, cy) { return ROT ? { x: cy, y: window.innerWidth - cx } : { x: cx, y: cy }; }

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
const pick = a => a[Math.floor(Math.random() * a.length)];
const OL = '#1b1730';

// ================= MAPS =================
const MAPS = {
  desert: {
    name: 'Desert Storm', rects: [[0, 1700, 3600, 100], [300, 1570, 480, 130], [1480, 1610, 620, 90], [2720, 1550, 480, 150],
    [150, 1310, 360, 40], [700, 1190, 400, 40], [1240, 1360, 300, 40], [1640, 1160, 380, 40], [2160, 1330, 340, 40], [2560, 1130, 400, 40], [3090, 1310, 360, 40],
    [1020, 1230, 60, 330], [2480, 1170, 60, 330], [380, 860, 460, 44], [1080, 760, 260, 40], [1480, 600, 640, 50], [2260, 780, 280, 40], [2780, 860, 460, 44],
    [1770, 650, 70, 510], [180, 470, 300, 40], [800, 380, 320, 40], [2480, 380, 320, 40], [3120, 470, 300, 40], [640, 1000, 60, 190], [2900, 900, 60, 230]],
    th: { sky: [[0, '#2b1640'], [.45, '#a8436b'], [.75, '#f08a4b'], [1, '#ffc56b']], sun: '#ffe7b0', glow: '255,200,120', sunY: .62, far: '#6a2f5c', mid: '#4a2045', stars: true, style: 'desert', body: ['#c9773f', '#7a3a26'], cap: '#e8b25a', grass: '#7fae3f', wall: '#3b1d2c' }
  },
  snow: {
    name: 'Frostbite', rects: [[0, 1700, 3600, 100], [200, 1450, 500, 40], [200, 1490, 40, 210], [660, 1490, 40, 110], [2900, 1450, 500, 40], [3360, 1490, 40, 210], [2900, 1490, 40, 110],
    [1700, 800, 200, 40], [1770, 840, 60, 600], [1580, 1180, 440, 40], [1480, 1440, 640, 40], [300, 1150, 350, 36], [950, 1280, 300, 36], [2350, 1280, 300, 36], [2950, 1150, 350, 36],
    [600, 900, 400, 36], [2600, 900, 400, 36], [1150, 1020, 250, 36], [2200, 1020, 250, 36], [200, 620, 300, 36], [3100, 620, 300, 36], [880, 560, 350, 36], [2370, 560, 350, 36], [1550, 430, 500, 40],
    [1100, 1620, 80, 80], [2420, 1620, 80, 80], [1250, 1640, 60, 60]],
    th: { sky: [[0, '#4a78c2'], [.6, '#a9d0f5'], [1, '#e8f4ff']], sun: '#fffbe8', glow: '255,255,230', sunY: .3, far: '#b9cde6', mid: '#93aecf', style: 'snow', body: ['#8d9bb0', '#57627a'], cap: '#ffffff', grass: '#dff1ff', wall: '#2c3550', snowfall: true }
  },
  jungle: {
    name: 'Jungle Temple', rects: [[0, 1650, 900, 150], [900, 1720, 500, 80], [1400, 1600, 800, 200], [2200, 1720, 500, 80], [2700, 1650, 900, 150],
    [1550, 1450, 500, 150], [1650, 1300, 300, 150], [1720, 1150, 160, 150], [200, 1350, 300, 36], [650, 1150, 300, 36], [250, 900, 350, 36], [700, 700, 300, 36], [300, 450, 350, 36],
    [3100, 1350, 300, 36], [2650, 1150, 300, 36], [3000, 900, 350, 36], [2600, 700, 300, 36], [2950, 450, 350, 36], [1450, 850, 700, 40], [1300, 600, 250, 36], [2050, 600, 250, 36], [1650, 350, 300, 36],
    [1100, 1200, 60, 520], [2440, 1200, 60, 520], [1160, 1200, 300, 30], [2140, 1200, 300, 30]],
    th: { sky: [[0, '#58b7d6'], [.6, '#a8e0c8'], [1, '#e6f6c8']], sun: '#fff6c4', glow: '255,240,170', sunY: .35, far: '#79b77a', mid: '#4a8f57', style: 'jungle', body: ['#a59a80', '#6b6250'], cap: '#5cb85c', grass: '#3e8e41', wall: '#2b3a26' }
  },
  neon: {
    name: 'Neon City', rects: [[0, 1740, 3600, 60], [80, 1200, 420, 540], [620, 1400, 300, 340], [1040, 1000, 380, 740], [1540, 1300, 520, 440], [2180, 950, 380, 790], [2680, 1350, 300, 390], [3100, 1150, 420, 590],
    [520, 1050, 220, 24], [1440, 800, 200, 24], [2580, 750, 200, 24], [2940, 1000, 200, 24], [300, 800, 250, 24], [1700, 600, 300, 30], [3150, 700, 250, 24], [800, 650, 250, 24], [2300, 500, 250, 24], [1200, 450, 200, 24], [600, 400, 200, 24], [2850, 420, 220, 24]],
    th: { sky: [[0, '#06031a'], [.55, '#26104a'], [1, '#6a1f78']], sun: '#f2e9ff', glow: '200,150,255', sunY: .22, moon: true, far: '#1d1240', mid: '#140b2e', stars: true, style: 'neon', blocky: true, body: ['#2a1f4d', '#160f2e'], cap: '#ff3df2', grass: '#3df2ff', wall: '#0c0820' }
  }
};
let WW = 3600, WH = 1800, MAP = MAPS.desert, TH = MAP.th, RECTS = [], SPAWNS = [], ITEM_SPOTS = [];
function loadMap(key) {
  MAP = MAPS[key] || MAPS.desert; TH = MAP.th;
  RECTS = MAP.rects.map(([x, y, w, h], i) => ({ x, y, w, h, seed: (i * 0.6180339) % 1 }));
  RECTS.push({ x: 0, y: 0, w: 40, h: WH, wall: true, seed: 0 }, { x: WW - 40, y: 0, w: 40, h: WH, wall: true, seed: 0 });
  SPAWNS = []; ITEM_SPOTS = [];
  for (const r of RECTS) {
    if (r.wall || r.w < 100) continue;
    const n = Math.max(1, Math.floor(r.w / 220));
    for (let i = 0; i < n; i++) { const x = r.x + r.w * (i + .5) / n; if (clearAbove(x, r.y)) SPAWNS.push([x, r.y - 30]); }
    const cx = r.x + r.w / 2; if (clearAbove(cx, r.y)) ITEM_SPOTS.push([cx, r.y]);
  }
  while (ITEM_SPOTS.length > 22) ITEM_SPOTS.splice(Math.floor(Math.random() * ITEM_SPOTS.length), 1);
}
function solidAt(x, y) {
  if (x < 0 || x > WW || y > WH) return true;
  for (const r of RECTS) if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return true;
  return false;
}
function clearAbove(x, top) { for (const yy of [top - 6, top - 30, top - 58]) for (const xx of [x - 15, x, x + 15]) if (solidAt(xx, yy)) return false; return true; }
function los(x1, y1, x2, y2) {
  const d = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(d / 18);
  for (let i = 1; i < n; i++) { const t = i / n; if (solidAt(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false; }
  return true;
}

// ================= WEAPONS =================
const WEAPONS = {
  pistol: { name: 'Pistol', dmg: 20, rate: .28, speed: 1500, spread: .025, mag: 12, reserve: Infinity, reload: .9, pellets: 1, life: .65, len: 16, col: '#ffe9a8', snd: 'pistol', recoil: 0, shake: 1.5, range: 800, heavy: 0 },
  magnum: { name: 'Magnum', dmg: 46, rate: .5, speed: 2100, spread: .012, mag: 6, reserve: 30, reload: 1.5, pellets: 1, life: .7, len: 20, col: '#fff2c0', snd: 'magnum', recoil: 60, shake: 3, range: 1000, heavy: 2 },
  uzi: { name: 'Uzi', dmg: 9, rate: .065, speed: 1500, spread: .1, mag: 32, reserve: 128, reload: 1.2, pellets: 1, life: .5, len: 20, col: '#ffe08a', snd: 'uzi', recoil: 0, shake: 1.2, range: 650, heavy: 1 },
  m4: { name: 'M4 Burst', dmg: 16, rate: .4, burst: 3, gap: .06, speed: 1900, spread: .03, mag: 30, reserve: 120, reload: 1.4, pellets: 1, life: .6, len: 32, col: '#fff0b0', snd: 'm4', recoil: 0, shake: 1.6, range: 1000, heavy: 3 },
  shotgun: { name: 'Shotgun', dmg: 12, rate: .78, speed: 1300, spread: .24, mag: 6, reserve: 24, reload: 1.5, pellets: 8, life: .3, len: 28, col: '#ffcf70', snd: 'shotgun', recoil: 220, shake: 5, range: 360, heavy: 2 },
  ak47: { name: 'AK-47', dmg: 17, rate: .11, speed: 1800, spread: .045, mag: 30, reserve: 120, reload: 1.5, pellets: 1, life: .6, len: 32, col: '#fff0b0', snd: 'ak', recoil: 0, shake: 2, range: 950, heavy: 3 },
  sniper: { name: 'Sniper', dmg: 95, rate: 1.25, speed: 3400, spread: .002, mag: 5, reserve: 20, reload: 2, pellets: 1, life: .55, len: 42, col: '#bff6ff', snd: 'sniper', recoil: 120, shake: 6, range: 1700, heavy: 3, head: 2 },
  minigun: { name: 'Minigun', dmg: 8, rate: .045, spin: .4, speed: 1700, spread: .12, mag: 150, reserve: 150, reload: 3, pellets: 1, life: .55, len: 34, col: '#ffd76b', snd: 'uzi', recoil: 0, shake: 1.6, range: 750, heavy: 4, slow: .7 },
  laser: { name: 'Laser Rifle', dmg: 26, rate: .22, speed: 1500, spread: .012, mag: 20, reserve: 40, reload: 1.6, pellets: 1, life: 1.1, len: 30, col: '#5ff7ff', snd: 'laser', recoil: 0, shake: 1.2, range: 1000, heavy: 3, type: 'laser' },
  flame: { name: 'Flamethrower', dmg: 4.5, rate: .035, speed: 620, spread: .17, mag: 120, reserve: 120, reload: 1.8, pellets: 1, life: .42, len: 30, col: '#ff8c2a', snd: 'flame', recoil: 0, shake: .4, range: 270, heavy: 2, type: 'flame' },
  gl: { name: 'Bomb Launcher', dmg: 90, rate: .8, speed: 820, spread: .02, mag: 4, reserve: 12, reload: 1.8, pellets: 1, life: 2, len: 26, col: '#fff', snd: 'gl', recoil: 90, shake: 2, range: 700, heavy: 4, type: 'gl' },
  rocket: { name: 'RPG', dmg: 110, rate: 1.15, speed: 820, spread: .01, mag: 1, reserve: 6, reload: 1.3, pellets: 1, life: 2.2, len: 34, col: '#fff', snd: 'rocket', recoil: 260, shake: 3, range: 1100, heavy: 4, type: 'rocket', radius: 150 }
};
const LOOT = ['uzi', 'magnum', 'm4', 'shotgun', 'ak47', 'sniper', 'minigun', 'laser', 'flame', 'gl', 'rocket', 'ak47', 'm4', 'shotgun'];
const START_GUNS = ['uzi', 'magnum', 'ak47', 'm4', 'shotgun'];

// ================= AVATAR =================
const AV_OPTS = {
  outfit: [['cyber', 'Cyber Armor'], ['mech', 'Mech Suit'], ['stealth', 'Neon Stealth'], ['tactical', 'Tactical'], ['hoodie', 'Hoodie'], ['commando', 'Commando'], ['ninja', 'Ninja'], ['agent', 'Agent']],
  head: [['cyberhelm', 'Cyber Helmet'], ['vhelm', 'Visor Helmet'], ['headset', 'Neon Headset'], ['neonhawk', 'Neon Mohawk'], ['helmet', 'Helmet'], ['cap', 'Backwards Cap'], ['beanie', 'Beanie'], ['bandana', 'Bandana'], ['mohawk', 'Mohawk'], ['pagdi', 'Turban'], ['cowboy', 'Cowboy'], ['none', 'Just Hair']],
  face: [['visor', 'LED Visor'], ['cybereye', 'Cyber Eye'], ['respirator', 'Respirator'], ['shades', 'Shades'], ['goggles', 'Goggles'], ['mask', 'Mask'], ['beard', 'Beard'], ['mooch', 'Mustache'], ['none', 'None']],
  jet: [['plasma', 'Plasma Pack'], ['hover', 'Hover Rig'], ['standard', 'Standard Jet'], ['twin', 'Twin Jet'], ['golden', 'Golden Jet']]
};
const AV_LABEL = { outfit: 'Outfit', head: 'Headgear', face: 'Face', jet: 'Jetpack' };
const COLORS = ['#3a86ff', '#e23d3d', '#8f6bff', '#2ec4b6', '#ff8c1a', '#e84393', '#7fc94a', '#f7d038', '#222831', '#eeeeee'];
const SKINS = ['#f2c79a', '#d9a066', '#a86b3c', '#6e4126'];
const playerAv = { name: 'Tiger', outfit: 'cyber', head: 'cyberhelm', face: 'none', jet: 'plasma', color: '#2ec4b6', skin: 1 };
function randomAv(name) {
  const fut = Math.random() < .75, P = (arr, n) => (fut ? arr.slice(0, n) : arr)[Math.floor(Math.random() * (fut ? n : arr.length))][0];
  return { name, outfit: P(AV_OPTS.outfit, 3), head: P(AV_OPTS.head, 4), face: P(AV_OPTS.face, 4), jet: P(AV_OPTS.jet, 2), color: pick(COLORS.slice(0, 8)), skin: Math.floor(Math.random() * 4) };
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) + amt, g = (n >> 8 & 255) + amt, b = (n & 255) + amt;
  return `rgb(${clamp(r, 0, 255)},${clamp(g, 0, 255)},${clamp(b, 0, 255)})`;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function drawGun(g, key) {
  g.fillStyle = '#2a2a30'; g.strokeStyle = OL; g.lineWidth = 1.2;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); };
  switch (key) {
    case 'pistol': R(0, -4, 16, 7, '#3a3a44'); R(2, 2, 5, 7, '#2a2a30'); break;
    case 'magnum': R(0, -4, 22, 6, '#b8bcc8'); R(4, -5, 8, 9, '#8a8e9a'); R(2, 3, 5, 8, '#5a3a22'); break;
    case 'uzi': R(0, -4, 20, 8, '#2a2a30'); R(6, 3, 5, 10, '#2a2a30'); R(18, -2, 6, 3, '#555'); break;
    case 'm4': R(-9, -3, 12, 7, '#2e2e36'); R(3, -4, 26, 7, '#3d3f48'); R(28, -2, 8, 3, '#2a2a30'); R(10, -8, 10, 4, '#1a1a1e'); R(12, 3, 5, 9, '#2a2a30'); break;
    case 'shotgun': R(-8, -3, 12, 8, '#7a4a24'); R(4, -4, 26, 6, '#2a2a30'); R(8, 2, 14, 4, '#4a4a50'); break;
    case 'ak47': R(-8, -3, 12, 8, '#8a5a2b'); R(4, -4, 24, 7, '#2a2a30'); R(26, -2, 10, 3, '#2a2a30');
      g.save(); g.translate(14, 3); g.rotate(.3); R(0, 0, 5, 11, '#2a2a30'); g.restore(); break;
    case 'sniper': R(-8, -3, 14, 7, '#3d4a3a'); R(4, -3, 40, 5, '#2a2a30'); R(10, -9, 14, 5, '#111'); g.fillStyle = '#6ef'; g.fillRect(23, -8, 2, 3); break;
    case 'minigun': R(-6, -7, 16, 14, '#5a5d68'); R(8, -6, 28, 3, '#2a2a30'); R(8, -2, 28, 3, '#3a3a44'); R(8, 2, 28, 3, '#2a2a30'); R(30, -7, 4, 13, '#777'); R(-2, 6, 6, 6, '#c9a227'); break;
    case 'laser': R(-6, -4, 12, 8, '#e8e8f0'); R(6, -5, 22, 9, '#d0d4e0'); g.fillStyle = '#5ff7ff'; g.fillRect(9, -2, 16, 3); R(26, -3, 6, 5, '#8899aa'); R(8, 4, 5, 7, '#555'); break;
    case 'flame': R(-6, -9, 12, 9, '#d9541e'); R(0, -3, 30, 6, '#2a2a30'); R(28, -4, 6, 8, '#888'); break;
    case 'gl': R(-8, -3, 12, 8, '#5a4a2a'); R(4, -6, 22, 11, '#4a5a3a'); R(24, -5, 4, 9, '#2a2a30'); R(10, 5, 5, 7, '#2a2a30'); break;
    case 'rocket': R(-10, -6, 42, 11, '#4b5a2a'); R(4, 4, 5, 8, '#2a2a30'); g.fillStyle = '#c33'; g.beginPath(); g.moveTo(32, -6); g.lineTo(42, -.5); g.lineTo(32, 5); g.fill(); break;
  }
}

// st: {facing, aim, walk, air, flying, crouch, hurt, gun, melee}
function drawAvatar(g, av, st, colorOverride) {
  const f = st.facing, S = colorOverride || av.color, skin = SKINS[av.skin] || SKINS[0];
  const o = st.crouch ? 10 : 0; const hurt = st.hurt;
  g.lineJoin = 'round'; g.lineCap = 'round';
  const FUT = av.outfit === 'cyber' || av.outfit === 'mech' || av.outfit === 'stealth';
  const dark = av.outfit === 'ninja' || av.outfit === 'agent' || FUT;
  const ARM = av.outfit === 'mech' ? '#3a3f4f' : av.outfit === 'stealth' ? '#14141c' : '#232736';
  const sleeve = FUT ? ARM : dark ? '#1d1d26' : av.outfit === 'commando' ? shade(S, -25) : S;
  const pants = FUT ? ARM : av.outfit === 'tactical' ? '#3d4250' : av.outfit === 'hoodie' ? '#2f3b5a' : av.outfit === 'commando' ? '#4b5a3a' : '#15151c';
  const NEON = shade(S, 60);
  const glow = (fn, blur = 8) => { if (hurt) return; g.save(); g.shadowColor = S; g.shadowBlur = blur; fn(); g.restore(); };
  // scarf tail (ninja)
  if (av.outfit === 'ninja') { g.strokeStyle = S; g.lineWidth = 4; g.beginPath(); g.moveTo(-f * 4, -40 + o); g.quadraticCurveTo(-f * 16, -38 + o + Math.sin(st.walk * 2) * 3, -f * 24, -30 + o + Math.sin(st.walk * 3) * 4); g.stroke(); }
  // jetpack
  const jx = -f * 13;
  if (av.jet === 'plasma') {
    g.fillStyle = '#2a2e3c'; rr(g, jx - 8, -46 + o, 16, 27, 6); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
    glow(() => { g.fillStyle = NEON; rr(g, jx - 2.5, -42 + o, 5, 17, 2.5); g.fill(); }, 10);
    g.fillStyle = '#474d60'; g.beginPath(); g.moveTo(jx - 7, -19 + o); g.lineTo(jx + 7, -19 + o); g.lineTo(jx + 4, -15 + o); g.lineTo(jx - 4, -15 + o); g.closePath(); g.fill(); g.stroke();
  } else if (av.jet === 'hover') {
    g.fillStyle = '#2a2e3c'; rr(g, jx - 6, -45 + o, 12, 22, 4); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
    for (const d of [-1, 1]) { g.fillStyle = '#3d4356'; g.beginPath(); g.moveTo(jx, -40 + o); g.lineTo(jx + d * 13, -50 + o); g.lineTo(jx + d * 15, -44 + o); g.lineTo(jx + d * 4, -32 + o); g.closePath(); g.fill(); g.stroke(); glow(() => { g.strokeStyle = NEON; g.lineWidth = 1.6; g.beginPath(); g.moveTo(jx + d * 3, -38 + o); g.lineTo(jx + d * 13, -47 + o); g.stroke(); }); }
    glow(() => { g.fillStyle = NEON; g.beginPath(); g.arc(jx, -34 + o, 3, 0, 6.28); g.fill(); }, 10);
  } else if (av.jet === 'twin') {
    for (const dx of [-4, 4]) { g.fillStyle = '#c0392b'; rr(g, jx + dx - 4, -44 + o, 8, 24, 4); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); g.fillStyle = '#555'; g.fillRect(jx + dx - 3, -20 + o, 6, 4); }
  } else {
    g.fillStyle = av.jet === 'golden' ? '#f2b630' : '#6b6f78'; rr(g, jx - 7, -44 + o, 14, 25, 4); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke();
    g.fillStyle = av.jet === 'golden' ? '#fff1a8' : '#9aa0aa'; g.fillRect(jx - 4, -41 + o, 3, 18);
    g.fillStyle = '#444'; g.fillRect(jx - 4, -19 + o, 8, 4);
  }
  // legs
  const ph = st.walk, air = st.air;
  const legs = st.crouch ? [[.9, .9], [-.4, -.4]] : air ? [[.5, -.4], [-.2, -.6]] : [[Math.sin(ph) * .7, 0], [-Math.sin(ph) * .7, 0]];
  for (const [a] of legs) {
    const hipY = -20 + o, kx = Math.sin(a) * 9 * f, ky = st.crouch ? -12 : -9, fx = st.crouch ? kx - 6 * f * Math.sign(a || 1) : kx + (air ? -4 * f : Math.sin(a) * 4 * f);
    g.strokeStyle = OL; g.lineWidth = 9; g.beginPath(); g.moveTo(0, hipY); g.lineTo(kx, ky); g.lineTo(fx, -2); g.stroke();
    g.strokeStyle = hurt ? '#fff' : pants; g.lineWidth = 6; g.beginPath(); g.moveTo(0, hipY); g.lineTo(kx, ky); g.lineTo(fx, -2); g.stroke();
    g.fillStyle = FUT ? '#3a4054' : '#1e1e24'; rr(g, fx - 5 + f * 1, -5, 11, 5, 2); g.fill();
    if (FUT) { glow(() => { g.strokeStyle = NEON; g.lineWidth = 1.4; g.beginPath(); g.moveTo(kx * .3, hipY + 4); g.lineTo(kx, ky); g.stroke(); g.fillStyle = NEON; g.fillRect(fx - 4 + f, -2.5, 8, 1.5); }, 6); }
  }
  // torso
  g.fillStyle = hurt ? '#fff' : (FUT ? ARM : dark ? '#1d1d26' : av.outfit === 'commando' ? shade(S, -25) : S);
  rr(g, -11, -44 + o, 22, 26, 7); g.fill();
  g.save(); rr(g, -11, -44 + o, 22, 26, 7); g.clip();
  if (!hurt) {
    if (av.outfit === 'cyber') {
      g.fillStyle = '#323849'; g.beginPath(); g.moveTo(-9, -42 + o); g.lineTo(9, -42 + o); g.lineTo(7, -30 + o); g.lineTo(0, -26 + o); g.lineTo(-7, -30 + o); g.closePath(); g.fill();
      glow(() => { g.strokeStyle = NEON; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-8, -41 + o); g.lineTo(-5, -31 + o); g.lineTo(0, -28 + o); g.lineTo(5, -31 + o); g.lineTo(8, -41 + o); g.stroke(); g.fillStyle = NEON; g.beginPath(); g.arc(0, -36 + o, 2.3, 0, 6.28); g.fill(); });
    } else if (av.outfit === 'mech') {
      g.fillStyle = '#545b70'; g.fillRect(-11, -44 + o, 22, 9); g.fillStyle = '#2b2f3c'; g.fillRect(-11, -35 + o, 22, 2);
      g.fillStyle = S; g.fillRect(-9, -32 + o, 7, 6); g.fillRect(2, -32 + o, 7, 6);
      glow(() => { g.fillStyle = NEON; g.fillRect(-6, -42 + o, 12, 2.5); });
    } else if (av.outfit === 'stealth') {
      glow(() => { g.strokeStyle = NEON; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-11, -40 + o); g.lineTo(-2, -32 + o); g.lineTo(-2, -20 + o); g.moveTo(11, -40 + o); g.lineTo(2, -32 + o); g.lineTo(2, -20 + o); g.stroke(); });
    } else if (av.outfit === 'tactical') { g.fillStyle = '#2b2f38'; g.fillRect(-9, -42 + o, 18, 17); g.fillStyle = shade(S, -30); g.fillRect(-7, -32 + o, 6, 5); g.fillRect(1, -32 + o, 6, 5); g.fillStyle = '#c9a227'; g.fillRect(-1, -40 + o, 2, 6); }
    else if (av.outfit === 'hoodie') { g.fillStyle = shade(S, -35); g.fillRect(-7, -28 + o, 14, 6); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-2, -42 + o); g.lineTo(-2, -35 + o); g.moveTo(2, -42 + o); g.lineTo(2, -35 + o); g.stroke(); }
    else if (av.outfit === 'commando') { g.fillStyle = shade(S, 10); for (const [x, y] of [[-6, -38], [4, -34], [-2, -27], [6, -42]]) { g.beginPath(); g.arc(x, y + o, 4, 0, 6.28); g.fill(); } g.fillStyle = '#3d3a24'; for (const [x, y] of [[2, -40], [-7, -30], [5, -26]]) { g.beginPath(); g.arc(x, y + o, 3.5, 0, 6.28); g.fill(); }
      g.strokeStyle = '#6b4b2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-10, -44 + o); g.lineTo(10, -20 + o); g.stroke(); g.fillStyle = '#e8c547'; for (let i = 0; i < 4; i++) g.fillRect(-7 + i * 5, -40 + o + i * 6, 2, 3); }
    else if (av.outfit === 'ninja') { g.fillStyle = S; g.fillRect(-11, -25 + o, 22, 4); }
    else if (av.outfit === 'agent') { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(-5, -44 + o); g.lineTo(5, -44 + o); g.lineTo(0, -30 + o); g.fill(); g.fillStyle = S; g.beginPath(); g.moveTo(-1.5, -42 + o); g.lineTo(1.5, -42 + o); g.lineTo(2.5, -31 + o); g.lineTo(0, -28 + o); g.lineTo(-2.5, -31 + o); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-11, -22 + o, 22, 4);
  }
  g.restore();
  g.strokeStyle = OL; g.lineWidth = 2.2; rr(g, -11, -44 + o, 22, 26, 7); g.stroke();
  if (av.outfit === 'mech' && !hurt) { g.fillStyle = '#5d6479'; g.beginPath(); g.ellipse(f * 2, -42 + o, 10, 6, 0, Math.PI, 0); g.closePath(); g.fill(); g.strokeStyle = OL; g.lineWidth = 2; g.stroke(); }
  // hood behind head
  if (av.outfit === 'hoodie' && av.head === 'none') { g.fillStyle = shade(S, -25); g.beginPath(); g.arc(-f * 3, -51 + o, 13, 0, 6.28); g.fill(); g.stroke(); }
  // head
  const hy = -52 + o;
  g.fillStyle = hurt ? '#fff' : skin; g.beginPath(); g.arc(0, hy, 11.5, 0, 6.28); g.fill(); g.strokeStyle = OL; g.lineWidth = 2.2; g.stroke();
  // eye
  const ex = f * 5;
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, hy - 1, 3, 3.5, 0, 0, 6.28); g.fill();
  g.fillStyle = OL; g.beginPath(); g.arc(ex + Math.cos(st.aim) * 1.3, hy - 1 + Math.sin(st.aim) * 1.3, 1.7, 0, 6.28); g.fill();
  g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(ex - 3.5 * f, hy - 6); g.lineTo(ex + 3.5 * f, hy - 5); g.stroke();
  // face accessory
  switch (av.face) {
    case 'shades': g.fillStyle = '#111'; rr(g, ex - 5, hy - 4.5, 10, 5.5, 2); g.fill(); g.fillRect(-f * 9, hy - 3.5, f * 10, 1.6); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(ex - 3, hy - 3.5, 3, 1.4); break;
    case 'goggles': g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-11, hy - 2); g.lineTo(11, hy - 2); g.stroke(); g.fillStyle = '#ff9f1c'; g.beginPath(); g.arc(ex, hy - 1.5, 4.5, 0, 6.28); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.8; g.stroke(); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(ex - 2, hy - 4, 2, 2); break;
    case 'mask': g.fillStyle = av.outfit === 'ninja' ? '#1d1d26' : shade(S, -45); g.beginPath(); g.moveTo(-11, hy + 1); g.lineTo(11, hy + 1); g.lineTo(f * 10, hy + 8); g.lineTo(f * 2, hy + 12); g.lineTo(-f * 8, hy + 8); g.closePath(); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.5; g.stroke(); break;
    case 'visor': glow(() => { g.fillStyle = NEON; rr(g, -f * 4 - 5, hy - 4.5, 15, 4.5, 2); g.fill(); }, 10); g.fillStyle = '#fff'; g.fillRect(ex - 1, hy - 3.6, 3, 1.2); break;
    case 'cybereye': g.fillStyle = '#7d8598'; g.beginPath(); g.arc(ex, hy - 1, 5, 0, 6.28); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = '#7d8598'; g.lineWidth = 2; g.beginPath(); g.moveTo(ex - 4 * f, hy + 3); g.lineTo(ex - 9 * f, hy + 6); g.stroke(); g.save(); g.shadowColor = '#ff2b4d'; g.shadowBlur = 8; g.fillStyle = '#ff2b4d'; g.beginPath(); g.arc(ex, hy - 1, 2.4, 0, 6.28); g.fill(); g.restore(); break;
    case 'respirator': g.fillStyle = '#2f3444'; rr(g, -f * 2 - 6, hy + 1, 15, 9, 4); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke(); g.fillStyle = '#5b6276'; g.beginPath(); g.arc(f * 6, hy + 6, 3, 0, 6.28); g.fill(); glow(() => { g.fillStyle = NEON; g.fillRect(-f * 3 - 2, hy + 4, 4, 1.6); g.fillRect(-f * 3 - 2, hy + 7, 4, 1.6); }); break;
    case 'beard': g.fillStyle = '#2b1d14'; g.beginPath(); g.arc(f * 1, hy + 3, 10, .1 * Math.PI, .9 * Math.PI); g.fill(); break;
    case 'mooch': g.strokeStyle = '#1a120c'; g.lineWidth = 3; g.beginPath(); g.moveTo(f * 1, hy + 5); g.quadraticCurveTo(f * 6, hy + 3, f * 10, hy + 7); g.stroke(); break;
  }
  // headgear
  g.strokeStyle = OL; g.lineWidth = 2.2;
  const H = shade(S, -30);
  switch (av.head) {
    case 'cyberhelm':
      g.fillStyle = '#2b3042'; g.beginPath(); g.arc(0, hy - 1, 14, 0, 6.28); g.fill(); g.stroke();
      g.fillStyle = '#3c4258'; g.beginPath(); g.arc(-f * 2, hy - 5, 11, Math.PI * 1.1, Math.PI * 1.9); g.lineTo(-f * 2, hy - 5); g.fill();
      glow(() => { g.fillStyle = NEON; g.beginPath(); g.moveTo(f * 14, hy - 6); g.lineTo(f * 1, hy - 7); g.lineTo(-f * 2, hy - 1); g.lineTo(f * 13, hy + 2); g.closePath(); g.fill(); }, 12);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(f > 0 ? 5 : -9, hy - 5, 4, 1.6);
      glow(() => { g.strokeStyle = NEON; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-f * 12, hy + 3); g.lineTo(-f * 6, hy + 9); g.stroke(); });
      g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.moveTo(-f * 10, hy - 11); g.lineTo(-f * 14, hy - 20); g.stroke(); glow(() => { g.fillStyle = NEON; g.beginPath(); g.arc(-f * 14, hy - 21, 2, 0, 6.28); g.fill(); });
      break;
    case 'vhelm':
      g.fillStyle = '#d9dde8'; g.beginPath(); g.arc(0, hy - 2, 13.5, Math.PI, 0); g.lineTo(13.5, hy + 3); g.lineTo(-13.5, hy + 3); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = S; g.fillRect(-2, hy - 15, 4, 10);
      glow(() => { g.fillStyle = 'rgba(20,24,40,.95)'; rr(g, f > 0 ? -2 : -13, hy - 6, 15, 7, 3); g.fill(); g.fillStyle = NEON; g.fillRect(f > 0 ? 0 : -11, hy - 3.5, 11, 1.8); }, 10);
      break;
    case 'headset':
      g.fillStyle = '#1e1e26'; g.beginPath(); g.arc(0, hy - 2, 12, Math.PI * 1.05, -0.05); g.lineTo(-f * 12, hy + 2); g.fill();
      g.strokeStyle = '#2b3042'; g.lineWidth = 3.5; g.beginPath(); g.arc(0, hy - 1, 13, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.fillStyle = '#2b3042'; g.beginPath(); g.arc(-f * 6, hy, 5, 0, 6.28); g.fill(); g.strokeStyle = OL; g.lineWidth = 1.8; g.stroke();
      glow(() => { g.strokeStyle = NEON; g.lineWidth = 2; g.beginPath(); g.arc(-f * 6, hy, 2.8, 0, 6.28); g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(-f * 5, hy + 4); g.quadraticCurveTo(f * 3, hy + 10, f * 8, hy + 7); g.stroke(); }, 10);
      break;
    case 'neonhawk':
      g.fillStyle = '#1e1e26'; g.beginPath(); g.arc(0, hy - 2, 12, Math.PI * 1.05, -0.05); g.lineTo(-f * 12, hy + 2); g.fill();
      glow(() => { g.fillStyle = NEON; g.beginPath(); for (let i = 0; i < 5; i++) { const x = -8 + i * 4; g.moveTo(x - 2.5, hy - 10); g.lineTo(x + f * 3, hy - 23 + Math.abs(i - 2) * 2); g.lineTo(x + 2.5, hy - 10); } g.fill(); }, 12);
      break;
    case 'helmet': g.fillStyle = av.outfit === 'commando' ? '#4b5a3a' : H; g.beginPath(); g.arc(0, hy - 2, 13, Math.PI, 0); g.lineTo(13, hy + 1); g.lineTo(-13, hy + 1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = 'rgba(120,220,255,.75)'; rr(g, f > 0 ? 2 : -12, hy - 8, 10, 4, 2); g.fill(); break;
    case 'cap': g.fillStyle = S; g.beginPath(); g.arc(0, hy - 3, 12, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = shade(S, -40); rr(g, f > 0 ? -20 : 8, hy - 5, 12, 4, 2); g.fill(); g.stroke(); break;
    case 'beanie': g.fillStyle = S; g.beginPath(); g.arc(0, hy - 3, 12.5, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.fillStyle = shade(S, -35); g.fillRect(-12.5, hy - 5, 25, 5); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, hy - 16, 4, 0, 6.28); g.fill(); g.stroke(); break;
    case 'bandana': g.fillStyle = S; g.fillRect(-12, hy - 8, 24, 6); g.strokeRect(-12, hy - 8, 24, 6); g.beginPath(); g.moveTo(-f * 12, hy - 6); g.lineTo(-f * 20, hy - 2 + Math.sin(st.walk * 3) * 2); g.lineTo(-f * 19, hy + 3); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#2b1d14'; g.beginPath(); g.arc(0, hy - 9, 11, Math.PI * 1.05, -0.05); g.fill(); break;
    case 'mohawk': g.fillStyle = S; g.beginPath(); for (let i = 0; i < 5; i++) { const x = -8 + i * 4; g.moveTo(x - 2.5, hy - 9); g.lineTo(x + f * 2, hy - 21 + Math.abs(i - 2) * 2); g.lineTo(x + 2.5, hy - 9); } g.fill(); g.stroke(); break;
    case 'pagdi': g.fillStyle = S; g.beginPath(); g.ellipse(0, hy - 8, 14, 9, 0, Math.PI, 0); g.lineTo(13, hy - 3); g.lineTo(-13, hy - 3); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = shade(S, -40); g.lineWidth = 1.5; g.beginPath(); g.moveTo(-12, hy - 6); g.quadraticCurveTo(0, hy - 13, 12, hy - 8); g.moveTo(-10, hy - 11); g.quadraticCurveTo(0, hy - 17, 9, hy - 13); g.stroke(); g.fillStyle = '#ffd34d'; g.beginPath(); g.arc(f * 6, hy - 9, 2.4, 0, 6.28); g.fill(); break;
    case 'cowboy': g.fillStyle = '#7a4e2a'; rr(g, -19, hy - 8, 38, 4, 2); g.fill(); g.stroke(); rr(g, -9, hy - 19, 18, 12, 4); g.fill(); g.stroke(); g.fillStyle = S; g.fillRect(-9, hy - 10, 18, 3); break;
    default: g.fillStyle = '#2b1d14'; g.beginPath(); g.arc(0, hy - 2, 12, Math.PI * 1.05, -0.05); g.lineTo(-f * 12, hy + 2); g.fill(); break;
  }
  // arm + gun
  g.save(); g.translate(0, -34 + o); g.rotate(st.aim); if (f < 0) g.scale(1, -1);
  g.strokeStyle = OL; g.lineWidth = 8.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(12, 2); g.stroke();
  g.strokeStyle = hurt ? '#fff' : sleeve; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(12, 2); g.stroke();
  if (FUT) glow(() => { g.strokeStyle = NEON; g.lineWidth = 2; g.beginPath(); g.moveTo(6, -2.6); g.lineTo(6, 4.6); g.stroke(); }, 6);
  g.translate(10, 0);
  if (st.melee > 0) {
    const a = (1 - st.melee) * 2.4 - 1.2; g.save(); g.rotate(a); g.fillStyle = '#ddd'; g.beginPath(); g.moveTo(4, -2); g.lineTo(26, 0); g.lineTo(4, 3); g.fill(); g.stroke(); g.fillStyle = '#5a3a22'; g.fillRect(-3, -2, 7, 5); g.restore();
  } else drawGun(g, st.gun || 'pistol');
  g.fillStyle = '#22222a'; g.beginPath(); g.arc(3, 3, 3.8, 0, 6.28); g.fill();
  if (WEAPONS[st.gun] && WEAPONS[st.gun].len > 24 && !(st.melee > 0)) { g.beginPath(); g.arc(16, 3, 3.5, 0, 6.28); g.fill(); }
  g.restore();
}

// ================= AUDIO =================
const Audio = {
  ctx: null, master: null, muted: false, jetGain: null, musicGain: null, noiseBuf: null, nextBeat: 0, step: 0,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    try { const AC = window.AudioContext || window.webkitAudioContext; this.ctx = new AC(); } catch (e) { return; }
    const c = this.ctx;
    this.master = c.createGain(); this.master.gain.value = .55; this.master.connect(c.destination);
    const len = c.sampleRate * 1.5; this.noiseBuf = c.createBuffer(1, len, c.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = .8;
    this.jetGain = c.createGain(); this.jetGain.gain.value = 0;
    src.connect(f).connect(this.jetGain).connect(this.master); src.start();
    this.musicGain = c.createGain(); this.musicGain.gain.value = .2; this.musicGain.connect(this.master);
    this.nextBeat = c.currentTime + .1;
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : .55; },
  noise(dur, freq, q, vol, type = 'lowpass', when = 0, dest) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    s.connect(f).connect(g).connect(dest || this.master); s.start(t, Math.random()); s.stop(t + dur + .05);
  },
  tone(freq, dur, type, vol, slide = 0, dest, when = 0) {
    if (!this.ctx) return; const c = this.ctx, t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(dest || this.master); o.start(t); o.stop(t + dur + .05);
  },
  shot(kind, vol = 1) {
    if (!this.ctx || vol < .03) return;
    switch (kind) {
      case 'pistol': this.noise(.12, 2400, 1, .5 * vol); this.tone(320, .08, 'square', .12 * vol, .3); break;
      case 'magnum': this.noise(.25, 1500, .8, .75 * vol); this.tone(140, .2, 'square', .2 * vol, .3); break;
      case 'uzi': this.noise(.07, 3000, 1, .35 * vol); this.tone(420, .05, 'square', .08 * vol, .4); break;
      case 'm4': this.noise(.1, 2200, 1, .45 * vol); this.tone(240, .07, 'sawtooth', .1 * vol, .3); break;
      case 'ak': this.noise(.13, 1800, 1, .5 * vol); this.tone(180, .1, 'sawtooth', .14 * vol, .3); break;
      case 'shotgun': this.noise(.35, 1100, .7, .8 * vol); this.tone(90, .25, 'sine', .4 * vol, .4); break;
      case 'sniper': this.noise(.5, 2600, .6, .7 * vol); this.tone(1400, .3, 'sawtooth', .12 * vol, .08); break;
      case 'laser': this.tone(1800, .16, 'sawtooth', .12 * vol, .2); this.tone(900, .12, 'sine', .15 * vol, .4); break;
      case 'gl': this.noise(.18, 500, .8, .5 * vol); this.tone(160, .15, 'sine', .4 * vol, .5); break;
      case 'rocket': this.noise(.6, 600, .8, .5 * vol); this.tone(200, .4, 'sawtooth', .15 * vol, 2.5); break;
      case 'flame': this.noise(.1, 500, .5, .12 * vol, 'bandpass'); break;
    }
  },
  boom(vol = 1) { if (!this.ctx) return; this.noise(1.1, 400, .6, 1 * vol); this.tone(70, .8, 'sine', .7 * vol, .3); },
  hit() { this.tone(900, .05, 'square', .08); },
  slash() { this.noise(.15, 3500, 2, .3, 'bandpass'); },
  pickup() { this.tone(660, .08, 'square', .12); this.tone(990, .12, 'square', .1, 0, null, .07); },
  die() { this.tone(300, .4, 'sawtooth', .18, .2); },
  click() { this.tone(1200, .03, 'square', .06); },
  setJet(on) { if (!this.jetGain) return; this.jetGain.gain.setTargetAtTime(on && !this.muted ? .12 : 0, this.ctx.currentTime, .05); },
  music() {
    if (!this.ctx || this.muted) return; const c = this.ctx;
    const spb = 60 / 128 / 2;
    const bass = [55, 55, 65.4, 55, 73.4, 55, 65.4, 49];
    const lead = [440, 0, 523, 0, 587, 523, 440, 0, 392, 0, 440, 0, 523, 0, 0, 0];
    while (this.nextBeat < c.currentTime + .2) {
      const w = this.nextBeat - c.currentTime, s = this.step;
      if (s % 4 === 0) this.tone(110, .18, 'sine', .9, .35, this.musicGain, w);
      if (s % 4 === 2) this.noise(.08, 5000, .5, .25, 'highpass', w, this.musicGain);
      if (s % 8 === 4) this.noise(.16, 1800, .9, .4, 'highpass', w, this.musicGain);
      this.tone(bass[Math.floor(s / 2) % 8] * (s % 2 ? 2 : 1), spb * .9, 'triangle', .45, 0, this.musicGain, w);
      const l = lead[s % 16]; if (l && (Math.floor(s / 16) % 2 === 1)) this.tone(l, spb * 1.4, 'square', .07, 0, this.musicGain, w);
      this.nextBeat += spb; this.step++;
    }
  }
};

// ================= STATE =================
const DIFF = {
  easy: { err: .2, turn: 4, react: .7, burst: .6, pause: .8, gren: .05, dodge: .1, crouch: 0 },
  med: { err: .1, turn: 8, react: .38, burst: 1, pause: .45, gren: .12, dodge: .3, crouch: .2 },
  hard: { err: .04, turn: 15, react: .18, burst: 1.6, pause: .2, gren: .2, dodge: .6, crouch: .4 }
};
const BOT_NAMES = ['Viper', 'Ghost', 'Blaze', 'Rex', 'Nova', 'Bolt', 'Rocco', 'Spike', 'Echo', 'Fang', 'Havoc', 'Jinx'];
const TEAM_COL = { A: '#3a86ff', B: '#e23d3d' }, TEAM_NAME = { A: 'TIGERS', B: 'HAWKS' };
const settings = { mode: 'ffa', bots: 5, diff: 'med', map: 'desert' };
const ZOOMS = [[1, '1X'], [.8, '2X'], [.64, '3X']];
let zoomIdx = 0;
let G = null, state = 'menu';
let chars = [], bullets = [], grenades = [], particles = [], items = [], floaters = [], feed = [];
let cam = { x: 1800, y: 1200, shake: 0 };
let announce = { text: '', t: 0, sub: '' };
let slowT = 0, uid = 1, feedDirty = true;
const STAND_H = 54, CROUCH_H = 42;

function makeChar(av, isPlayer, team, color) {
  return {
    id: uid++, name: av.name, av, isPlayer, team, color, x: 0, y: 0, vx: 0, vy: 0, w: 26, h: STAND_H, hp: 100, alive: false,
    onGround: false, fuel: 100, flying: false, aim: 0, facing: 1, weapons: [], cur: 0, cd: 0, reloadT: 0, grenades: 3, gcd: 0, mcd: 0, meleeT: 0,
    respawnT: 0, shield: 0, kills: 0, deaths: 0, streak: 0, multi: 0, multiT: 0, walk: 0, hurtT: 0, upPrev: false, burn: 0, burnBy: null,
    crouch: false, spin: 0, burstN: 0, burstT: 0, ult: 0, regenT: 0,
    ai: isPlayer ? null : { target: null, retarget: 0, goal: null, goalT: 0, burstT: 0, pauseT: 0, stuckT: 0, lastX: 0, lastY: 0, react: 0, side: Math.random() < .5 ? -1 : 1, hover: 0, crouchT: 0 }
  };
}
function suitColor(c) { return G && G.mode === 'team' ? TEAM_COL[c.team] : c.av.color; }
function spawnChar(c) {
  let best = SPAWNS[0], bestScore = -1;
  for (let i = 0; i < 10; i++) {
    const s = pick(SPAWNS); let md = 99999;
    for (const o of chars) if (o !== c && o.alive && !(G.mode === 'team' && o.team === c.team)) md = Math.min(md, Math.hypot(o.x - s[0], o.y - s[1]));
    if (md > bestScore) { bestScore = md; best = s; }
  }
  c.x = best[0] + rand(-15, 15); c.y = best[1] - 5; c.vx = 0; c.vy = 0; c.hp = 100; c.alive = true; c.fuel = 100; c.h = STAND_H; c.crouch = false;
  const k = pick(START_GUNS);
  c.weapons = [{ key: 'pistol', mag: 12, reserve: Infinity }, { key: k, mag: WEAPONS[k].mag, reserve: WEAPONS[k].reserve }]; c.cur = 1;
  c.grenades = 3; c.reloadT = 0; c.cd = .3; c.shield = 2; c.streak = 0; c.burn = 0; c.spin = 0; c.burstN = 0; c.ult = 0; c.regenT = 0;
  if (c.isPlayer) { G.deathInfo = null; }
}
function newGame(isAttract) {
  uid = 1;
  // Drop stale remote character references when returning to the menu or
  // starting a rematch; the next state packet will recreate each proxy.
  if (typeof jjRemotePlayers !== 'undefined') jjRemotePlayers.clear();
  loadMap(isAttract ? pick(Object.keys(MAPS)) : settings.map);
  G = { mode: isAttract ? 'ffa' : settings.mode, diff: isAttract ? 'med' : settings.diff, attract: !!isAttract, time: 300, limit: settings.mode === 'team' ? 30 : 20, over: false, teamScore: { A: 0, B: 0 }, elapsed: 0, nearItem: null, deathInfo: null, appleT: 18 };
  if (isAttract) G.limit = 9999;
  chars = []; bullets = []; grenades = []; particles = []; items = []; floaters = []; feed = []; feedDirty = true;
  const nb = isAttract ? 6 : settings.bots;
  const names = BOT_NAMES.slice().sort(() => Math.random() - .5);
  if (!isAttract) { const p = makeChar(playerAv, true, (window.JetpackLanLobby && window.JetpackLanLobby.isConnected() && G.mode === 'team') ? jjTeamForId(jjNetId) : 'A'); chars.push(p); G.player = p; } else G.player = null;
  const actualBots = (!isAttract && window.JetpackLanLobby && window.JetpackLanLobby.isConnected()) ? 0 : nb;
  for (let i = 0; i < actualBots; i++) {
    const team = G.mode === 'team' ? (i < Math.floor(nb / 2) ? 'A' : 'B') : 'bot' + i;
    const av = randomAv(names[i]);
    chars.push(makeChar(av, false, team));
  }
  for (const c of chars) { c.color = suitColor(c); spawnChar(c); }
  ITEM_SPOTS.forEach(s => {
    const r = Math.random(); const kind = r < .64 ? 'weapon' : r < .84 ? 'health' : 'grenade';
    items.push({ x: s[0], y: s[1] - 18, kind, weapon: kind === 'weapon' ? pick(LOOT) : null, active: true, respawn: 0, spot: true, bob: Math.random() * 6, life: Infinity });
  });
  const f = G.player || chars[0]; cam.x = f.x; cam.y = f.y;
}

// ================= INPUT =================
const keys = {}; const mouse = { x: 0, y: 0, down: false, right: false };
let wheelSwap = 0, pressQueue = [];
window.addEventListener('keydown', e => {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'tab'].includes(k)) e.preventDefault();
  if (!keys[k]) pressQueue.push(k);
  keys[k] = true;
  if (k === 'm') Audio.setMuted(!Audio.muted);
  if (k === 'z' && state === 'play') cycleZoom();
  if ((k === 'escape' || k === 'p') && (state === 'play' || state === 'paused')) togglePause();
  if (k === 'tab' && state === 'play') showScore(true);
});
window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys[k] = false; if (k === 'tab') showScore(false); });
cv.addEventListener('mousemove', e => { const p = toGame(e.clientX, e.clientY); mouse.x = p.x; mouse.y = p.y; });
cv.addEventListener('mousedown', e => { Audio.init(); if (e.button === 2) mouse.right = true; else mouse.down = true; });
window.addEventListener('mouseup', e => { if (e.button === 2) mouse.right = false; else mouse.down = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { wheelSwap += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

const touch = { L: { x: 0, y: 0, id: null }, R: { x: 0, y: 0, id: null }, gren: false, swap: false, reload: false, pick: false, melee: false, crouch: false, used: false };
function setupStick(el, s) {
  const knob = el.querySelector('.knob');
  const upd = (cx, cy) => {
    const r = el.getBoundingClientRect(); const sdx = cx - (r.left + r.width / 2), sdy = cy - (r.top + r.height / 2);
    let dx = ROT ? sdy : sdx, dy = ROT ? -sdx : sdy;
    const max = (ROT ? r.height : r.width) / 2, m = Math.hypot(dx, dy); if (m > max) { dx *= max / m; dy *= max / m; }
    s.x = dx / max; s.y = dy / max; knob.style.transform = `translate(${dx}px,${dy}px)`;
    if (s === touch.R) knob.classList.toggle('active', Math.hypot(s.x, s.y) > .55);
  };
  el.addEventListener('pointerdown', e => { Audio.init(); touch.used = true; s.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (_) { } upd(e.clientX, e.clientY); e.preventDefault(); });
  el.addEventListener('pointermove', e => { if (e.pointerId === s.id) upd(e.clientX, e.clientY); });
  const end = e => { if (e.pointerId === s.id) { s.id = null; s.x = 0; s.y = 0; knob.style.transform = ''; knob.classList.remove('active'); } };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
}
setupStick($('stickL'), touch.L); setupStick($('stickR'), touch.R);
const tb = (id, f) => $(id).addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Audio.init(); touch.used = true; f(); });
tb('tGren', () => touch.gren = true); tb('tSwap', () => touch.swap = true); tb('tReload', () => touch.reload = true);
tb('tPick', () => touch.pick = true); tb('tMelee', () => touch.melee = true);
tb('tCrouch', () => { touch.crouch = !touch.crouch; $('tCrouch').classList.toggle('on', touch.crouch); });
$('pickPrompt').addEventListener('pointerdown', e => { e.preventDefault(); touch.pick = true; });
$('pauseBtn').addEventListener('click', () => togglePause());
$('zoomBtn').addEventListener('click', () => cycleZoom());
$('scoreBtn').addEventListener('click', () => showScore(!scoreOpen));
$('scoreClose').addEventListener('click', () => showScore(false));
function cycleZoom() { zoomIdx = (zoomIdx + 1) % ZOOMS.length; $('zoomTxt').textContent = ZOOMS[zoomIdx][1]; Audio.click(); }

function viewScale() {
  let z = ZOOMS[zoomIdx][0];
  const p = G && G.player; if (p && p.alive && p.weapons[p.cur] && p.weapons[p.cur].key === 'sniper') z *= .85;
  return SCALE * z;
}
function screenToWorld(sx, sy) { const s = viewScale(); return { x: (sx - VW / 2) / s + cam.x, y: (sy - VH / 2) / s + cam.y }; }
function shoulder(c) { return { x: c.x, y: c.y + c.h / 2 - 34 + (c.crouch ? 10 : 0) }; }

function playerControl(c) {
  const ctrl = { mx: 0, up: false, shoot: false, aim: c.aim, gren: false, swap: 0, sel: -1, reload: false, crouch: false, pick: false, melee: false };
  if (keys['a'] || keys['arrowleft']) ctrl.mx -= 1;
  if (keys['d'] || keys['arrowright']) ctrl.mx += 1;
  ctrl.up = !!(keys['w'] || keys[' '] || keys['arrowup']);
  ctrl.crouch = !!(keys['s'] || keys['c'] || keys['arrowdown']);
  const sh = shoulder(c);
  if (touch.used) {
    if (Math.abs(touch.L.x) > .2) ctrl.mx = clamp(touch.L.x * 1.4, -1, 1);
    if (touch.L.y < -.35) ctrl.up = true;
    if (touch.L.y > .6 || touch.crouch) ctrl.crouch = true;
    const rm = Math.hypot(touch.R.x, touch.R.y);
    if (rm > .25) { ctrl.aim = Math.atan2(touch.R.y, touch.R.x); ctrl.shoot = rm > .55; }
  } else {
    const w = screenToWorld(mouse.x, mouse.y); ctrl.aim = Math.atan2(w.y - sh.y, w.x - sh.x);
  }
  if (mouse.down) ctrl.shoot = true;
  for (const k of pressQueue) {
    if (k === 'q' || k === 'e') ctrl.swap += 1;
    if (k === 'g') ctrl.gren = true;
    if (k === 'r') ctrl.reload = true;
    if (k === 'f') ctrl.pick = true;
    if (k === 'v') ctrl.melee = true;
    if (k === '1' || k === '2') ctrl.sel = +k - 1;
  }
  pressQueue.length = 0;
  if (mouse.right) { ctrl.gren = true; mouse.right = false; }
  if (wheelSwap) { ctrl.swap += 1; wheelSwap = 0; }
  if (touch.gren) { ctrl.gren = true; touch.gren = false; }
  if (touch.swap) { ctrl.swap += 1; touch.swap = false; }
  if (touch.reload) { ctrl.reload = true; touch.reload = false; }
  if (touch.pick) { ctrl.pick = true; touch.pick = false; }
  if (touch.melee) { ctrl.melee = true; touch.melee = false; }
  if (ctrl.up) ctrl.crouch = false;
  return ctrl;
}

// ================= AI =================
function isEnemy(a, b) { return a !== b && b.alive && (G.mode !== 'team' || a.team !== b.team); }
function botControl(c, dt) {
  const ai = c.ai, D = DIFF[G.diff];
  const ctrl = { mx: 0, up: false, shoot: false, aim: c.aim, gren: false, swap: 0, sel: -1, reload: false, crouch: false, pick: false, melee: false };
  ai.retarget -= dt; ai.goalT -= dt;
  const sh = shoulder(c);
  if (ai.retarget <= 0) {
    ai.retarget = .3;
    let best = null, bd = 1e9;
    for (const o of chars) {
      if (!isEnemy(c, o) || o.shield > 1.2) continue;
      let d = Math.hypot(o.x - c.x, o.y - c.y);
      if (!(d < 1300 && los(sh.x, sh.y, o.x, o.y - 10))) d += 900;
      if (o.isPlayer) d *= .8;
      if (o.ult > 0) d += 800;
      if (d < bd) { bd = d; best = o; }
    }
    if (best !== ai.target) ai.react = D.react * rand(.7, 1.3);
    ai.target = best;
    ai.vis = best ? Math.hypot(best.x - c.x, best.y - c.y) < 1300 && los(sh.x, sh.y, best.x, best.y - 10) : false;
    if (best) {
      const dist = Math.hypot(best.x - c.x, best.y - c.y);
      let bi = 0, bs = -1e9;
      c.weapons.forEach((w, i) => {
        const def = WEAPONS[w.key]; if (w.mag + (w.reserve === Infinity ? 99 : w.reserve) <= 0) return;
        let s = def.heavy * 10 + def.dmg * def.pellets / def.rate * .05;
        if (dist > def.range) s -= 60; if ((def.type === 'rocket' || def.type === 'gl') && dist < 170) s -= 80;
        if (s > bs) { bs = s; bi = i; }
      });
      ctrl.sel = bi;
    }
  }
  const apple = items.find(i => i.kind === 'apple' && i.active);
  if (apple && c.ult <= 0 && Math.hypot(apple.x - c.x, apple.y - c.y) < (G.diff === 'hard' ? 1100 : G.diff === 'med' ? 750 : 450)) { ai.goal = { x: apple.x, y: apple.y }; ai.goalT = .5; ai.apple = true; } else ai.apple = false;
  const t = ai.target, wdef = WEAPONS[c.weapons[c.cur].key];
  const weak = Math.max(...c.weapons.map(w => WEAPONS[w.key].heavy)) <= 1;
  if (t && ai.vis) {
    const dist = Math.hypot(t.x - c.x, t.y - c.y);
    const pref = clamp(wdef.range * .55, 140, 520);
    if (ai.goalT <= 0) { ai.side = t.x > c.x ? -1 : 1; if (Math.random() < .25) ai.side *= -1; ai.goalT = rand(1.5, 3); }
    if (!ai.apple) ai.goal = { x: t.x + ai.side * pref, y: t.y - rand(0, 60) };
    ai.react -= dt;
    let tx = t.x, ty = t.y - 12;
    if (wdef.type !== 'flame') { const tt = dist / wdef.speed * (G.diff === 'hard' ? 1 : G.diff === 'med' ? .5 : 0); tx += t.vx * tt; ty += t.vy * tt; }
    if (wdef.type === 'rocket' || wdef.type === 'gl') ty += 20;
    const want = Math.atan2(ty - sh.y, tx - sh.x) + Math.sin(G.elapsed * 3 + c.id) * D.err;
    ctrl.aim = c.aim + clamp(angDiff(c.aim, want), -D.turn * dt, D.turn * dt);
    if (ai.react <= 0 && dist < wdef.range * 1.1 && Math.abs(angDiff(ctrl.aim, want)) < .25) {
      if (ai.pauseT > 0) ai.pauseT -= dt;
      else { ctrl.shoot = true; ai.burstT += dt; if (ai.burstT > D.burst * rand(.6, 1.4)) { ai.burstT = 0; ai.pauseT = D.pause * rand(.5, 1.5); } }
    }
    if (dist < 60 && Math.random() < dt * 4) ctrl.melee = true;
    if (c.grenades > 0 && dist > 160 && dist < 520 && Math.random() < D.gren * dt) ctrl.gren = true;
    if (Math.random() < D.dodge * dt) ai.hover = rand(.3, .8);
    if (c.onGround && Math.random() < D.crouch * dt) ai.crouchT = rand(.6, 1.4);
  } else {
    if (weak || c.hp < 50) {
      let bi = null, bd = 1e9;
      for (const it of items) { if (!it.active) continue; if (c.hp < 50 ? it.kind !== 'health' : it.kind !== 'weapon') continue; const d = Math.hypot(it.x - c.x, it.y - c.y); if (d < bd) { bd = d; bi = it; } }
      if (bi && (!ai.goal || ai.goalT <= 0)) { ai.goal = { x: bi.x, y: bi.y }; ai.goalT = 4; }
    }
    if (t && (!ai.goal || ai.goalT <= 0)) { ai.goal = { x: t.x + rand(-200, 200), y: t.y - 40 }; ai.goalT = rand(2, 4); }
    if (!ai.goal || ai.goalT <= 0) { const s = pick(SPAWNS); ai.goal = { x: s[0], y: s[1] }; ai.goalT = rand(3, 5); }
    ctrl.aim = c.aim + clamp(angDiff(c.aim, ai.goal.x > c.x ? 0 : Math.PI), -4 * dt, 4 * dt);
  }
  const g = ai.goal;
  if (g) {
    const dx = g.x - c.x, dy = g.y - c.y;
    if (Math.abs(dx) > 30) ctrl.mx = Math.sign(dx);
    if (dy < -70 && c.fuel > 8) ctrl.up = true;
    if (c.flying && dy < -20 && c.fuel > 3) ctrl.up = true;
    if (c.hitWall && ctrl.mx !== 0 && c.fuel > 10) ctrl.up = true;
    if (ctrl.mx && solidAt(c.x + ctrl.mx * 30, c.y) && c.fuel > 10) ctrl.up = true;
    if (!c.onGround && c.vy > 300 && dy < 0 && c.fuel > 5) ctrl.up = true;
  }
  if (ai.hover > 0) { ai.hover -= dt; if (c.fuel > 20) ctrl.up = true; }
  if (ai.crouchT > 0) { ai.crouchT -= dt; if (!ctrl.up) { ctrl.crouch = true; ctrl.mx = 0; } }
  ai.stuckT += dt;
  if (ai.stuckT > 1.4) {
    if (Math.hypot(c.x - ai.lastX, c.y - ai.lastY) < 30 && ctrl.mx !== 0) { ai.goalT = 0; ai.side *= -1; ai.hover = .7; ai.goal = null; }
    ai.stuckT = 0; ai.lastX = c.x; ai.lastY = c.y;
  }
  const w = c.weapons[c.cur];
  if (!ctrl.shoot && w.mag < WEAPONS[w.key].mag * .3 && w.reserve > 0) ctrl.reload = true;
  ctrl.pick = true; // bots auto-evaluate pickups
  return ctrl;
}

// ================= SIMULATION =================
const GRAV = 1750, SPEED = 270, JUMP = 540, THRUST = 3300, MAXUP = 440;
function overlapRect(c, r) { return Math.abs(c.x - (r.x + r.w / 2)) < (c.w + r.w) / 2 && Math.abs(c.y - (r.y + r.h / 2)) < (c.h + r.h) / 2; }
function moveChar(c, dt) {
  c.hitWall = false;
  c.x += c.vx * dt;
  for (const r of RECTS) if (overlapRect(c, r)) { if (c.x < r.x + r.w / 2) c.x = r.x - c.w / 2 - .01; else c.x = r.x + r.w + c.w / 2 + .01; c.vx = 0; c.hitWall = true; }
  c.y += c.vy * dt; c.onGround = false;
  for (const r of RECTS) if (overlapRect(c, r)) { if (c.vy > 0) { c.y = r.y - c.h / 2 - .01; c.onGround = true; } else c.y = r.y + r.h + c.h / 2 + .01; c.vy = 0; }
  if (c.y < 90) { c.y = 90; c.vy = Math.max(0, c.vy); }
}
function setCrouch(c, want) {
  if (want && !c.crouch) { c.crouch = true; c.y += (STAND_H - CROUCH_H) / 2; c.h = CROUCH_H; }
  else if (!want && c.crouch) {
    const test = { x: c.x, y: c.y - (STAND_H - CROUCH_H) / 2, w: c.w, h: STAND_H };
    if (!RECTS.some(r => overlapRect(test, r))) { c.crouch = false; c.y = test.y; c.h = STAND_H; }
  }
}
function takeWeapon(c, it) {
  const key = it.weapon, def = WEAPONS[key];
  const ex = c.weapons.find(w => w.key === key);
  if (ex) { ex.reserve = Math.min(def.reserve * 2, ex.reserve + def.mag + def.reserve / 2); }
  else if (c.weapons.length < 2) { c.weapons.push({ key, mag: def.mag, reserve: def.reserve }); c.cur = c.weapons.length - 1; }
  else {
    const old = c.weapons[c.cur];
    if (old.key !== 'pistol' || true) items.push({ x: c.x, y: c.y, vy: -150, kind: 'weapon', weapon: old.key, mag: old.mag, reserve: old.reserve, active: true, respawn: 0, spot: false, bob: 0, life: 15, falling: true, noPick: .6 });
    c.weapons[c.cur] = { key, mag: it.mag != null ? it.mag : def.mag, reserve: it.reserve != null ? it.reserve : def.reserve };
  }
  c.reloadT = 0; c.burstN = 0; c.spin = 0;
  if (c.isPlayer) { floatText(c.x, c.y - 50, 'Got ' + def.name, '#ffe08a'); }
  if (c.isPlayer || cameraNear(c.x, c.y)) Audio.pickup();
  const pickupIndex = items.indexOf(it);
  it.active = false; it.respawn = 14;
  if (c.isPlayer) jjSendAction({ action:'pickup', itemIndex:pickupIndex });
  for (let i = 0; i < 10; i++) spark(it.x, it.y, '#fff3b0', 160, .35, 3);
}
function botWants(c, it) {
  if (c.weapons.some(w => w.key === it.weapon)) return c.weapons.find(w => w.key === it.weapon).reserve < 20;
  if (c.weapons.length < 2) return true;
  return WEAPONS[it.weapon].heavy > WEAPONS[c.weapons[c.cur].key].heavy;
}
function updateChar(c, dt) {
  if (c.networkRemote) return;
  if (!c.alive) { c.respawnT -= dt; if (c.respawnT <= 0 && !G.over) spawnChar(c); return; }
  const ctrl = c.isPlayer ? playerControl(c) : botControl(c, dt);
  c.aim = ctrl.aim; c.facing = Math.cos(c.aim) >= 0 ? 1 : -1;
  const wdef0 = WEAPONS[c.weapons[c.cur].key];
  setCrouch(c, ctrl.crouch && c.onGround);
  let spd = SPEED * (c.crouch ? .45 : 1) * (wdef0.slow || 1);
  c.vx += (ctrl.mx * spd - c.vx) * Math.min(1, dt * (c.onGround ? 14 : 5));
  c.flying = false;
  if (ctrl.up) {
    if (c.onGround && !c.upPrev) { c.vy = -JUMP; c.onGround = false; puff(c.x, c.y + c.h / 2, 6, '#d9d0c0'); }
    else if (!c.onGround && c.fuel > 0) { c.flying = true; c.vy -= THRUST * dt; if (c.vy < -MAXUP) c.vy = -MAXUP; c.fuel = Math.max(0, c.fuel - 30 * dt); jetFlame(c); }
  }
  if (!c.flying) c.fuel = Math.min(100, c.fuel + (c.onGround ? 45 : 10) * dt);
  c.upPrev = ctrl.up;
  c.vy += GRAV * dt; if (c.vy > 950) c.vy = 950;
  moveChar(c, dt);
  if (c.onGround) c.walk += Math.abs(c.vx) * dt * .045; else c.walk += dt * 2;
  // weapon switching
  if (ctrl.sel >= 0 && ctrl.sel < c.weapons.length && ctrl.sel !== c.cur) { c.cur = ctrl.sel; c.reloadT = 0; c.burstN = 0; c.spin = 0; c.cd = Math.max(c.cd, .15); if (c.isPlayer) Audio.click(); }
  if (ctrl.swap && c.weapons.length > 1) { c.cur = (c.cur + 1) % c.weapons.length; c.reloadT = 0; c.burstN = 0; c.spin = 0; c.cd = Math.max(c.cd, .15); if (c.isPlayer) Audio.click(); }
  const w = c.weapons[c.cur], def = WEAPONS[w.key];
  c.cd -= dt; c.gcd -= dt; c.mcd -= dt; if (c.meleeT > 0) c.meleeT -= dt;
  if (c.reloadT > 0) {
    c.reloadT -= dt;
    if (c.reloadT <= 0) { const take = Math.min(def.mag - w.mag, w.reserve); w.mag += take; if (w.reserve !== Infinity) w.reserve -= take; }
  } else if (ctrl.reload && w.mag < def.mag && w.reserve > 0) c.reloadT = def.reload;
  if (def.spin) c.spin = ctrl.shoot && c.reloadT <= 0 ? Math.min(1, c.spin + dt / def.spin) : Math.max(0, c.spin - dt * 2);
  if (c.burstN > 0) { c.burstT -= dt; if (c.burstT <= 0) { if (w.mag > 0 && def.burst) { fire(c, w, def, true); c.burstN--; c.burstT = def.gap; } else c.burstN = 0; } }
  if (ctrl.shoot && c.cd <= 0 && c.reloadT <= 0 && c.meleeT <= 0 && (!def.spin || c.spin >= 1)) {
    if (w.mag > 0) fire(c, w, def, false);
    else if (w.reserve > 0) c.reloadT = def.reload;
    else { c.weapons.splice(c.cur, 1); if (!c.weapons.length) c.weapons.push({ key: 'pistol', mag: 12, reserve: Infinity }); c.cur = 0; c.cd = .2; }
  }
  if (ctrl.gren && c.grenades > 0 && c.gcd <= 0) throwGrenade(c);
  if (ctrl.melee && c.mcd <= 0) doMelee(c);
  if (c.ult > 0) {
    c.ult -= dt; c.burn = 0;
    if (Math.random() < .6) particles.push({ x: c.x + rand(-18, 18), y: c.y + rand(-28, 24), vx: rand(-30, 30), vy: rand(-90, -30), life: .6, max: .6, size: rand(2, 4), col: pick(['#ffd34d', '#fff3b0', '#ff5a5a']), glow: true });
    if (c.ult <= 0 && c.isPlayer) floatText(c.x, c.y - 60, 'INVINCIBILITY OVER', '#ffb0b0');
  }
  if (c.regenT > 0) c.regenT -= dt;
  else if (c.hp < 100 && c.burn <= 0) { c.hp = Math.min(100, c.hp + REGEN_RATE * dt); if (c.isPlayer && Math.random() < dt * 5) particles.push({ x: c.x + rand(-14, 14), y: c.y + rand(-10, 20), vx: 0, vy: -50, life: .6, max: .6, size: 3, col: '#7dff8a', glow: true }); }
  if (c.shield > 0) c.shield -= dt;
  if (c.hurtT > 0) c.hurtT -= dt;
  if (c.burn > 0) { c.burn -= dt; if (Math.random() < .5) spark(c.x + rand(-10, 10), c.y + rand(-20, 20), '#ff9a2a', 60, .4, 4); if (Math.random() < dt * 6) damage(c, 3, c.burnBy, 'flame', false); }
  if (c.multiT > 0) { c.multiT -= dt; if (c.multiT <= 0) c.multi = 0; }
  // pickups
  if (c.isPlayer) G.nearItem = null;
  for (const it of items) {
    if (!it.active || (it.noPick > 0)) continue;
    if (Math.abs(it.x - c.x) < 34 && Math.abs(it.y - c.y) < 44) {
      if (it.kind === 'weapon') {
        if (c.isPlayer) { G.nearItem = it; if (ctrl.pick) { takeWeapon(c, it); G.nearItem = null; } }
        else if (botWants(c, it)) takeWeapon(c, it);
        continue;
      }
      if (it.kind === 'apple') {
        const pickupIndex = items.indexOf(it);
        c.ult = ULT_TIME; c.hp = 100; it.active = false; G.appleT = rand(28, 38); Audio.pickup();
        if (c.isPlayer) jjSendAction({ action:'pickup', itemIndex:pickupIndex, apple:true });
        for (let k = 0; k < 40; k++) { const a = rand(0, 6.28), sp = rand(80, 380); particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: .7, max: .7, size: rand(3, 7), col: pick(['#ffd34d', '#ff4d4d', '#fff3b0']), glow: true, drag: .9 }); }
        if (c.isPlayer) { showAnnounce('ULTIMATE APPLE!', `You are invincible for ${ULT_TIME} seconds`); slowT = .25; }
        else if (!G.attract) showAnnounce('', `${c.name} ate the Ultimate Apple`);
        continue;
      }
      const pickupIndex = items.indexOf(it);
      if (it.kind === 'health') { if (c.hp >= 100) continue; c.hp = Math.min(100, c.hp + 50); if (c.isPlayer) floatText(c.x, c.y - 50, '+50 HP', '#7dff8a'); }
      else { if (c.grenades >= 5) continue; c.grenades = Math.min(5, c.grenades + 2); if (c.isPlayer) floatText(c.x, c.y - 50, '+2 GRENADES', '#ffd34d'); }
      if (c.isPlayer) jjSendAction({ action:'pickup', itemIndex:pickupIndex });
      if (c.isPlayer || cameraNear(c.x, c.y)) Audio.pickup();
      it.active = false; it.respawn = 14;
      for (let i = 0; i < 10; i++) spark(it.x, it.y, '#fff3b0', 160, .35, 3);
    }
  }
}
function cameraNear(x, y) { const s = viewScale(); return Math.abs(x - cam.x) < VW / s / 2 + 100 && Math.abs(y - cam.y) < VH / s / 2 + 100; }
function vol(x, y) { const d = Math.hypot(x - cam.x, y - cam.y); return clamp(1 - d / 1400, 0, 1) * (G.attract ? .35 : 1); }

function fire(c, w, def, fromBurst) {
  w.mag--; if (!fromBurst) c.cd = def.rate;
  if (def.burst && !fromBurst) { c.burstN = def.burst - 1; c.burstT = def.gap; }
  const sh = shoulder(c);
  const m = { x: sh.x + Math.cos(c.aim) * (def.len + 14), y: sh.y + Math.sin(c.aim) * (def.len + 14) };
  const acc = c.crouch ? .5 : c.onGround ? .8 : 1.2;
  for (let i = 0; i < def.pellets; i++) {
    const a = c.aim + rand(-def.spread, def.spread) * (def.pellets > 1 ? 1 : acc);
    const sp = def.speed * (def.pellets > 1 ? rand(.85, 1.1) : 1);
    if (def.type === 'gl') {
      const g = { x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, fuse: 1.6, owner: c, rot: 0, contact: true, dmg: def.dmg };
      grenades.push(g);
      if (c.isPlayer) jjSendAction({ action: 'grenade', grenade: { x:g.x, y:g.y, vx:g.vx, vy:g.vy, fuse:g.fuse, contact:true, dmg:g.dmg } });
      continue;
    }
    const b = { x: m.x, y: m.y, vx: Math.cos(a) * sp + (def.type === 'flame' ? c.vx * .5 : 0), vy: Math.sin(a) * sp + (def.type === 'flame' ? c.vy * .3 : 0), life: def.life * (def.type === 'flame' ? rand(.7, 1.1) : 1), max: def.life, dmg: def.dmg, owner: c, key: w.key, type: def.type || 'bullet', col: def.col, bounces: 2 };
    bullets.push(b);
    if (c.isPlayer) jjSendAction({ action: 'bullet', bullet: { x:b.x, y:b.y, vx:b.vx, vy:b.vy, life:b.life, max:b.max, dmg:b.dmg, key:b.key, type:b.type, col:b.col, bounces:b.bounces } });
  }
  if (def.recoil) { c.vx -= Math.cos(c.aim) * def.recoil * (c.crouch ? .3 : 1); c.vy -= Math.sin(c.aim) * def.recoil * .7; }
  if (def.type !== 'flame') {
    for (let i = 0; i < 4; i++) particles.push({ x: m.x, y: m.y, vx: Math.cos(c.aim) * rand(50, 200) + rand(-60, 60), vy: Math.sin(c.aim) * rand(50, 200) + rand(-60, 60), life: .08, max: .08, size: rand(6, 12), col: def.type === 'laser' ? '#9ff' : '#ffd36b', glow: true });
    if (def.type !== 'laser' && def.type !== 'gl' && def.type !== 'rocket') particles.push({ x: sh.x, y: sh.y, vx: -c.facing * rand(60, 140), vy: rand(-260, -160), life: 1.2, max: 1.2, size: 3, col: '#d4a63a', grav: 1, shell: true });
  }
  if (c.isPlayer) cam.shake = Math.max(cam.shake, def.shake);
  Audio.shot(def.snd, vol(c.x, c.y));
}
function doMelee(c) {
  c.mcd = .55; c.meleeT = .25;
  if (c.isPlayer) jjSendAction({ action: 'melee' });
  if (cameraNear(c.x, c.y)) Audio.slash();
  const sh = shoulder(c);
  for (let i = 0; i < 6; i++) particles.push({ x: sh.x + c.facing * rand(20, 45), y: sh.y + rand(-15, 15), vx: c.facing * 200, vy: rand(-50, 50), life: .15, max: .15, size: 3, col: '#fff', glow: true });
  for (const o of chars) {
    if (!isEnemy(c, o)) continue;
    const dx = (o.x - c.x) * c.facing, dy = o.y - c.y;
    if (dx > -8 && dx < 62 && Math.abs(dy) < 44) { o.vx += c.facing * 300; o.vy -= 150; damage(o, 55, c, 'melee', false); }
  }
}
function throwGrenade(c) {
  c.grenades--; c.gcd = .7;
  const sh = shoulder(c);
  const g = { x: sh.x + Math.cos(c.aim) * 20, y: sh.y + Math.sin(c.aim) * 20, vx: Math.cos(c.aim) * 720 + c.vx * .5, vy: Math.sin(c.aim) * 720 - 140 + c.vy * .3, fuse: 2, owner: c, rot: 0, dmg: 105 };
  grenades.push(g);
  if (c.isPlayer) { jjSendAction({ action: 'grenade', grenade: { x:g.x, y:g.y, vx:g.vx, vy:g.vy, fuse:g.fuse, dmg:g.dmg } }); Audio.click(); }
}
function charAt(x, y, exclude) {
  for (const c of chars) { if (!c.alive || c === exclude) continue; if (Math.abs(x - c.x) < c.w / 2 + 2 && Math.abs(y - c.y) < c.h / 2 + 2) return c; }
  return null;
}
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.life -= dt;
    if (b.type === 'rocket') { b.vy += 120 * dt; if (Math.random() < .9) particles.push({ x: b.x, y: b.y, vx: rand(-30, 30) - b.vx * .1, vy: rand(-30, 30) - b.vy * .1, life: .6, max: .6, size: rand(5, 9), col: '#9a8f88', smoke: true }); }
    if (b.type === 'flame') { b.vx *= .985; b.vy = b.vy * .985 - 200 * dt; }
    const spd = Math.hypot(b.vx, b.vy) * dt, n = Math.max(1, Math.ceil(spd / 14));
    let dead = b.life <= 0;
    for (let s = 0; s < n && !dead; s++) {
      const px = b.x, py = b.y;
      b.x += b.vx * dt / n; b.y += b.vy * dt / n;
      if (solidAt(b.x, b.y)) {
        if (b.type === 'laser' && b.bounces > 0) {
          b.bounces--; const hx = solidAt(b.x, py), hy = solidAt(px, b.y);
          if (hx) b.vx = -b.vx; if (hy) b.vy = -b.vy; if (!hx && !hy) { b.vx = -b.vx; b.vy = -b.vy; }
          b.x = px; b.y = py; for (let k = 0; k < 3; k++) spark(b.x, b.y, '#9ff', 180, .2, 2.5); continue;
        }
        dead = true;
        if (b.type === 'rocket') explode(px, py, WEAPONS.rocket.radius, WEAPONS.rocket.dmg, b.owner, 'rocket');
        else if (b.type !== 'flame') { for (let k = 0; k < 4; k++) spark(b.x, b.y, b.type === 'laser' ? '#9ff' : '#ffe9a8', 220, .25, 2.5); puff(b.x, b.y, 2, '#c9b8a0'); }
        break;
      }
      const t = charAt(b.x, b.y, b.owner);
      if (t && (G.mode !== 'team' || t.team !== b.owner.team)) {
        dead = true;
        if (b.type === 'rocket') { explode(b.x, b.y, WEAPONS.rocket.radius, WEAPONS.rocket.dmg, b.owner, 'rocket'); break; }
        const head = b.y < t.y - t.h / 2 + 16;
        const def = WEAPONS[b.key];
        const dmg = b.dmg * (head ? (def.head || 1.5) : 1);
        if (b.type === 'flame') { t.burn = 1.6; t.burnBy = b.owner; }
        t.vx += b.vx * .02;
        damage(t, dmg, b.owner, b.key, head && b.type !== 'flame');
        for (let k = 0; k < (b.type === 'flame' ? 1 : 5); k++) particles.push({ x: b.x, y: b.y, vx: b.vx * .08 + rand(-120, 120), vy: b.vy * .08 + rand(-160, 40), life: .5, max: .5, size: rand(2, 4), col: '#c8102e', grav: 1 });
      }
    }
    if (dead) bullets.splice(i, 1);
  }
}
function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i]; g.fuse -= dt; g.rot += g.vx * dt * .05;
    g.vy += GRAV * .8 * dt;
    g.x += g.vx * dt; if (solidAt(g.x, g.y)) { g.x -= g.vx * dt; g.vx *= -.5; }
    g.y += g.vy * dt; if (solidAt(g.x, g.y)) { g.y -= g.vy * dt; g.vy *= -.45; g.vx *= .75; }
    if (Math.random() < .5) particles.push({ x: g.x, y: g.y, vx: 0, vy: -20, life: .3, max: .3, size: 2, col: '#ffcf70', glow: true });
    let boom = g.fuse <= 0;
    if (g.contact) { const t = charAt(g.x, g.y, g.owner); if (t && (G.mode !== 'team' || t.team !== g.owner.team)) boom = true; }
    if (boom) { explode(g.x, g.y, 150, g.dmg, g.owner, g.contact ? 'gl' : 'grenade'); grenades.splice(i, 1); }
  }
}
function explode(x, y, radius, dmg, owner, key) {
  for (const c of chars) {
    if (!c.alive) continue;
    const d = Math.hypot(c.x - x, c.y - y);
    if (d > radius + 20) continue;
    const f = 1 - d / (radius + 20), nx = (c.x - x) / (d || 1), ny = (c.y - y) / (d || 1);
    c.vx += nx * 700 * f; c.vy += ny * 500 * f - 250 * f;
    if (G.mode === 'team' && c.team === owner.team && c !== owner) continue;
    damage(c, dmg * f * (c === owner ? .45 : 1), owner, key, false);
  }
  for (let i = 0; i < 30; i++) { const a = rand(0, 6.28), s = rand(80, 520); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(.3, .7), max: .7, size: rand(4, 10), col: pick(['#ffd34d', '#ff8a1f', '#ff5a36', '#fff3b0']), glow: true, drag: .9 }); }
  for (let i = 0; i < 18; i++) { const a = rand(0, 6.28), s = rand(30, 160); particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: rand(.8, 1.6), max: 1.6, size: rand(10, 22), col: '#6e6260', smoke: true }); }
  for (let i = 0; i < 10; i++) particles.push({ x, y, vx: rand(-400, 400), vy: rand(-600, -100), life: 1.5, max: 1.5, size: 3, col: '#5a4030', grav: 1 });
  particles.push({ x, y, vx: 0, vy: 0, life: .25, max: .25, size: radius, col: '#fff3c0', ring: true });
  const v = vol(x, y); cam.shake = Math.max(cam.shake, 14 * v);
  Audio.boom(v);
}
function damage(t, amt, by, key, head) {
  if (!t.alive || t.shield > 0 || G.over) return;
  if (t.ult > 0) { if (by && by.isPlayer && t !== by && Math.random() < .3) floatText(t.x + rand(-10, 10), t.y - 46, 'IMMUNE', '#ffd34d'); return; }
  t.hp -= amt; t.hurtT = .12; t.regenT = REGEN_DELAY;
  if (by && by.isPlayer && t !== by) { Audio.hit(); floatText(t.x + rand(-10, 10), t.y - 46, Math.round(amt) + (head ? '!' : ''), head ? '#ff4d4d' : '#fff'); if (head && t.hp <= 0) showAnnounce('HEADSHOT!', ''); }
  if (t.isPlayer) cam.shake = Math.max(cam.shake, 4);
  if (t.hp <= 0) kill(t, by, key, head);
}
function weapName(key) { return key === 'grenade' ? 'Grenade' : key === 'melee' ? 'Knife' : (WEAPONS[key] ? WEAPONS[key].name : ''); }
function kill(t, by, key, head) {
  t.alive = false; t.deaths++; t.respawnT = 3; t.hp = 0;
  for (let i = 0; i < 18; i++) particles.push({ x: t.x, y: t.y, vx: rand(-320, 320) + t.vx * .3, vy: rand(-520, -100), life: rand(.8, 1.6), max: 1.6, size: rand(3, 6), col: i % 3 ? '#c8102e' : t.color, grav: 1 });
  particles.push({ x: t.x, y: t.y - 24, vx: rand(-150, 150), vy: -500, life: 2, max: 2, size: 10, col: t.color, grav: 1, helmet: true });
  const w = t.weapons[t.cur];
  if (w && w.key !== 'pistol') items.push({ x: t.x, y: t.y, vy: -200, kind: 'weapon', weapon: w.key, active: true, respawn: 0, spot: false, bob: 0, life: 15, falling: true });
  if (cameraNear(t.x, t.y)) Audio.die();
  const self = !by || by === t;
  feed.unshift({ k: self ? '' : by.name, kc: self ? '' : by.color, v: t.name, vc: t.color, w: self ? 'blew themselves up' : weapName(key) + (head ? ' (head)' : ''), t: 5 }); feedDirty = true;
  if (feed.length > 4) feed.pop();
  if (!self) {
    by.kills++; by.streak++; by.multi++; by.multiT = 3;
    if (G.mode === 'team') G.teamScore[by.team]++;
    if (by.isPlayer) {
      const firstBlood = chars.reduce((s, c) => s + c.kills, 0) === 1;
      const ms = { 2: 'DOUBLE KILL', 3: 'TRIPLE KILL', 4: 'MEGA KILL', 5: 'RAMPAGE!' }[by.multi];
      const ss = { 3: 'Killing spree!', 5: 'Unstoppable!', 7: 'GODLIKE!', 10: 'LEGENDARY!' }[by.streak];
      if (firstBlood) showAnnounce('FIRST BLOOD!', `You fragged ${t.name}`);
      else if (ms) showAnnounce(ms, ss || `You fragged ${t.name}`);
      else if (ss) showAnnounce(ss.toUpperCase(), `You fragged ${t.name}`);
      else if (key === 'melee') showAnnounce('KNIFED!', `You sliced ${t.name}`);
      else if (!head) showAnnounce('', `You fragged ${t.name}`);
    }
  } else if (G.mode !== 'team') t.kills = Math.max(0, t.kills - 1);
  if (t.isPlayer) G.deathInfo = { self, name: self ? t.name : by.name, bot: !self && !by.isPlayer, weap: self ? 'Your own explosive' : weapName(key), hp: self ? 0 : Math.max(1, Math.round(by.hp)) };
  t.streak = 0;
  if (!G.attract) {
    const reached = G.mode === 'team' ? (G.teamScore.A >= G.limit || G.teamScore.B >= G.limit) : (by && by.kills >= G.limit);
    if (reached) endGame();
  }
}
function showAnnounce(text, sub) { announce = { text, sub, t: text ? 2 : 1.8 }; }
function floatText(x, y, s, col) { floaters.push({ x, y, s, col, t: .9 }); }
function spark(x, y, col, sp, life, size) { const a = rand(0, 6.28), s = rand(.3, 1) * sp; particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, size, col, glow: true }); }
function puff(x, y, n, col) { for (let i = 0; i < n; i++) particles.push({ x: x + rand(-8, 8), y, vx: rand(-80, 80), vy: rand(-60, -10), life: .5, max: .5, size: rand(4, 8), col, smoke: true }); }
function jetFlame(c) {
  const feet = c.y + c.h / 2, bx = c.x - c.facing * 13, by = feet - 18 + (c.crouch ? 10 : 0);
  const xs = c.av.jet === 'twin' ? [bx - 4, bx + 4] : [bx];
  const cols = c.av.jet === 'plasma' || c.av.jet === 'hover' ? ['#ffffff', shade(c.color, 70), c.color, '#8ff6ff'] : c.av.jet === 'golden' ? ['#fff3b0', '#ffd34d', '#7ff'] : ['#ffd34d', '#ff8a1f', '#fff3b0'];
  for (const x of xs) particles.push({ x: x + rand(-2, 2), y: by + 6, vx: rand(-30, 30) + c.vx * .2, vy: rand(250, 420), life: rand(.12, .25), max: .25, size: rand(4, 8), col: pick(cols), glow: true });
  if (Math.random() < (c.av.jet === 'plasma' || c.av.jet === 'hover' ? .08 : .3)) particles.push({ x: bx, y: by + 18, vx: rand(-20, 20), vy: rand(60, 120), life: .7, max: .7, size: rand(5, 9), col: '#b9aaa0', smoke: true });
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    if (p.grav) p.vy += GRAV * .6 * dt;
    if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
    if (p.smoke) { p.vx *= .96; p.vy = p.vy * .96 - 30 * dt; p.size += 12 * dt; }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (p.grav && solidAt(nx, ny)) { p.vy *= -.3; p.vx *= .6; if (!p.shell && !p.helmet && Math.abs(p.vy) < 40) { p.vx = 0; p.vy = 0; p.grav = 0; } }
    else { p.x = nx; p.y = ny; }
  }
  if (particles.length > 1600) particles.splice(0, particles.length - 1600);
  for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t -= dt; f.y -= 40 * dt; if (f.t <= 0) floaters.splice(i, 1); }
}
const ULT_TIME = 8, REGEN_DELAY = 4, REGEN_RATE = 9;
function spawnApple() {
  const sp = pick(ITEM_SPOTS.length ? ITEM_SPOTS : SPAWNS);
  items.push({ x: sp[0], y: sp[1] - 60, kind: 'apple', active: true, respawn: 0, spot: false, bob: 0, life: Infinity });
  G.appleT = 999;
  if (!G.attract) { showAnnounce('', 'Ultimate Apple has appeared'); Audio.pickup(); }
}
function updateItems(dt) {
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; it.bob += dt * 3; if (it.noPick > 0) it.noPick -= dt;
    if (it.falling) { it.vy += GRAV * dt; it.y += it.vy * dt; if (solidAt(it.x, it.y + 16)) { it.y -= it.vy * dt; it.falling = false; } }
    if (!it.spot) { it.life -= dt; if (it.life <= 0 || !it.active) items.splice(i, 1); continue; }
    if (!it.active) { it.respawn -= dt; if (it.respawn <= 0) { it.active = true; if (it.kind === 'weapon') it.weapon = pick(LOOT); } }
  }
}
function step(dt) {
  if (state !== 'play' && state !== 'menu') return;
  if (slowT > 0) { slowT -= dt; dt *= .3; }
  G.elapsed += dt;
  if (!G.attract && !G.over) { G.time -= dt; if (G.time <= 0) { G.time = 0; endGame(); } }
  for (const c of chars) updateChar(c, dt);
  updateBullets(dt); updateGrenades(dt); updateParticles(dt); updateItems(dt);
  if (!G.over && !items.some(i => i.kind === 'apple')) { G.appleT -= dt; if (G.appleT <= 0) spawnApple(); }
  const fl = feed.length; for (const f of feed) f.t -= dt; feed = feed.filter(f => f.t > 0); if (feed.length !== fl) feedDirty = true;
  if (announce.t > 0) announce.t -= dt;
  let focus = G.player;
  if (G.attract) { if (!G.camT || G.camT < 0 || !G.camFocus || !G.camFocus.alive) { G.camFocus = pick(chars.filter(c => c.alive)) || chars[0]; G.camT = 6; } G.camT -= dt; focus = G.camFocus; }
  if (focus && focus.alive) {
    let tx = focus.x, ty = focus.y - 40;
    if (focus.isPlayer) { const look = focus.weapons[focus.cur].key === 'sniper' ? 320 : 110; tx += Math.cos(focus.aim) * look; ty += Math.sin(focus.aim) * look * .7; }
    const k = Math.min(1, dt * (G.attract ? 2 : 6));
    cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k);
  }
  const s = viewScale(), hw = VW / s / 2, hh = VH / s / 2;
  cam.x = clamp(cam.x, Math.min(hw, WW / 2), Math.max(WW / 2, WW - hw)); cam.y = clamp(cam.y, Math.min(hh - 40, WH / 2), Math.max(WH / 2, WH - hh));
  cam.shake *= Math.pow(.02, dt);
  Audio.setJet(!!(G.player && G.player.flying && state === 'play'));
  if (state === 'play') Audio.music();
}

// ================= RENDER =================
function hash(i) { const s = Math.sin(i * 12.9898) * 43758.5453; return s - Math.floor(s); }
const LAYERS = { far: [], mid: [], bfar: [], bmid: [] };
for (let i = 0; i < 120; i++) {
  LAYERS.far.push(Math.sin(i * .35) * 60 + Math.sin(i * .9 + 1) * 30 + Math.sin(i * .13) * 80);
  LAYERS.mid.push(Math.abs(Math.sin(i * .22)) * 110 + Math.sin(i * 1.3) * 18 + (i % 7 === 0 ? 40 : 0));
  LAYERS.bfar.push(60 + Math.floor(hash(i) * 6) * 40); LAYERS.bmid.push(30 + Math.floor(hash(i + 50) * 5) * 36);
}
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  for (const [o, c] of TH.sky) g.addColorStop(o, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
  const s = viewScale();
  if (TH.stars) { ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 50; i++) { const x = hash(i) * VW, y = hash(i + 99) * VH * .45; ctx.fillRect(x, y, 1.6, 1.6); } }
  const sy = VH * TH.sunY - (cam.y - 1200) * .05 * s, sx = VW * .55 - (cam.x - 1800) * .03 * s;
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 240 * s);
  sg.addColorStop(0, `rgba(${TH.glow},.85)`); sg.addColorStop(.3, `rgba(${TH.glow},.35)`); sg.addColorStop(1, `rgba(${TH.glow},0)`);
  ctx.fillStyle = sg; ctx.fillRect(0, 0, VW, VH);
  ctx.fillStyle = TH.sun; ctx.beginPath(); ctx.arc(sx, sy, (TH.moon ? 45 : 65) * s, 0, 6.28); ctx.fill();
  if (TH.moon) { ctx.fillStyle = 'rgba(180,160,220,.5)'; ctx.beginPath(); ctx.arc(sx - 12 * s, sy - 8 * s, 9 * s, 0, 6.28); ctx.arc(sx + 14 * s, sy + 10 * s, 6 * s, 0, 6.28); ctx.fill(); }
  if (TH.blocky) { blockLayer(LAYERS.bfar, .15, TH.far, VH * .7, 90, true); blockLayer(LAYERS.bmid, .35, TH.mid, VH * .82, 120, false); }
  else { layer(LAYERS.far, .15, TH.far, VH * .64, 120); layer(LAYERS.mid, .35, TH.mid, VH * .76, 90); }
  if (TH.snowfall) { ctx.fillStyle = 'rgba(255,255,255,.85)'; const t = G ? G.elapsed : 0; for (let i = 0; i < 70; i++) { const x = ((hash(i) * VW + t * 20 * (1 + hash(i + 3)) - cam.x * .2 * s) % VW + VW) % VW, y = ((hash(i + 7) * VH + t * 60 * (1 + hash(i + 5))) % VH); ctx.beginPath(); ctx.arc(x, y, 1.5 + hash(i + 11) * 1.5, 0, 6.28); ctx.fill(); } }
}
function layer(arr, par, col, base, seg) {
  const s = viewScale(), off = cam.x * par * s, yoff = -(cam.y - 1200) * par * .6 * s, sg = seg * s;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, VH);
  for (let x = -sg; x <= VW + sg; x += sg / 3) {
    const wx = (x + off) / sg, i0 = Math.floor(wx), f = wx - i0;
    const a = arr[((i0 % 120) + 120) % 120], b = arr[(((i0 + 1) % 120) + 120) % 120];
    ctx.lineTo(x, base + yoff - lerp(a, b, f) * s);
  }
  ctx.lineTo(VW, VH); ctx.closePath(); ctx.fill();
}
function blockLayer(arr, par, col, base, seg, windows) {
  const s = viewScale(), off = cam.x * par * s, yoff = -(cam.y - 1200) * par * .6 * s, sg = seg * s;
  const i0 = Math.floor(off / sg);
  for (let i = i0 - 1; i < i0 + VW / sg + 2; i++) {
    const a = arr[((i % 120) + 120) % 120] * s, x = i * sg - off, top = base + yoff - a;
    ctx.fillStyle = col; ctx.fillRect(x, top, sg - 4 * s, VH);
    if (windows) { ctx.fillStyle = 'rgba(255,220,120,.25)'; for (let wy = top + 10 * s; wy < VH; wy += 18 * s) for (let wx = x + 8 * s; wx < x + sg - 14 * s; wx += 16 * s) if (hash(wx * 3 + wy) > .6) ctx.fillRect(wx, wy, 6 * s, 8 * s); }
  }
}
function drawLevel() {
  const s = viewScale(), L = cam.x - VW / s / 2 - 50, R = cam.x + VW / s / 2 + 50, T = cam.y - VH / s / 2 - 50, B = cam.y + VH / s / 2 + 50;
  const st = TH.style;
  for (const r of RECTS) {
    if (r.x > R || r.x + r.w < L || r.y > B || r.y + r.h < T) continue;
    if (r.wall) { ctx.fillStyle = TH.wall; ctx.fillRect(r.x, r.y, r.w, r.h); continue; }
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + Math.min(r.h, 300));
    g.addColorStop(0, TH.body[0]); g.addColorStop(1, TH.body[1]);
    ctx.fillStyle = g; rr(ctx, r.x, r.y, r.w, r.h, st === 'neon' ? 3 : 8); ctx.fill();
    ctx.save(); rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.clip();
    if (st === 'desert') { ctx.fillStyle = 'rgba(80,30,20,.25)'; for (let yy = r.y + 16; yy < r.y + r.h - 6; yy += 22) ctx.fillRect(r.x + 4, yy, r.w - 8, 3); }
    else if (st === 'snow') { ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < r.w / 60; k++) ctx.fillRect(r.x + ((r.seed * 997 + k * 61) % r.w), r.y + 14, 18, 4); }
    else if (st === 'jungle') { ctx.strokeStyle = 'rgba(40,30,20,.3)'; ctx.lineWidth = 2; for (let yy = r.y + 18; yy < r.y + r.h; yy += 20) { ctx.beginPath(); ctx.moveTo(r.x, yy); ctx.lineTo(r.x + r.w, yy); ctx.stroke(); for (let xx = r.x + ((yy / 20) % 2) * 20; xx < r.x + r.w; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 20); ctx.stroke(); } } }
    else if (st === 'neon' && r.h > 100) { for (let wy = r.y + 24; wy < r.y + r.h - 20; wy += 34) for (let wx = r.x + 18; wx < r.x + r.w - 24; wx += 34) { const h = hash(wx * 7 + wy); ctx.fillStyle = h > .75 ? '#ffd86b' : h > .55 ? '#5ff7ff' : 'rgba(255,255,255,.06)'; ctx.globalAlpha = h > .55 ? .55 : 1; ctx.fillRect(wx, wy, 16, 20); } ctx.globalAlpha = 1; }
    ctx.restore();
    ctx.strokeStyle = OL; ctx.lineWidth = 4; rr(ctx, r.x, r.y, r.w, r.h, st === 'neon' ? 3 : 8); ctx.stroke();
    // top cap
    if (st === 'neon') {
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = r.h > 100 ? TH.cap : TH.grass; ctx.globalAlpha = .35; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x + r.w, r.y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.fillStyle = TH.grass; rr(ctx, r.x - 2, r.y - 5, r.w + 4, st === 'snow' ? 13 : 11, 5); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = TH.cap; ctx.fillRect(r.x + 2, r.y - 3, r.w - 4, 4);
      if (st === 'snow' && r.h <= 44) { ctx.fillStyle = '#e6f6ff'; for (let xx = r.x + 12; xx < r.x + r.w - 10; xx += 26) { ctx.beginPath(); ctx.moveTo(xx - 4, r.y + r.h); ctx.lineTo(xx, r.y + r.h + 10 + hash(xx) * 8); ctx.lineTo(xx + 4, r.y + r.h); ctx.fill(); } }
      if (st === 'jungle' && r.h <= 44) { ctx.strokeStyle = '#3e8e41'; ctx.lineWidth = 3; for (let xx = r.x + 20; xx < r.x + r.w - 10; xx += 45) { const len = 20 + hash(xx) * 40; ctx.beginPath(); ctx.moveTo(xx, r.y + r.h); ctx.quadraticCurveTo(xx + 6, r.y + r.h + len / 2, xx - 2, r.y + r.h + len); ctx.stroke(); } }
    }
  }
}
function drawGrenadeShape(x, y, rot, gl) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = gl ? '#c9853a' : '#5d4a9e'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 8, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#aaa'; ctx.fillRect(-3, -11, 6, 4); ctx.restore();
}
function drawItems() {
  for (const it of items) {
    if (!it.active) { if (it.spot) { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.ellipse(it.x, it.y + 16, 16, 4, 0, 0, 6.28); ctx.fill(); } continue; }
    if (!it.spot && it.life < 4 && Math.floor(it.life * 6) % 2) continue;
    const by = it.y + Math.sin(it.bob) * 4;
    ctx.save(); ctx.translate(it.x, by);
    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); glow.addColorStop(0, it.kind === 'apple' ? `rgba(255,200,60,${.55 + Math.sin(it.bob * 2) * .2})` : it.kind === 'health' ? 'rgba(120,255,140,.45)' : it.kind === 'grenade' ? 'rgba(255,210,80,.45)' : 'rgba(255,255,255,.5)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(-30, -30, 60, 60);
    if (it.kind === 'apple') { drawApple(ctx, 0, 0, 1.25); hudLabel('ULTIMATE APPLE', 0, -26); ctx.restore(); continue; }
    if (it.kind === 'health') { ctx.fillStyle = '#fff'; rr(ctx, -11, -11, 22, 22, 4); ctx.fill(); ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#e23d3d'; ctx.fillRect(-3, -8, 6, 16); ctx.fillRect(-8, -3, 16, 6); }
    else if (it.kind === 'grenade') { drawGrenadeShape(0, 0, 0); hudLabel('x2', 0, -15); }
    else { ctx.translate(-14, 0); drawGun(ctx, it.weapon); ctx.translate(14, 0); hudLabel(WEAPONS[it.weapon].name.toUpperCase(), 2, -16); }
    ctx.restore();
  }
}
function drawApple(g, x, y, sc) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  g.strokeStyle = OL; g.lineWidth = 2.2;
  g.fillStyle = '#6b3a1f'; g.fillRect(-1.5, -16, 3, 7); g.strokeRect(-1.5, -16, 3, 7);
  g.fillStyle = '#5fd35f'; g.beginPath(); g.ellipse(6, -13, 6, 3, -.5, 0, 6.28); g.fill(); g.stroke();
  const gr = g.createRadialGradient(-4, -4, 1, 0, 0, 14); gr.addColorStop(0, '#ffe58a'); gr.addColorStop(.45, '#ffb627'); gr.addColorStop(1, '#e0441c');
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, -8); g.bezierCurveTo(8, -14, 15, -6, 13, 2); g.bezierCurveTo(11, 11, 4, 13, 0, 10); g.bezierCurveTo(-4, 13, -11, 11, -13, 2); g.bezierCurveTo(-15, -6, -8, -14, 0, -8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-6, -3, 2.2, 3.6, -.4, 0, 6.28); g.fill();
  g.restore();
}
function hudLabel(s, x, y) { ctx.font = '700 11px "Chakra Petch", sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.strokeText(s, x, y); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); }
function drawChar(c) {
  if (!c.alive) return;
  ctx.save(); ctx.translate(c.x, c.y + c.h / 2);
  if (c.ult > 0) {
    const pu = .5 + Math.sin(G.elapsed * 12) * .5, blink = c.ult < 2 && Math.floor(c.ult * 8) % 2;
    if (!blink) {
      const ag = ctx.createRadialGradient(0, -28, 6, 0, -28, 54); ag.addColorStop(0, 'rgba(255,220,90,.55)'); ag.addColorStop(1, 'rgba(255,160,40,0)');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(0, -28, 54, 0, 6.28); ctx.fill();
      ctx.strokeStyle = `rgba(255,${200 + pu * 55},80,${.7 + pu * .3})`; ctx.lineWidth = 3; ctx.setLineDash([10, 6]); ctx.lineDashOffset = -G.elapsed * 60;
      ctx.beginPath(); ctx.arc(0, -28, 44 + pu * 3, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  if (c.shield > 0) { ctx.strokeStyle = `rgba(160,220,255,${.4 + Math.sin(G.elapsed * 20) * .2})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -30, 40, 0, 6.28); ctx.stroke(); }
  drawAvatar(ctx, c.av, { facing: c.facing, aim: c.aim, walk: c.walk, air: !c.onGround, flying: c.flying, crouch: c.crouch, hurt: c.hurtT > 0, gun: c.weapons[c.cur].key, melee: c.meleeT > 0 ? c.meleeT / .25 : 0 }, c.color);
  ctx.restore();
  const top = c.y + c.h / 2 - 72 + (c.crouch ? 10 : 0);
  ctx.font = '700 12px "Chakra Petch", sans-serif'; ctx.textAlign = 'center';
  const label = c.isPlayer ? c.name + ' (YOU)' : c.name;
  ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.strokeText(label, c.x, top - 6); ctx.fillStyle = c.isPlayer ? '#d9ccff' : (G.mode === 'team' ? (c.team === 'A' ? '#9cc3ff' : '#ff9c9c') : '#fff'); ctx.fillText(label, c.x, top - 6);
  ctx.fillStyle = OL; ctx.fillRect(c.x - 19, top - 1, 38, 6);
  ctx.fillStyle = c.hp > 50 ? '#5fe3a1' : c.hp > 25 ? '#ffc93c' : '#ff4d4d'; ctx.fillRect(c.x - 18, top, 36 * Math.max(0, c.hp) / 100, 4);
}
function traceShot(x, y, vx, vy, grav, maxLen, bounces, owner) {
  const pts = [[x, y]]; let len = 0, hit = null; const st = 9, sp = Math.hypot(vx, vy) || 1, dt = st / sp;
  for (let i = 0; i < 600 && len < maxLen; i++) {
    const px = x, py = y; vy += grav * dt; x += vx * dt; y += vy * dt; len += st;
    if (x < 0 || x > WW || y < 0 || y > WH) { pts.push([x, y]); break; }
    if (solidAt(x, y)) {
      if (bounces > 0) { bounces--; const hx = solidAt(x, py), hy = solidAt(px, y); if (hx) vx = -vx; if (hy) vy = -vy; if (!hx && !hy) { vx = -vx; vy = -vy; } x = px; y = py; pts.push([x, y]); continue; }
      pts.push([px, py]); hit = 'wall'; break;
    }
    const t = charAt(x, y, owner); if (t && isEnemy(owner, t)) { pts.push([x, y]); hit = 'enemy'; break; }
    if (i % 4 === 0) pts.push([x, y]);
  }
  if (!hit) pts.push([x, y]);
  return { pts, hit };
}
function drawAimLine(c) {
  if (!c.alive || c.meleeT > 0) return;
  const key = c.weapons[c.cur].key, def = WEAPONS[key], sh = shoulder(c);
  const off = def.len + 30, ox = sh.x + Math.cos(c.aim) * off, oy = sh.y + Math.sin(c.aim) * off;
  if (solidAt(ox, oy)) return;
  const arc = def.type === 'gl';
  const r = traceShot(ox, oy, Math.cos(c.aim) * def.speed, Math.sin(c.aim) * def.speed - (arc ? 60 : 0), arc ? GRAV * .8 : 0, arc ? 190 : def.type === 'flame' ? 90 : 135, 0, c);
  const enemy = r.hit === 'enemy';
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([11, 10]);
  ctx.beginPath(); r.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.strokeStyle = 'rgba(27,23,48,.4)'; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = enemy ? 'rgba(255,90,90,.95)' : 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.6; ctx.stroke();
  ctx.restore();
}
function drawProjectiles() {
  ctx.lineCap = 'round';
  for (const b of bullets) {
    if (b.type === 'flame') {
      const t = 1 - b.life / b.max, s = 6 + t * 22;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = t < .3 ? 'rgba(255,240,170,.55)' : t < .65 ? 'rgba(255,140,40,.45)' : 'rgba(200,60,20,.3)';
      ctx.beginPath(); ctx.arc(b.x, b.y, s, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    } else if (b.type === 'rocket') {
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx));
      ctx.fillStyle = '#5b6b33'; ctx.fillRect(-12, -3.5, 18, 7); ctx.fillStyle = '#c33'; ctx.beginPath(); ctx.moveTo(6, -3.5); ctx.lineTo(13, 0); ctx.lineTo(6, 3.5); ctx.fill();
      ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(-14, 0, 4 + Math.random() * 3, 0, 6.28); ctx.fill(); ctx.restore();
    } else {
      const sp = Math.hypot(b.vx, b.vy), len = b.key === 'sniper' ? 70 : b.type === 'laser' ? 34 : 22;
      if (b.type === 'laser') { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(95,247,255,.35)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx / sp * len, b.y - b.vy / sp * len); ctx.stroke(); ctx.globalCompositeOperation = 'source-over'; }
      ctx.strokeStyle = b.col; ctx.lineWidth = b.key === 'sniper' || b.type === 'laser' ? 3 : 2.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx / sp * len, b.y - b.vy / sp * len); ctx.stroke();
    }
  }
  for (const g of grenades) { drawGrenadeShape(g.x, g.y, g.rot, g.contact); if (!g.contact && g.fuse < .6 && Math.floor(g.fuse * 12) % 2) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(g.x, g.y - 12, 3, 0, 6.28); ctx.fill(); } }
}
function drawParticles(glowPass) {
  for (const p of particles) {
    if (!!p.glow !== glowPass) continue;
    const a = clamp(p.life / p.max, 0, 1);
    if (p.ring) { ctx.strokeStyle = `rgba(255,240,190,${a})`; ctx.lineWidth = 8 * a; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1.2 - a * .8), 0, 6.28); ctx.stroke(); continue; }
    if (p.helmet) { ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, Math.PI, 0); ctx.fill(); continue; }
    ctx.globalAlpha = p.smoke ? a * .5 : a; ctx.fillStyle = p.col;
    if (p.shell) ctx.fillRect(p.x, p.y, 4, 2);
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.glow ? a : 1), 0, 6.28); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground();
  const s = viewScale(), sx = (Math.random() - .5) * cam.shake, sy = (Math.random() - .5) * cam.shake;
  ctx.save(); ctx.translate(VW / 2 + sx, VH / 2 + sy); ctx.scale(s, s); ctx.translate(-cam.x, -cam.y);
  drawLevel(); drawItems(); drawParticles(false);
  for (const c of chars) if (!c.isPlayer) drawChar(c);
  if (G.player && (state === 'play' || state === 'paused')) drawAimLine(G.player);
  if (G.player) drawChar(G.player);
  drawProjectiles();
  ctx.globalCompositeOperation = 'lighter'; drawParticles(true); ctx.globalCompositeOperation = 'source-over';
  ctx.font = '700 14px "Chakra Petch", sans-serif'; ctx.textAlign = 'center';
  for (const f of floaters) { ctx.globalAlpha = clamp(f.t / .5, 0, 1); ctx.lineWidth = 3; ctx.strokeStyle = OL; ctx.strokeText(f.s, f.x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.s, f.x, f.y); }
  ctx.globalAlpha = 1; ctx.restore();
  if (state === 'play' || state === 'paused') { drawCanvasHUD(); updateHUD(); }
}
function txt(s, x, y, size, col, font = 'Chakra Petch', weight = 700) {
  ctx.font = `${weight} ${size}px "${font}", sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = OL; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function drawCanvasHUD() {
  const p = G.player;
  if (p.alive && p.hp < 35) { const v = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .3, VW / 2, VH / 2, Math.max(VW, VH) * .7); v.addColorStop(0, 'rgba(200,0,0,0)'); v.addColorStop(1, `rgba(200,0,0,${.35 + Math.sin(G.elapsed * 6) * .1})`); ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH); }
  // off-screen enemy arrows
  const s = viewScale();
  if (p.alive) for (const c of chars) {
    if (!isEnemy(p, c)) continue;
    const sx = (c.x - cam.x) * s + VW / 2, sy = (c.y - cam.y) * s + VH / 2;
    if (sx > 0 && sx < VW && sy > 0 && sy < VH) continue;
    if (Math.hypot(c.x - p.x, c.y - p.y) > 1500) continue;
    const a = Math.atan2(sy - VH / 2, sx - VW / 2), m = 26;
    const ex = clamp(sx, m, VW - m), ey = clamp(sy, m + 60, VH - m);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = 'rgba(255,70,70,.9)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  const ap = items.find(i => i.kind === 'apple' && i.active);
  if (ap) {
    const sx = (ap.x - cam.x) * s + VW / 2, sy = (ap.y - cam.y) * s + VH / 2;
    if (!(sx > 0 && sx < VW && sy > 0 && sy < VH)) {
      const a = Math.atan2(sy - VH / 2, sx - VW / 2), m = 34, ex = clamp(sx, m, VW - m), ey = clamp(sy, m + 60, VH - m);
      ctx.save(); ctx.translate(ex, ey); ctx.save(); ctx.rotate(a); ctx.fillStyle = '#ffc23d'; ctx.strokeStyle = OL; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(10, -9); ctx.lineTo(10, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      drawApple(ctx, 0, 2, .8 + Math.sin(G.elapsed * 6) * .06); ctx.restore();
    }
  }
  if (p.alive && p.ult > 0) {
    const v = ctx.createRadialGradient(VW / 2, VH / 2, Math.min(VW, VH) * .35, VW / 2, VH / 2, Math.max(VW, VH) * .75); v.addColorStop(0, 'rgba(255,200,60,0)'); v.addColorStop(1, `rgba(255,190,40,${.22 + Math.sin(G.elapsed * 8) * .06})`); ctx.fillStyle = v; ctx.fillRect(0, 0, VW, VH);
    const bw = 170, bx = VW / 2 - bw / 2, by = VH - 30;
    txt('INVINCIBLE ' + p.ult.toFixed(1) + 's', VW / 2, by - 6, 14, '#ffd34d');
    ctx.fillStyle = OL; rr(ctx, bx - 2, by, bw + 4, 9, 4); ctx.fill(); ctx.fillStyle = '#ffc23d'; rr(ctx, bx, by + 2, bw * p.ult / ULT_TIME, 5, 3); ctx.fill();
  }
  if (announce.t > 0) {
    const a = clamp(announce.t / .4, 0, 1), sc = 1 + Math.max(0, announce.t - 1.6) * 1.5, small = VW < 760, y = VH * .34;
    ctx.globalAlpha = a;
    if (announce.text) {
      ctx.font = `400 ${small ? 26 : 38}px Bungee`; const tw = ctx.measureText(announce.text).width + 60;
      ctx.save(); ctx.translate(VW / 2, y); ctx.scale(sc, sc);
      ctx.fillStyle = 'rgba(30,22,62,.85)'; rr(ctx, -tw / 2, -(small ? 34 : 46), tw, small ? 58 : 76, 14); ctx.fill(); ctx.strokeStyle = '#8f6bff'; ctx.lineWidth = 3; ctx.stroke();
      txt(announce.text, 0, small ? -2 : -4, small ? 26 : 38, '#ffc23d', 'Bungee', 400);
      if (announce.sub) txt(announce.sub.toUpperCase(), 0, small ? 16 : 22, 12, '#fff');
      ctx.restore();
    } else if (announce.sub) txt(announce.sub, VW / 2, y, 16, '#fff');
    ctx.globalAlpha = 1;
  }
  if (!touch.used && p.alive) {
    const cw = WEAPONS[p.weapons[p.cur].key];
    const cx = mouse.x, cy = mouse.y, r = 8 + (p.cd > 0 ? 4 : 0) + cw.spread * 40;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.shadowColor = '#000'; ctx.shadowBlur = 3;
    ctx.beginPath(); ctx.moveTo(cx - r - 6, cy); ctx.lineTo(cx - r, cy); ctx.moveTo(cx + r, cy); ctx.lineTo(cx + r + 6, cy); ctx.moveTo(cx, cy - r - 6); ctx.lineTo(cx, cy - r); ctx.moveTo(cx, cy + r); ctx.lineTo(cx, cy + r + 6); ctx.stroke();
    ctx.fillStyle = '#ff5a36'; ctx.fillRect(cx - 1.5, cy - 1.5, 3, 3); ctx.shadowBlur = 0;
  }
  if (p.alive && p.reloadT > 0) txt('RELOAD...', VW / 2, VH * .62, 14, '#c3a8ff');
  else if (p.alive && p.weapons[p.cur].mag === 0 && p.weapons[p.cur].reserve > 0) txt('RELOAD', VW / 2, VH * .62, 14, '#ff6b6b');
  else if (p.alive && p.weapons[p.cur].key === 'minigun' && p.spin > 0 && p.spin < 1) txt('SPINNING UP...', VW / 2, VH * .62, 13, '#ffd76b');
}

// ================= HTML HUD =================
const hudCache = {};
function setTxt(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; $(id).textContent = v; } }
const wIconCtx = $('wIcon').getContext('2d'), pIconCtx = $('pIcon').getContext('2d');
function paintIcon(g, key, w, h, sc) { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.setTransform(sc, 0, 0, sc, w / 2 - 14 * sc, h / 2); drawGun(g, key); }
function updateHUD() {
  const p = G.player;
  const hp = Math.max(0, p.hp), hpEl = $('hpBar'); hpEl.style.width = hp + '%'; hpEl.classList.toggle('low', hp < 35);
  $('jetBar').style.width = p.fuel + '%';
  const mm = Math.floor(G.time / 60), ss = Math.floor(G.time % 60);
  setTxt('timer', `${mm}:${ss.toString().padStart(2, '0')}`); $('timer').classList.toggle('low', G.time < 30);
  if (G.mode === 'team') {
    const h = `TEAM DEATHMATCH <b>${TEAM_NAME.A} ${G.teamScore.A} — ${G.teamScore.B} ${TEAM_NAME.B}</b>`; if (hudCache.mode !== h) { hudCache.mode = h; $('modePill').innerHTML = h; }
    setTxt('goalTxt', `First team to ${G.limit} kills wins · You are on ${TEAM_NAME.A}`);
  } else {
    const lead = chars.slice().sort((a, b) => b.kills - a.kills)[0];
    const h = `FREE FOR ALL <b>YOU ${p.kills} · TOP ${lead.name.toUpperCase()} ${lead.kills}</b>`; if (hudCache.mode !== h) { hudCache.mode = h; $('modePill').innerHTML = h; }
    setTxt('goalTxt', `First to ${G.limit} kills wins`);
  }
  const w = p.weapons[p.cur], def = WEAPONS[w.key];
  setTxt('wName', def.name.toUpperCase());
  setTxt('wMag', p.reloadT > 0 ? 'RLD' : String(w.mag).padStart(3, '0'));
  $('wMag').classList.toggle('empty', w.mag === 0);
  setTxt('wRes', w.reserve === Infinity ? '∞' : String(w.reserve).padStart(3, '0'));
  if (hudCache.icon !== w.key) { hudCache.icon = w.key; paintIcon(wIconCtx, w.key, 132, 44, 2.2); }
  const other = p.weapons.find((x, i) => i !== p.cur);
  setTxt('w2', other ? `Secondary: ${WEAPONS[other.key].name}` : 'Secondary: empty');
  setTxt('gCount', String(p.grenades)); setTxt('tGrenN', String(p.grenades));
  // feed
  if (feedDirty) {
    feedDirty = false;
    $('feed').innerHTML = feed.map(f => f.k ? `<div><span style="color:${f.kc}">${f.k}</span><span class="x">✕</span><span style="color:${f.vc}">${f.v}</span></div>` : `<div><span style="color:${f.vc}">${f.v}</span> ${f.w}</div>`).join('');
  }
  // pickup prompt
  const it = p.alive ? G.nearItem : null;
  $('pickPrompt').classList.toggle('hidden', !it);
  if (it) { setTxt('pickTxt', (touch.used ? '' : 'F — ') + 'PICK UP ' + WEAPONS[it.weapon].name.toUpperCase()); if (hudCache.picon !== it.weapon) { hudCache.picon = it.weapon; paintIcon(pIconCtx, it.weapon, 80, 30, 1.4); } }
  $('tPick').style.opacity = it ? 1 : .55;
  // death
  const dead = !p.alive && !G.over && G.deathInfo;
  $('deathBox').classList.toggle('hidden', !dead); $('respawnTxt').classList.toggle('hidden', !dead);
  if (dead) {
    const d = G.deathInfo;
    setTxt('dName', d.name); $('deathBox').querySelector('em').style.display = d.bot ? '' : 'none';
    setTxt('dWeap', d.weap); setTxt('dHp', d.self ? 'oops' : `${d.hp} HP LEFT`);
    setTxt('respN', String(Math.max(1, Math.ceil(p.respawnT))));
  }
  if (scoreOpen) renderBoard($('liveBoard'));
}

// ================= FLOW / UI =================
let scoreOpen = false;
function showScore(on) { if (state !== 'play' && on) return; scoreOpen = on; $('scoreOv').classList.toggle('hidden', !on); if (on) renderBoard($('liveBoard')); }
function renderBoard(el) {
  const list = chars.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  const h = '<tr><th>#</th><th>Name</th>' + (G.mode === 'team' ? '<th>Team</th>' : '') + '<th>Kills</th><th>Deaths</th></tr>' + list.map((c, i) => `<tr class="${c.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td><span class="sw" style="background:${c.color}"></span>${c.name}${c.isPlayer ? ' (You)' : ''}</td>${G.mode === 'team' ? `<td>${TEAM_NAME[c.team]}</td>` : ''}<td>${c.kills}</td><td>${c.deaths}</td></tr>`).join('');
  if (el._h !== h) { el._h = h; el.innerHTML = h; }
}
document.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on');
  const k = seg.dataset.key; settings[k] = k === 'bots' ? +b.dataset.v : b.dataset.v; Audio.init(); Audio.click();
  if (k === 'map') drawMapThumb();
}));
function drawMapThumb() {
  const c = $('mapThumb'), g = c.getContext('2d'), m = MAPS[settings.map], th = m.th;
  const gr = g.createLinearGradient(0, 0, 0, 120); for (const [o, col] of th.sky) gr.addColorStop(o, col);
  g.fillStyle = gr; g.fillRect(0, 0, 560, 120);
  const sx = 560 / 3600, sy = 120 / 1800;
  for (const [x, y, w, h] of m.rects) { g.fillStyle = th.body[0]; g.fillRect(x * sx, y * sy, Math.max(2, w * sx), Math.max(2, h * sy)); g.fillStyle = th.style === 'neon' ? th.cap : th.grass; g.fillRect(x * sx, y * sy, Math.max(2, w * sx), 2); }
  g.font = '400 18px Bungee'; g.fillStyle = '#fff'; g.strokeStyle = OL; g.lineWidth = 4; g.textAlign = 'left'; g.strokeText(m.name.toUpperCase(), 12, 28); g.fillText(m.name.toUpperCase(), 12, 28);
}
function startGame(networkStart) {
  const net = window.JetpackLanLobby;
  if (net && net.isConnected && net.isConnected() && net.isClient && net.isClient() && !networkStart) {
    const st = $('lanStatus'); if (st) { st.textContent = 'Waiting for the room host to start the match.'; st.className = 'lan-status'; }
    return;
  }
  if (net && net.isConnected && net.isConnected() && net.isHost && net.isHost() && !networkStart) {
    net.send({ type:'match_start', map:settings.map, mode:settings.mode, diff:settings.diff, limit:settings.mode === 'team' ? 30 : 20, seed:Math.floor(Math.random()*2147483647) });
  }
  pressQueue.length = 0; Audio.init(); newGame(false); state = 'play';
  ['menu', 'over', 'pause', 'avatar', 'scoreOv'].forEach(id => $(id).classList.add('hidden'));
  $('hud').classList.remove('hidden');
  $('touch').classList.toggle('hidden', !IS_TOUCH);
  for (const k in hudCache) delete hudCache[k]; feedDirty = true;
  showAnnounce(G.mode === 'team' ? `GO ${TEAM_NAME.A}!` : 'FIGHT!', G.mode === 'team' ? `${TEAM_NAME.A} vs ${TEAM_NAME.B} · ${MAP.name}` : `${MAP.name} · First to ${G.limit} kills`);
}
function togglePause() {
  if (state === 'play') { state = 'paused'; $('pause').classList.remove('hidden'); Audio.setJet(false); }
  else if (state === 'paused') { state = 'play'; $('pause').classList.add('hidden'); }
}
function toMenu() {
  state = 'menu'; newGame(true);
  ['pause', 'over', 'hud', 'touch', 'scoreOv', 'avatar'].forEach(id => $(id).classList.add('hidden'));
  $('menu').classList.remove('hidden'); refreshMini();
}
function endGame(fromNetwork) {
  if (G.over) return;
  const net = window.JetpackLanLobby;
  if (net && net.isConnected && net.isConnected()) {
    // Only the host decides when the shared match ends. Clients wait for its packet.
    if (!fromNetwork && net.isHost && !net.isHost()) return;
    if (!fromNetwork && net.isHost && net.isHost()) net.send({ type: 'match_end', time: G.time, teamScore: G.teamScore });
  }
  G.over = true; slowT = 1.2;
  setTimeout(() => {
    state = 'over'; Audio.setJet(false); showScore(false);
    const list = chars.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
    let title, sub;
    if (G.mode === 'team') {
      const A = G.teamScore.A, B = G.teamScore.B;
      title = A > B ? 'YOUR TEAM WINS!' : A < B ? 'YOUR TEAM LOST' : 'DRAW!'; sub = `${TEAM_NAME.A} ${A} — ${B} ${TEAM_NAME.B}`;
    } else {
      const top = list[0], tie = list[1] && list[1].kills === top.kills;
      if (tie) { title = 'DRAW!'; sub = 'Nobody took the lead — play again'; }
      else { title = top.isPlayer ? 'YOU WIN!' : `${top.name.toUpperCase()} WINS`; sub = top.isPlayer ? 'Absolute legend' : `You finished #${list.indexOf(G.player) + 1} — try again`; }
    }
    $('over-title').textContent = title; $('over-sub').textContent = sub;
    renderBoard($('board'));
    $('over').classList.remove('hidden'); $('touch').classList.add('hidden'); $('hud').classList.add('hidden');
  }, 1300);
}
$('start-btn').addEventListener('click', startGame);
$('again-btn').addEventListener('click', startGame);
$('menu-btn').addEventListener('click', toMenu);
$('resume-btn').addEventListener('click', togglePause);
$('quit-btn').addEventListener('click', toMenu);

// ---- avatar screen ----
const miniCtx = $('miniAv').getContext('2d'), bigCtx = $('bigAv').getContext('2d');
function paintAvatar(g, W, H, sc, t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
  g.setTransform(sc, 0, 0, sc, W / 2, H * .86);
  const aim = Math.sin(t * .8) * .5 - .15;
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 0, 22, 5, 0, 0, 6.28); g.fill();
  drawAvatar(g, playerAv, { facing: 1, aim, walk: 0, air: false, flying: false, crouch: false, hurt: false, gun: 'ak47', melee: 0 });
}
function refreshMini() { paintAvatar(miniCtx, 160, 160, 2, 0); $('miniName').textContent = playerAv.name; }
function buildAvatarUI() {
  const rows = $('avRows'); rows.innerHTML = '';
  for (const key of ['outfit', 'head', 'face', 'jet']) {
    const row = document.createElement('div'); row.className = 'av-row';
    row.innerHTML = `<label>${AV_LABEL[key]}</label><button class="arr" data-d="-1" aria-label="Previous">‹</button><div class="val"></div><button class="arr" data-d="1" aria-label="Next">›</button>`;
    const val = row.querySelector('.val');
    const show = () => { val.textContent = AV_OPTS[key].find(o => o[0] === playerAv[key])[1]; };
    row.querySelectorAll('.arr').forEach(b => b.addEventListener('click', () => {
      const opts = AV_OPTS[key], i = opts.findIndex(o => o[0] === playerAv[key]);
      playerAv[key] = opts[(i + +b.dataset.d + opts.length) % opts.length][0]; show(); Audio.init(); Audio.click();
    }));
    row._show = show; show(); rows.appendChild(row);
  }
  const cr = $('colorRow'); cr.innerHTML = '';
  COLORS.forEach(col => { const b = document.createElement('button'); b.style.background = col; b.setAttribute('aria-label', col); if (col === playerAv.color) b.classList.add('on'); b.addEventListener('click', () => { playerAv.color = col; cr.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); Audio.click(); }); cr.appendChild(b); });
  const sr = $('skinRow'); sr.innerHTML = '';
  SKINS.forEach((col, i) => { const b = document.createElement('button'); b.style.background = col; b.setAttribute('aria-label', 'skin ' + (i + 1)); if (i === playerAv.skin) b.classList.add('on'); b.addEventListener('click', () => { playerAv.skin = i; sr.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); Audio.click(); }); sr.appendChild(b); });
  $('nameInput').value = playerAv.name;
}
$('avatarCard').addEventListener('click', () => { Audio.init(); buildAvatarUI(); $('menu').classList.add('hidden'); $('avatar').classList.remove('hidden'); state = 'avatar'; });
$('nameInput').addEventListener('input', e => { playerAv.name = e.target.value.trim().slice(0, 12) || 'Tiger'; });
$('randAv').addEventListener('click', () => { const r = randomAv(playerAv.name); Object.assign(playerAv, r, { name: playerAv.name }); buildAvatarUI(); Audio.click(); });
$('avDone').addEventListener('click', () => { $('avatar').classList.add('hidden'); $('menu').classList.remove('hidden'); state = 'menu'; refreshMini(); });


// ================= LAN MULTIPLAYER REPLICATION =================
// The original offline simulation is untouched. In LAN mode each Android phone
// simulates its own character; movement snapshots and combat actions are relayed
// over the host phone's local WebSocket server.
const jjRemotePlayers = new Map();
const jjNetId = 'jj-' + Math.random().toString(36).slice(2, 10);
let jjLastNetSend = 0, jjLastMatchSend = 0;
function jjTeamForId(id) { let h = 0; for (let i=0;i<String(id).length;i++) h = (h*31 + String(id).charCodeAt(i))|0; return (Math.abs(h)%2) ? 'A' : 'B'; }
function jjEnsureRemote(m) {
  if (!m || typeof m.id !== 'string' || m.id === jjNetId) return null;
  let c = jjRemotePlayers.get(m.id);
  if (!c) {
    const av = Object.assign({ name: 'Player', outfit: 'cyber', head: 'cyberhelm', face: 'none', jet: 'plasma', color: '#2ec4b6', skin: 1 }, m.av || {});
    c = makeChar(av, false, m.team || jjTeamForId(m.id), av.color);
    c.networkRemote = true; c.ai = null; c.weapons = [{ key: 'pistol', mag: 12, reserve: Infinity }]; c.cur = 0;
    c.netInitialized = false; chars.push(c); jjRemotePlayers.set(m.id, c);
  }
  return c;
}
function jjApplyRemote(m) {
  if (!m || typeof m !== 'object') return;
  if (m.type === 'match_start') {
    settings.map = ['desert','snow','jungle','neon'].includes(m.map) ? m.map : settings.map;
    settings.mode = m.mode === 'team' ? 'team' : 'ffa';
    settings.diff = ['easy','med','hard'].includes(m.diff) ? m.diff : 'med';
    startGame(true);
    return;
  }
  if (m.type === 'match_end') {
    if (G && !G.over) endGame(true);
    return;
  }
  if (m.type === 'match_state' && G && !G.over) {
    if (Number.isFinite(m.time)) G.time = Math.max(0, Math.min(300, m.time));
    if (m.teamScore) { G.teamScore.A = Number(m.teamScore.A)||0; G.teamScore.B = Number(m.teamScore.B)||0; }
    if (Array.isArray(m.items) && m.items.length < 80) {
      items = m.items.map(i => ({ x:Number(i.x)||0, y:Number(i.y)||0, vy:Number(i.vy)||0, kind:['weapon','health','grenade','apple'].includes(i.kind)?i.kind:'weapon', weapon:i.weapon||null, mag:i.mag, reserve:i.reserve, active:!!i.active, respawn:Math.max(0,Number(i.respawn)||0), spot:!!i.spot, bob:Number(i.bob)||0, life:Number.isFinite(i.life)?i.life:Infinity, falling:!!i.falling, noPick:Math.max(0,Number(i.noPick)||0) }));
    }
    if (Number.isFinite(m.appleT)) G.appleT=Math.max(0,m.appleT);
    return;
  }
  if (m.type === 'action') {
    const c = jjEnsureRemote(m); if (!c || !G || state !== 'play') return;
    if (m.action === 'bullet' && m.bullet) {
      const b = m.bullet; bullets.push({ x:Number(b.x)||0, y:Number(b.y)||0, vx:Number(b.vx)||0, vy:Number(b.vy)||0, life:Math.max(.01,Math.min(5,Number(b.life)||.1)), max:Math.max(.01,Math.min(5,Number(b.max)||.1)), dmg:Math.max(0,Math.min(250,Number(b.dmg)||0)), owner:c, key:WEAPONS[b.key]?b.key:'pistol', type:['bullet','flame','laser','rocket'].includes(b.type)?b.type:'bullet', col:String(b.col||'#ffe08a'), bounces:Math.max(0,Math.min(4,Number(b.bounces)||0)) });
    } else if (m.action === 'grenade' && m.grenade) {
      const g=m.grenade; grenades.push({ x:Number(g.x)||0,y:Number(g.y)||0,vx:Number(g.vx)||0,vy:Number(g.vy)||0,fuse:Math.max(.05,Math.min(4,Number(g.fuse)||1)),owner:c,rot:0,contact:!!g.contact,dmg:Math.max(0,Math.min(250,Number(g.dmg)||0)) });
    } else if (m.action === 'melee') doMelee(c);
    else if (m.action === 'pickup') {
      const idx=Number(m.itemIndex), it=Number.isInteger(idx)?items[idx]:null;
      if (it && it.active) {
        if (it.kind === 'weapon') takeWeapon(c,it);
        else if (it.kind === 'apple' || m.apple) { c.ult=ULT_TIME; c.hp=100; it.active=false; G.appleT=28; }
        else if (it.kind === 'health') { c.hp=Math.min(100,c.hp+50); it.active=false; it.respawn=14; }
        else if (it.kind === 'grenade') { c.grenades=Math.min(5,c.grenades+2); it.active=false; it.respawn=14; }
      }
    }
    return;
  }
  if (m.type !== 'state') return;
  const c = jjEnsureRemote(m); if (!c) return;
  c.name = String(m.name || c.name).slice(0, 12); c.color = m.color || c.av.color;
  c.team = m.team || c.team;
  c.netX = Number(m.x) || 0; c.netY = Number(m.y) || 0;
  if (!c.netInitialized) { c.x=c.netX; c.y=c.netY; c.netInitialized=true; }
  c.hp = Math.max(0, Math.min(100, Number(m.hp) || 0)); c.alive = !!m.alive;
  c.aim = Number(m.aim) || 0; c.facing = Number(m.facing) || 1;
  c.fuel = Math.max(0, Math.min(100, Number(m.fuel) || 0)); c.flying = !!m.flying; c.crouch = !!m.crouch;
  c.h = c.crouch ? CROUCH_H : STAND_H;
  c.kills = Math.max(0, Number(m.kills)||0); c.deaths = Math.max(0, Number(m.deaths)||0);
  c.grenades = Math.max(0, Number(m.grenades)||0); c.ult = Math.max(0, Number(m.ult)||0);
  c.vx = Number(m.vx)||0; c.vy = Number(m.vy)||0; c.onGround=!!m.onGround;
  const weapon = WEAPONS[m.weapon] ? m.weapon : 'pistol';
  c.weapons = [{ key: weapon, mag: Math.max(0,Number(m.mag)||0), reserve: Infinity }]; c.cur=0;
}
function jjSendAction(payload) {
  const net=window.JetpackLanLobby; if (!net || !net.isConnected || !net.isConnected()) return;
  net.send(Object.assign({ type:'action', id:jjNetId, name:playerAv.name, av:playerAv, team:G && G.player ? G.player.team : 'A' }, payload));
}
window.JetpackGameNet = {
  receive: jjApplyRemote,
  startMatch: msg => jjApplyRemote(Object.assign({type:'match_start'},msg||{})),
  playerCount: () => jjRemotePlayers.size + 1,
  removeById: (id, name) => { const c = id ? jjRemotePlayers.get(id) : null; if (c) { const i=chars.indexOf(c); if(i>=0) chars.splice(i,1); jjRemotePlayers.delete(id); return; } for (const [key,player] of jjRemotePlayers) if (player.name === name) { const i=chars.indexOf(player); if(i>=0) chars.splice(i,1); jjRemotePlayers.delete(key); break; } },
  removeByName: name => { for (const [id,c] of jjRemotePlayers) if (c.name === name) { const i=chars.indexOf(c); if(i>=0) chars.splice(i,1); jjRemotePlayers.delete(id); } }
};
// Smooth remote proxies between low-bandwidth snapshots.
const jjOriginalUpdateChar = updateChar;
updateChar = function(c, dt) {
  if (c.networkRemote) {
    if (c.netInitialized) { c.x=lerp(c.x,c.netX,Math.min(1,dt*18)); c.y=lerp(c.y,c.netY,Math.min(1,dt*18)); }
    c.aim = c.aim || 0; c.facing = c.facing || 1;
    return;
  }
  return jjOriginalUpdateChar(c,dt);
};
setInterval(() => {
  const net=window.JetpackLanLobby; if (!net || !net.isConnected || !net.isConnected() || state!=='play' || !G || !G.player) return;
  const now=performance.now(); if (now-jjLastNetSend<75) return; jjLastNetSend=now;
  const p=G.player, w=p.weapons[p.cur]||{key:'pistol',mag:0};
  net.send({ type:'state', id:jjNetId, name:p.name, x:p.x, y:p.y, vx:p.vx, vy:p.vy, hp:p.hp, alive:p.alive,
    aim:p.aim, facing:p.facing, fuel:p.fuel, flying:p.flying, crouch:p.crouch, onGround:p.onGround,
    weapon:w.key, mag:w.mag, kills:p.kills, deaths:p.deaths, grenades:p.grenades, ult:p.ult,
    color:p.color, team:p.team, av:playerAv });
  if (net.isHost && net.isHost() && now-jjLastMatchSend>250) {
    jjLastMatchSend=now; net.send({type:'match_state',time:G.time,teamScore:G.teamScore,appleT:G.appleT,items:items.map(i=>({x:i.x,y:i.y,vy:i.vy,kind:i.kind,weapon:i.weapon,mag:i.mag,reserve:i.reserve,active:i.active,respawn:i.respawn,spot:i.spot,bob:i.bob,life:i.life,falling:i.falling,noPick:i.noPick}))});
  }
}, 35);
// ================= LOOP =================
newGame(true); drawMapThumb();
document.fonts && document.fonts.ready.then(() => { drawMapThumb(); refreshMini(); });
refreshMini();
const FIXED = 1 / 60; let acc = 0, last = performance.now(), manual = false;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now;
  if (!manual) { acc += dt; while (acc >= FIXED) { step(state === 'avatar' ? 0 : FIXED); acc -= FIXED; } }
  if (state === 'avatar') paintAvatar(bigCtx, 360, 400, 4.6, now / 1000);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.advanceTime = ms => { manual = true; const n = Math.round(ms / (1000 / 60)); for (let i = 0; i < n; i++) step(FIXED); render(); manual = false; };
window.render_game_to_text = () => JSON.stringify({
  state, map: MAP.name, mode: G.mode, time: Math.round(G.time),
  player: G.player ? { x: Math.round(G.player.x), y: Math.round(G.player.y), hp: Math.round(G.player.hp), fuel: Math.round(G.player.fuel), alive: G.player.alive, onGround: G.player.onGround, crouch: G.player.crouch, flying: G.player.flying, weapon: G.player.weapons[G.player.cur].key, weapons: G.player.weapons.map(w => w.key + ':' + w.mag), ult: +G.player.ult.toFixed(1), kills: G.player.kills, grenades: G.player.grenades, near: G.nearItem && G.nearItem.weapon } : null,
  apple: (items.find(i => i.kind === 'apple' && i.active) || null) && 1, appleT: Math.round(G.appleT), bots: chars.filter(c => !c.isPlayer).map(c => ({ n: c.name, x: Math.round(c.x), y: Math.round(c.y), hp: Math.round(c.hp), alive: c.alive, k: c.kills, w: c.weapons[c.cur].key })),
  spawns: SPAWNS.length, items: items.length
});
window.__G = () => ({ G, chars, items, settings, playerAv });
