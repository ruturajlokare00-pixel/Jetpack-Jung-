// ================= MULTIPLAYER TRANSPORT + SYNC =================
// Works with game.js: NET (role/events/inMatch), ev() queues effects on the host,
// remoteControl() reads each remote human's input queue (c.inq).
// Host: runs the whole sim, sends a snapshot + queued effects 20x/sec via server.js relay.
// Client: sends its input 30x/sec, applies snapshots + effects, and draws.
let mpWs = null;
const MPS = { lobby: new Map(), snap: null, evq: [], acc: 0, pend: null, seq: 0 };

function mpErr(s) { $('lobbyMsg').textContent = s; }
function mpShow(on) { $('mp').classList.toggle('hidden', !on); $('menu').classList.toggle('hidden', on); }
function mpView(v) { $('lobbyHome').classList.toggle('hidden', v !== 'home'); $('lobbyRoom').classList.toggle('hidden', v !== 'room'); }
function mpSend(o) { if (mpWs && mpWs.readyState === 1) mpWs.send(JSON.stringify(o)); }
function escHtml(s) { return String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function mpConnect(onOpen) {
  if (mpWs) { const old = mpWs; mpWs = null; old.onclose = null; try { old.close(); } catch (_) {} }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  let s;
  try { s = new WebSocket(`${proto}://${location.host}/ws`); } catch (_) { return mpErr('Server se connect nahi ho paya'); }
  mpWs = s;
  s.onopen = onOpen;
  s.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (_) { return; } mpOnMsg(m); };
  s.onerror = () => {};
  s.onclose = () => {
    if (mpWs !== s) return;
    mpWs = null;
    if (NET.role) mpDropped('Connection toot gaya');
    else mpErr('Server se connection nahi bana — server.js chal raha hai?');
  };
}

// Everything from the network is sanitized before it touches the game.
function mpCleanAv(a) {
  a = a || {};
  const ok = (k, v, d) => (AV_OPTS[k].some(o => o[0] === v) ? v : d);
  return {
    name: String(a.name || 'Player').slice(0, 12) || 'Player',
    outfit: ok('outfit', a.outfit, 'cyber'), head: ok('head', a.head, 'cyberhelm'),
    face: ok('face', a.face, 'none'), jet: ok('jet', a.jet, 'plasma'),
    color: COLORS.includes(a.color) ? a.color : '#2ec4b6',
    skin: Number.isInteger(a.skin) && a.skin >= 0 && a.skin < SKINS.length ? a.skin : 1
  };
}
function mpApplySettings(s) {
  settings.map = MAPS[s.map] ? s.map : 'desert';
  settings.mode = s.mode === 'team' ? 'team' : 'ffa';
  settings.bots = [3, 5, 7].includes(+s.bots) ? +s.bots : 5;
  settings.diff = DIFF[s.diff] ? s.diff : 'med';
}

function mpOnMsg(m) {
  switch (m.t) {
    case 'room':
      NET.role = 'host'; NET.pid = 1; NET.inMatch = false; MPS.lobby = new Map();
      $('roomCode').textContent = m.code; mpView('room'); mpRenderLobby(); mpErr('');
      break;
    case 'joined':
      NET.role = 'client'; NET.pid = m.pid; NET.inMatch = false;
      $('roomCode').textContent = m.code; $('plist').innerHTML = '';
      $('mpStart').classList.add('hidden'); $('mpWait').textContent = 'Host ke start karne ka wait...';
      mpView('room'); mpErr('');
      break;
    case 'err': mpErr(m.msg); break;
    case 'peer+':
      if (NET.role === 'host') { MPS.lobby.set(m.pid, { pid: m.pid, av: mpCleanAv(Object.assign({}, m.av, { name: m.name })) }); mpRenderLobby(); }
      break;
    case 'peer-':
      if (NET.role === 'host') {
        MPS.lobby.delete(m.pid); mpRenderLobby();
        if (NET.inMatch) chars = chars.filter(c => c.pid !== m.pid);
      }
      break;
    case 'm': // host: input from a client
      if (NET.role === 'host' && m.m && m.m.t === 'in') mpRemoteInput(m.from, m.m);
      break;
    case 'start': // client: host started a match
      if (NET.role === 'client') { mpApplySettings(m.settings); NET.inMatch = true; startGame(m.humans); }
      break;
    case 's': if (NET.role === 'client') MPS.snap = m; break;
    case 'ev': if (NET.role === 'client') for (const e of m.ev) MPS.evq.push(e); break;
    case 'hostleft': if (NET.role === 'client') mpDropped('Host ne room band kar diya'); break;
  }
}

