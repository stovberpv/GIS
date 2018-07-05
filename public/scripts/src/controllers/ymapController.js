define(['@app/globals', '@app/helpers/ymapHelper'], function (globals, Ymap) {
    'use strict';

    /**
     *
     * @param  {any} relationMap
     * @return
     */
    async function onMapRequisition (relationMap) {
        let map = new Ymap({ attachTo: 'map' });
        try { await map.init(); } catch (e) { console.log(e); return; }
        map.attach();
        try { await map.addRelation(relationMap); } catch (e) { console.log(e); return; }
        map.bindMapEvents();
        map.addControl();
        globals.map = map;
    }

    /**
     *
     * @param  {any} relation
     * @return {void}
     */
    function onRemovedRelation (relation) {
        globals.map.removeRelation(relation);
    }

    /**
     *
     * @param  {any} relation
     * @return {void}
     */
    async function onAddedRealtion (relation) {
        globals.map.addRelation([relation]);
    }

    return {
        onMapRequisition: onMapRequisition,
        onRemovedRelation: onRemovedRelation,
        onAddedRealtion: onAddedRealtion
    };
});
