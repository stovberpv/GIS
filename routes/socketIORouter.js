const log = require('fancy-log');
const socketRouter = require.main.require('../routes/socketRouter');

module.exports = function (socketio) {
    'use strict';

    function onConnection (socket) {
        log('New connection established');
        socket.on('addRelation', socketRouter.addRelation.bind(socket));
        socket.on('removeRelation', socketRouter.removeRelation.bind(socket));
        socket.on('mapRequest', socketRouter.mapRequest.bind(socket));
    }

    socketio.on('connection', onConnection);

    return socketio;
};
