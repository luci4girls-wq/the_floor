const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true }, pingInterval: 25000, pingTimeout: 20000 });
const PORT = process.env.PORT || 3000;
const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

app.use(express.static('public'));
app.get('/health', (_req, res) => res.json({ ok: true, service: 'the-floor-multiplayer' }));

function makeCode() {
  let code;
  do {
    code = Array.from({ length: 5 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}
function roomInfo(room) {
  return { code: room.code, hostConnected: !!io.sockets.sockets.get(room.hostId), players: room.members.size, snapshot: room.snapshot };
}
function emitPresence(room) {
  io.to(room.code).emit('room:presence', { players: room.members.size, hostConnected: !!io.sockets.sockets.get(room.hostId) });
}

io.on('connection', socket => {
  socket.on('room:create', (ack = () => {}) => {
    const code = makeCode();
    const room = { code, hostId: socket.id, members: new Set([socket.id]), snapshot: null, createdAt: Date.now() };
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'host';
    ack({ ok: true, code, role: 'host' });
    emitPresence(room);
  });

  socket.on('room:join', ({ code, name }, ack = () => {}) => {
    code = String(code || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return ack({ ok: false, error: 'Nu am găsit această cameră. Verifică codul primit de la gazdă.' });
    if (room.members.size >= 20) return ack({ ok: false, error: 'Camera este plină (maximum 20 de conexiuni).' });
    room.members.add(socket.id);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.role = 'guest';
    socket.data.displayName = String(name || 'Invitat').slice(0, 24);
    ack({ ok: true, code, role: 'guest', snapshot: room.snapshot });
    emitPresence(room);
  });

  socket.on('game:snapshot', snapshot => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.data.role !== 'host' || room.hostId !== socket.id) return;
    // The host's browser is authoritative; the server relays and retains the latest state for reconnects.
    room.snapshot = snapshot;
    socket.to(code).volatile.emit('game:snapshot', snapshot);
  });

  socket.on('host:close-room', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.data.role !== 'host') return;
    io.to(code).emit('room:closed');
    rooms.delete(code);
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    room.members.delete(socket.id);
    if (room.hostId === socket.id) {
      room.hostId = null;
      io.to(code).emit('room:host-disconnected');
      // Keep the room briefly so guests see the disconnect and host can reconnect only by creating a new room.
      setTimeout(() => { if (rooms.get(code) === room) { io.to(code).emit('room:closed'); rooms.delete(code); } }, 120000);
    } else {
      emitPresence(room);
    }
  });
});

server.listen(PORT, () => console.log(`THE FLOOR multiplayer listening on ${PORT}`));
