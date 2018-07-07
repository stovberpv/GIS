const log = require('fancy-log');
const socketRouter = require.main.require('../routes/socketRouter');
const cv = require.main.require('../config/console');

module.exports = function (socketio) {
    'use strict';

    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('addRelation', socketRouter.addRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('removeRelation', socketRouter.removeRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('updateRelation', socketRouter.updateRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('mapRequest', socketRouter.mapRequest.bind(socket));
    }

    socketio.on('connection', onConnection);

    return socketio;
};
