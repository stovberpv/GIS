var SocketIO = require('socket.io');
var socketIORouter = require.main.require('../routes/socketIORouter');

module.exports = function (server) {
    'use strict';

    let io = new SocketIO(server);
    socketIORouter(io);

    return io;
};
