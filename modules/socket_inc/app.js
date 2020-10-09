const path = require('path');
const fs = require('fs');
const db = require('../database');
const bcrypt = require('bcryptjs');

var io = global.io;
var connected = global.socketio.connected;

function Process(socket) {
    socket.on('register', (user) => {
        if(user) {
            socket.user_id = user.id;
            socket.app = 'mobile';
            connected.users[user.id] = socket.id;
            io.sockets.in('admin').emit('metric-users', Object.keys(connected.users).length);
            socket.join('users');
        } else {
            socket.emit('register-request');
        }
    });
}

module.exports.process = Process;