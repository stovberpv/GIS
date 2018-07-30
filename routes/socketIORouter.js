const log = require('fancy-log');
const socketRouter = require.main.require('../routes/socketRouter');
const cv = require.main.require('../config/console');

module.exports = function (socketio) {
    'use strict';

    /**
     * Вызывается при установке socket-соединения.
     * Задает траггеры вызовов.
     *
     * @param {Object} socket Объект соединения.
     */
    function onConnection (socket) {
        log(`${cv.FgBlue}New connection established. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`);
        socket.on('disconnect', () => log(`${cv.FgRed}Socket connection was closed. ${cv.FgCyan}IP::${socket.request.connection.remoteAddress}${cv.Reset}`));
        socket.on('addRelation', socketRouter.addRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('removeRelation', socketRouter.removeRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('updateRelation', socketRouter.updateRelation.bind(null, { io: socketio, socket: socket }));
        socket.on('mapRequest', socketRouter.mapRequest.bind(socket));
        socket.on('cableDetailsRequest', socketRouter.cableDetailsRequest.bind(socket));
        socket.on('nodesListRequest', socketRouter.nodesListRequest.bind(socket));
        socket.on('addNode', socketRouter.addNode.bind(socket));
    }

    socketio.on('connection', onConnection);

    return socketio;
};