// ---- lobby UI ----
function mpRenderLobby() {
  const me = mpCleanAv(playerAv);
  const rows = [{ name: me.name + ' (host)', color: me.color }, ...[...MPS.lobby.values()].map(p => ({ name: p.av.name, color: p.av.color }))];
  $('plist').innerHTML = rows.map(r => `<div class="pl"><span class="sw" style="background:${r.color}"></span>${escHtml(r.name)}</div>`).join('');
  $('mpWait').textContent = `${rows.length} player · ${settings.mode === 'team' ? 'Team Battle' : 'Free for All'} · ${settings.bots} bots · ${MAPS[settings.map].name}`;
  $('mpStart').classList.remove('hidden');
}
$('mpBtn').addEventListener('click', () => { Audio.init(); Audio.click(); mpView('home'); mpErr(''); mpShow(true); });
$('mpCreate').addEventListener('click', () => { mpErr('Room bana rahe hain...'); mpConnect(() => mpSend({ t: 'create' })); });
$('mpJoin').addEventListener('click', () => {
  const code = $('joinCode').value.trim().toUpperCase();
  if (code.length !== 4) return mpErr('4 letter ka room code daalo');
  mpErr('Join ho rahe hain...');
  mpConnect(() => mpSend({ t: 'join', code, name: playerAv.name, av: mpCleanAv(playerAv) }));
});
$('mpStart').addEventListener('click', () => hostStartMatch());
$('mpBack').addEventListener('click', () => { mpLeave(); mpShow(false); });

