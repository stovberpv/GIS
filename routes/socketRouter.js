var TrackController = require.main.require('../controllers/trackController');

/**
 *
 * @param {*} socketData
 */
async function mapRequest (socketData) {
    'use strict';

    let tracks;

    try { tracks = await new TrackController().getRelation(); } catch (e) { return; }
    tracks = tracks.filter(e => { return e.deprecated === 0; });

    this.emit('mapRequested', tracks);
}

/**
 *
 * @param {*} socketData
 */
async function removeRelation (binded, socketData) {
    'use strict';

    let relation;

    try { await new TrackController().removeRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(socketData); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.deprecated === 1 && binded.io.emit('removedRelation', relation);
}

/**
 *
 * @param {*} socketData
 */
async function addRelation (binded, socketData) {
    'use strict';

    let relation;

    try { relation = await new TrackController().addRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(relation); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.deprecated === 0 && binded.io.emit('addedRelation', relation);
}

/**
 *
 * @param {*} socketData
 */
async function updateRelation (binded, socketData) {
    'use strict';

    let relation;
    try { relation = await new TrackController().updateRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(socketData.guid); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.deprecated === 0 && binded.io.emit('updatedRelation', relation);
}

module.exports = {
    mapRequest: mapRequest,
    removeRelation: removeRelation,
    updateRelation: updateRelation,
    addRelation: addRelation
};
