var TrackController = require.main.require('../controllers/trackController');

async function mapRequest (socketData) {
    'use strict';

    let tracks;

    try { tracks = await new TrackController().getRelation(); } catch (e) { return; }
    tracks = tracks.filter(e => { return e.deprecated === 0; });

    this.emit('mapRequested', tracks);
}

async function removeRelation (socketData) {
    'use strict';

    let relation;

    try { await new TrackController().removeRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(socketData); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.deprecated === 1 && this.emit('removedRelation', relation);
}

async function addRelation (socketData) {
    'use strict';

    let relation;

    try { relation = await new TrackController().addRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(relation); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.deprecated === 0 && this.emit('addedRelation', relation);
}

async function updateRelation (socketData) {
    'use strict';

    let relation;
    try { relation = await new TrackController().updateRelation(socketData); } catch (e) { return; }
    relation.changes !== 0 && this.emit('updatedRelation', socketData.guid);
}

module.exports = {
    mapRequest: mapRequest,
    removeRelation: removeRelation,
    updateRelation: updateRelation,
    addRelation: addRelation
};
