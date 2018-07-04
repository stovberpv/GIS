define(['@app/engine/globals', '@app/lib/socket.io.slim', '@app/controllers/ymapController'], function (globals, io, ymapController) {
    'use strict';

    function init () { globals.socket = io(`${globals.host}:${globals.port}`); }
    function onConnect () { globals.socket.on('connect', () => console.log('Established socket connection with a server')); }
    function mapRequest () { globals.socket.emit('mapRequest'); }
    function onMapRequisition () { globals.socket.on('mapRequested', ymapController.onMapRequisition); }
    function onAddedRelation () { globals.socket.on('addedRelation', ymapController.onAddedRealtion); }
    function onRemovedRelation () { globals.socket.on('removedRelation', ymapController.onRemovedRelation); }

    return {
        init: init,
        onConnect: onConnect,
        mapRequest: mapRequest,
        onMapRequisition: onMapRequisition,
        onAddedRelation: onAddedRelation,
        onRemovedRelation: onRemovedRelation
    };
});
