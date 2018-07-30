define([
    '@app/globals',
    '@app/config/appConfig',
    '@app/lib/socket.io.slim',
    '@app/helpers/mapHelper'], function (globals, config, io, mapHelper) {
    'use strict';

    /**
     *
     * @return {void}
     */
    function init () { globals.socket = io(`${config.socketConnection.host.current}:${config.socketConnection.port}`); }
    /**
     *
     * @return {void}
     */
    function onConnect () { globals.socket.on('connect', () => console.log('Established socket connection with a server')); }
    /**
     *
     * @return {void}
     */
    function onMapRequisition () { globals.socket.on('mapRequested', mapHelper.onMapRequisition); }
    /**
     *
     * @return {void}
     */
    function onAddedRelation () { globals.socket.on('addedRelation', mapHelper.onAddedRealtion); }
    /**
     *
     * @return {void}
     */
    function onUpdatedRelation () { globals.socket.on('updatedRelation', mapHelper.onUpdatedRelation); }
    /**
     *
     * @return {void}
     */
    function onRemovedRelation () { globals.socket.on('removedRelation', mapHelper.onRemovedRelation); }
    /**
     *
     * @return {void}
     */
    function mapRequest () { globals.socket.emit('mapRequest'); }

    return {
        init: init,
        onConnect: onConnect,
        onMapRequisition: onMapRequisition,
        onAddedRelation: onAddedRelation,
        onUpdatedRelation: onUpdatedRelation,
        onRemovedRelation: onRemovedRelation,
        mapRequest: mapRequest
    };
});
