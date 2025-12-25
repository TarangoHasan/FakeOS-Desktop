const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');
const os = require('os');
const pty = require('node-pty');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve xterm files
app.use('/xterm', express.static(path.join(__dirname, 'node_modules/xterm')));
app.use('/xterm-addon-fit', express.static(path.join(__dirname, 'node_modules/xterm-addon-fit')));

io.on('connection', (socket) => {
  console.log('A user connected: ' + socket.id);

  // Send a welcome message
  socket.emit('server-message', 'Connection established with FakeOS Server!');

  // --- Phase 2: Terminal Setup ---
  const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
  
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME || process.cwd(),
    env: process.env
  });

  // Send data from pty to client
  ptyProcess.onData((data) => {
    socket.emit('term-output', data);
  });

  // Receive data from client and write to pty
  socket.on('term-input', (data) => {
    ptyProcess.write(data);
  });
  
  // Handle resize
  socket.on('term-resize', (size) => {
      ptyProcess.resize(size.cols, size.rows);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
    ptyProcess.kill();
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FakeOS Server running on http://localhost:${PORT}`);
});