// ---- host ----
// Called by game.js for the first match and for "PLAY AGAIN".
function hostStartMatch() {
  if (NET.role !== 'host') return;
  const humans = [{ pid: 1, av: mpCleanAv(playerAv) }];
  for (const p of [...MPS.lobby.values()].sort((a, b) => a.pid - b.pid)) humans.push({ pid: p.pid, av: p.av });
  mpSend({ t: 'to', to: '*', m: { t: 'start', settings: { map: settings.map, mode: settings.mode, bots: settings.bots, diff: settings.diff }, humans } });
  NET.inMatch = true; NET.events = []; NET.tick = 0;
  startGame(humans);
  for (const c of chars) if (c.remote) c.inq = [];
  mpShow(false);
}
// Client input arrives here: queued per remote character; remoteControl() consumes it one per sim tick.
function mpRemoteInput(pid, msg) {
  const c = chars.find(x => x.remote && x.pid === pid);
  const i = msg.c;
  if (!c || !c.inq || !i) return;
  c.inq.push({
    mx: clamp(+i.mx || 0, -1, 1), up: !!i.up, shoot: !!i.shoot, aim: Number.isFinite(i.aim) ? i.aim : c.aim, crouch: !!i.crouch,
    gren: !!i.gren, reload: !!i.reload, pick: !!i.pick, melee: !!i.melee,
    swap: clamp(+i.swap || 0, 0, 4), sel: Number.isInteger(i.sel) ? i.sel : -1, seq: +i.seq || 0
  });
  if (c.inq.length > 30) c.inq.splice(0, c.inq.length - 30);
}
// Every sim tick on the host (game.js calls this). Sends at 20 Hz.
function netHostTick() {
  if (NET.role !== 'host' || !NET.inMatch) return;
  if (++NET.tick % 3) return;
  const per = {}, remotes = [...MPS.lobby.keys()];
  for (const e of NET.events) {
    if (e[2] != null) (per[e[2]] ||= []).push(e);                       // addressed to one player
    else for (const pid of remotes) if (pid !== e[3]) (per[pid] ||= []).push(e); // everyone (except e[3])
  }
  NET.events = [];
  for (const pid in per) mpSend({ t: 'to', to: +pid, m: { t: 'ev', ev: per[pid] } });
  mpSend({ t: 'to', to: '*', m: netSnap() });
}
function netSnap() {
  const R = Math.round;
  return {
    t: 's', time: R(G.time), teamScore: G.teamScore, limit: G.limit, mode: G.mode, appleT: R(G.appleT), elapsed: G.elapsed,
    feed: feed.map(f => ({ k: f.k, kc: f.kc, v: f.v, vc: f.vc, w: f.w, t: f.t })),
    chars: chars.map(c => ({
      id: c.id, pid: c.pid || 0, name: c.name, av: c.av, color: c.color, team: c.team, human: !!c.human,
      x: R(c.x), y: R(c.y), hp: R(c.hp), alive: c.alive, aim: +c.aim.toFixed(3), facing: c.facing,
      walk: c.walk, onGround: c.onGround, flying: c.flying, crouch: c.crouch, hurtT: c.hurtT, shield: c.shield,
      ult: c.ult, meleeT: c.meleeT, burn: c.burn > 0, cur: c.cur, reloadT: c.reloadT, grenades: c.grenades,
      fuel: R(c.fuel), kills: c.kills, deaths: c.deaths, respawnT: c.respawnT, spin: c.spin, cd: c.cd, ack: c.ack || 0,
      weapons: c.weapons.map(w => ({ key: w.key, mag: w.mag, reserve: w.reserve === Infinity ? -1 : w.reserve }))
    })),
    items: items.map(i => ({ x: R(i.x), y: R(i.y), kind: i.kind, weapon: i.weapon, active: i.active, spot: i.spot, bob: i.bob, life: Number.isFinite(i.life) ? i.life : -1 })),
    bullets: bullets.map(b => ({ x: R(b.x), y: R(b.y), vx: R(b.vx), vy: R(b.vy), life: b.life, max: b.max, type: b.type, key: b.key, col: b.col })),
    grenades: grenades.map(g => ({ x: R(g.x), y: R(g.y), rot: g.rot, contact: g.contact, fuse: g.fuse }))
  };
}

