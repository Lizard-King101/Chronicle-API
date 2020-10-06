
var io = global.io;
var connected = global.socketio.connected;

function Process(socket) {
    socket.on('register-admin', (user) => {
        if(user) {
            socket.user_id = user.id;
            socket.app = 'admin';
            connected.admins[user.id] = socket.id;
            socket.join('admin');
        } else {
            socket.emit('register-request');
        }
    });

    socket.on('metric-users-get', () => {
        socket.emit('metric-users', Object.keys(connected.users).length);
    })
}

module.exports.process = Process;