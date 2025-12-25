const socket = io();
const statusDiv = document.getElementById('status');
const logDiv = document.getElementById('log');

// Initialize Terminal
const term = new Terminal({
    cursorBlink: true,
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 14,
    theme: {
        background: '#000000',
    }
});
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal-container'));
fitAddon.fit();

// Send terminal input to server
term.onData(data => {
    socket.emit('term-input', data);
});

socket.on('connect', () => {
    statusDiv.textContent = 'Connected to Server';
    statusDiv.classList.add('connected');
    console.log('Connected to server');
    
    // Notify server of initial size
    socket.emit('term-resize', { cols: term.cols, rows: term.rows });
});

socket.on('server-message', (msg) => {
    const p = document.createElement('p');
    p.textContent = `Server says: ${msg}`;
    logDiv.appendChild(p);
});

// Write data from server to terminal
socket.on('term-output', (data) => {
    term.write(data);
});

socket.on('disconnect', () => {
    statusDiv.textContent = 'Disconnected';
    statusDiv.classList.remove('connected');
    term.write('\r\n\x1b[31mDisconnected from server\x1b[0m\r\n');
});

// Handle window resize
window.addEventListener('resize', () => {
    fitAddon.fit();
    socket.emit('term-resize', { cols: term.cols, rows: term.rows });
});
