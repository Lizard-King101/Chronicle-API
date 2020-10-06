global.socketio = {
    connected: {
        users: {},
        admins: {}
    }
}

var connected = global.socketio.connected;

const adminSocket = require('./socket_inc/admin');
const userSocket = require('./socket_inc/app');

function Process(socket) {
    socket.emit('register-request');
    userSocket.process(socket);
    adminSocket.process(socket);
    
    socket.on('disconnect', () => {
        switch (socket.app) {
            case 'mobile':
                delete connected.users[socket.user_id];
                break;
            case 'admin':
                delete connected.admins[socket.user_id];
                break;
        }

        io.sockets.in('admin').emit('metric-users', Object.keys(connected.users).length);

    })
}

module.exports.process = Process;