'use strict';
// Jetpack Jung multiplayer relay + static file server. No dependencies: `node server.js`
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 8080, ROOT = __dirname;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
const FILES = new Set(['index.html', 'game.js', 'net.js', 'style.css']);

const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html'; } catch (_) { res.writeHead(400); return res.end('bad'); }
  if (!FILES.has(p)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(ROOT, p), (e, d) => {
    if (e) { res.writeHead(500); return res.end('error'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)], 'Cache-Control': 'no-cache' }); res.end(d);
  });
});

// ---------- minimal WebSocket (RFC 6455) ----------
const rooms = new Map(); let nextPid = 2;
const CODE_CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() { for (;;) { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CH[crypto.randomInt(CODE_CH.length)]; if (!rooms.has(c)) return c; } }
function frame(o) {
  const d = Buffer.from(JSON.stringify(o)); let h;
  if (d.length < 126) h = Buffer.from([0x81, d.length]);
  else if (d.length < 65536) { h = Buffer.alloc(4); h[0] = 0x81; h[1] = 126; h.writeUInt16BE(d.length, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x81; h[1] = 127; h.writeBigUInt64BE(BigInt(d.length), 2); }
  return Buffer.concat([h, d]);
}
function put(peer, buf) { if (!peer.socket.destroyed && peer.socket.writableLength < 262144) peer.socket.write(buf); }

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (req.url.split('?')[0] !== '/ws' || !key) return socket.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const peer = { socket, room: null, pid: 0, isHost: false, buf: Buffer.alloc(0), frag: [] };
  socket.on('data', chunk => { peer.buf = Buffer.concat([peer.buf, chunk]); if (peer.buf.length > 2e6) return socket.destroy(); parse(peer); });
  socket.on('close', () => leave(peer));
  socket.on('error', () => socket.destroy());
});

function parse(peer) {
  for (;;) {
    const b = peer.buf; if (b.length < 2) return;
    const fin = !!(b[0] & 128), op = b[0] & 15, masked = !!(b[1] & 128); let len = b[1] & 127, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > 1e6) return peer.socket.destroy();
    const need = off + (masked ? 4 : 0) + len; if (b.length < need) return;
    const payload = Buffer.from(b.subarray(off + (masked ? 4 : 0), need));
    if (masked) { const m = b.subarray(off, off + 4); for (let i = 0; i < payload.length; i++) payload[i] ^= m[i & 3]; }
    peer.buf = b.subarray(need);
    if (op === 8) { peer.socket.end(); return; }
    if (op === 9) { if (payload.length < 126) peer.socket.write(Buffer.concat([Buffer.from([0x8A, payload.length]), payload])); continue; }
    if (op === 1 || op === 0) { peer.frag.push(payload); if (fin) { const t = Buffer.concat(peer.frag).toString(); peer.frag = []; handle(peer, t); } }
  }
}

const clean = s => String(s == null ? '' : s).slice(0, 12);
function handle(peer, text) {
  let m; try { m = JSON.parse(text); } catch (_) { return; }
  if (!m || typeof m !== 'object' || m.t === 'ping') return;
  if (m.t === 'create' && !peer.room) {
    const code = newCode(), room = { code, host: peer, peers: new Map() };
    rooms.set(code, room); peer.room = room; peer.isHost = true; peer.pid = 1;
    put(peer, frame({ t: 'room', code, pid: 1 })); return;
  }
  if (m.t === 'join' && !peer.room) {
    const room = rooms.get(String(m.code || '').toUpperCase().trim());
    if (!room) return put(peer, frame({ t: 'err', msg: 'Room nahi mila — code check karo' }));
    if (room.peers.size >= 15) return put(peer, frame({ t: 'err', msg: 'Room full hai' }));
    peer.pid = nextPid++; peer.room = room; room.peers.set(peer.pid, peer);
    put(peer, frame({ t: 'joined', code: room.code, pid: peer.pid }));
    put(room.host, frame({ t: 'peer+', pid: peer.pid, name: clean(m.name), av: m.av })); return;
  }
  if (!peer.room) return;
  if (peer.isHost) {
    if (m.t !== 'to' || !m.m) return;
    const f = frame(m.m);
    if (m.to === '*') for (const p of peer.room.peers.values()) put(p, f);
    else { const p = peer.room.peers.get(m.to); if (p) put(p, f); }
  } else put(peer.room.host, frame({ t: 'm', from: peer.pid, m }));
}
function leave(peer) {
  const room = peer.room; if (!room) return; peer.room = null;
  if (peer.isHost) { for (const p of room.peers.values()) { put(p, frame({ t: 'hostleft' })); p.room = null; p.socket.end(); } rooms.delete(room.code); }
  else { room.peers.delete(peer.pid); put(room.host, frame({ t: 'peer-', pid: peer.pid })); }
}

server.listen(PORT, () => console.log('Jetpack Jung running on http://localhost:' + PORT));
