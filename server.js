// No dependencies: Node's built-in HTTP server is enough for SSE.
const http = require('node:http');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const clients = new Map();

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(__dirname + '/index.html'));
  }

  if (req.method === 'GET' && url.pathname === '/events') {
    const id = randomUUID();
    let messageNumber = 0;
    const timers = new Set();
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    clients.set(id, { send, timers, nextNumber: () => ++messageNumber });
    send('connected', { connectionId: id });
    // Comments keep an idle stream alive, without creating another connection.
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 15000);
    res.on('close', () => {
      clearInterval(heartbeat);
      timers.forEach(clearTimeout);
      clients.delete(id);
    });
    return; // Deliberately leave this response open.
  }

  if (req.method === 'POST' && url.pathname === '/send') {
    const id = url.searchParams.get('connectionId');
    const client = clients.get(id);
    if (!client) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'SSE connection is not open. Please retry.' }));
    }
    const number = client.nextNumber();
    const requestedAt = Date.now();
    const timer = setTimeout(() => {
      client.timers.delete(timer);
      client.send('message', {
        connectionId: id, number,
        text: `Hello Maayan! Message #${number} from the Node.js server`,
        requestedAt, sentAt: Date.now()
      });
    }, 2000); // The delay happens on the server.
    client.timers.add(timer);
    res.writeHead(202, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ queued: true, number, delayMs: 2000 }));
  }
  res.writeHead(404);
  res.end('Not found');
}).listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('SSE demo: http://localhost:3000'));
