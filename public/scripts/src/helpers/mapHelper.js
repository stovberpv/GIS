define(['@app/globals', '@app/controllers/mapController', '@app/controllers/trackController'], function (globals, MapController, TrackController) {
    'use strict';

    /**
     *
     * @param  {any} relationMap
     * @return
     */
    async function onMapRequisition (relationMap) {
        let mapController = new MapController({ attachTo: 'map' });
        try { await mapController.create(); } catch (e) { console.log(e); return; }
        mapController.addControl();
        mapController.setEvents();
        try { await mapController.addRelation(relationMap); } catch (e) { console.log(e); return; }

        new TrackController().init();

        globals.map = mapController;
    }

    /**
     *
     * @param  {any} relation
     * @return {void}
     */
    async function onAddedRealtion (relation) { globals.map.addRelation([relation]); }

    /**
     *
     * @param  {any} relation
     * @return {void}
     */
    async function onUpdatedRelation (relation) { globals.map.updateRelation([relation]); }

    /**
     *
     * @param  {any} relation
     * @return {void}
     */
    function onRemovedRelation (relation) { globals.map.removeRelation(relation); }

    return {
        onMapRequisition: onMapRequisition,
        onAddedRealtion: onAddedRealtion,
        onUpdatedRelation: onUpdatedRelation,
        onRemovedRelation: onRemovedRelation
    };
});