// ---- client ----
// Replaces the local sim while in a match: read own keys, send input, animate.
function clientStep(dt) {
  const me = G.player;
  if (me && state === 'play') {
    const k = playerControl(me);
    const P = MPS.pend || (MPS.pend = { gren: false, reload: false, pick: false, melee: false, swap: 0, sel: -1 });
    P.mx = k.mx; P.up = k.up; P.shoot = k.shoot; P.aim = k.aim; P.crouch = k.crouch;
    P.gren = P.gren || k.gren; P.reload = P.reload || k.reload; P.pick = P.pick || k.pick; P.melee = P.melee || k.melee;
    P.swap += k.swap; if (k.sel >= 0) P.sel = k.sel;
  }
  MPS.acc += dt;
  if (MPS.acc >= 1 / 30) {
    MPS.acc = 0;
    if (me && MPS.pend) { mpSend({ t: 'in', c: Object.assign({ seq: ++MPS.seq }, MPS.pend) }); MPS.pend = null; }
  }
  const kk = Math.min(1, dt * 18);
  for (const c of chars) {
    if (c.tx === undefined) continue;
    if (Math.abs(c.x - c.tx) > 300 || Math.abs(c.y - c.ty) > 300) { c.x = c.tx; c.y = c.ty; } // respawn: don't glide
    else { c.x = lerp(c.x, c.tx, kk); c.y = lerp(c.y, c.ty, kk); }
  }
  G.nearItem = null;
  if (me && me.alive) for (const it of items) {
    if (it.active && it.kind === 'weapon' && Math.abs(it.x - me.x) < 34 && Math.abs(it.y - me.y) < 44) { G.nearItem = it; break; }
  }
  G.elapsed += dt;
  updateParticles(dt); tickFeed(dt); updateCamera(dt);
  Audio.setJet(!!(me && me.flying && state === 'play'));
  if (state === 'play') Audio.music();
}
// Called every frame on a client: apply the newest snapshot, then queued effects.
function netFlush() {
  if (MPS.snap) { const s = MPS.snap; MPS.snap = null; mpApplySnap(s); }
  while (MPS.evq.length) mpApplyEvent(MPS.evq.shift());
}
function mpApplySnap(s) {
  G.mode = s.mode; G.limit = s.limit; G.teamScore = s.teamScore; G.time = s.time; G.appleT = s.appleT;
  const old = new Map(chars.map(c => [c.id, c]));
  chars = s.chars.map(sc => {
    const { x, y, weapons, ...rest } = sc;
    const c = old.get(sc.id) || { x, y, aim: sc.aim, id: sc.id };
    const localAim = c.aim;
    Object.assign(c, rest);
    c.weapons = weapons.map(w => ({ key: w.key, mag: w.mag, reserve: w.reserve < 0 ? Infinity : w.reserve }));
    c.tx = x; c.ty = y; c.w = 26; c.h = c.crouch ? CROUCH_H : STAND_H;
    c.isPlayer = sc.pid === NET.pid;
    if (c.isPlayer) { c.aim = localAim; c.facing = Math.cos(c.aim) >= 0 ? 1 : -1; } // own aim is local: no lag
    return c;
  });
  G.player = chars.find(c => c.isPlayer) || null;
  items = s.items.map(i => ({ ...i, life: i.life < 0 ? Infinity : i.life }));
  bullets = s.bullets; grenades = s.grenades;
  feed = s.feed; feedDirty = true;
}
function mpApplyEvent(e) {
  const [t, d] = e;
  const byId = id => chars.find(c => c.id === id);
  switch (t) {
    case 'f': { const c = byId(d[0]), w = WEAPONS[d[1]]; if (w) Audio.shot(w.snd, vol(c ? c.x : cam.x, c ? c.y : cam.y)); break; }
    case 'm': { const c = byId(d[0]); if (c && cameraNear(c.x, c.y)) Audio.slash(); break; }
    case 'h': bloodFx(d[0], d[1], d[2], d[3], d[4]); break;
    case 'x': explodeFx(d[0], d[1], d[2]); break;
    case 'p': if (cameraNear(d[0], d[1])) Audio.pickup(); break;
    case 'k': { const c = byId(d[0]); if (c) deathFx(c); if (cameraNear(c ? c.x : cam.x, c ? c.y : cam.y)) Audio.die(); break; }
    case 'hit': {
      const [x, y, amt, head, killed] = d;
      Audio.hit(); floatText(x + rand(-10, 10), y - 46, Math.round(amt) + (head ? '!' : ''), head ? '#ff4d4d' : '#fff');
      if (head && killed) showAnnounce('HEADSHOT!', '');
      break;
    }
    case 'di': G.deathInfo = d; break;
    case 'ft': floatText(d[0], d[1], d[2], d[3]); break;
    case 'an': showAnnounce(d[0], d[1]); break;
    case 'over': if (!G.over) endGame(); break;
  }
}

// ---- lifecycle ----
function mpLeave() {
  NET.role = null; NET.pid = 0; NET.inMatch = false; NET.paused = false; NET.events = [];
  MPS.snap = null; MPS.evq = []; MPS.pend = null; MPS.lobby = new Map();
  if (mpWs) { const s = mpWs; mpWs = null; s.onclose = null; try { s.close(); } catch (_) {} }
}
function mpDropped(msg) {
  mpLeave();
  if (state !== 'menu') toMenu();
  mpShow(true); mpView('home'); mpErr(msg);
}
// game.js calls netLeave() from toMenu()/togglePause paths
function netLeave() { mpLeave(); }
