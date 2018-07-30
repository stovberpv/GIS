const TrackController = require.main.require('../controllers/trackController');
const DBHelper = require.main.require('../helpers/databaseHelper');

/**
 * Получает все соединения.
 * Отправляет socket-сообщение клиенту с полученными данными.
 *
 * @param {*} socketData
 * @emit {[]}
 */
async function mapRequest (socketData) {
    'use strict';

    let tracks;

    try { tracks = await new TrackController().getRelation(); } catch (e) { return; }
    tracks = tracks.filter(e => { return e.is_active === 0; });

    this.emit('mapRequested', tracks);
}

/**
 * Помечает соединение устаревшим.
 * Отправляет socket-сообщение всем клиентам с обработанными данными.
 *
 * @param {Object} binded Объекты соединения клиента и сервера.
 * @param {Object} socketData Данные соединения.
 * @emit {[]}
 */
async function removeRelation (binded, socketData) {
    'use strict';

    let relation;

    try { await new TrackController().removeRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(socketData); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.is_active === 1 && binded.io.emit('removedRelation', relation);
}

/**
 * Добавляет новое соединения
 *
 * @param {Object} binded Объекты соединения клиента и сервера.
 * @param {Object} socketData Данные соединения.
 * @emit {[]}
 */
async function addRelation (binded, socketData) {
    'use strict';

    let relation;

    try { relation = await new TrackController().addRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(relation); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.is_active === 0 && binded.io.emit('addedRelation', relation);
}

/**
 * Обновляет соединение.
 *
 * @param {Object} binded Объекты соединения клиента и сервера.
 * @param {Object} socketData Данные соединения.
 * @emit {[]}
 */
async function updateRelation (binded, socketData) {
    'use strict';

    let relation;
    try { relation = await new TrackController().updateRelation(socketData); } catch (e) { return; }
    try { relation = await new TrackController().getRelation(socketData.track_guid); } catch (e) { return; }

    relation = relation[0] ? relation[0] : {};

    relation.is_active === 0 && binded.io.emit('updatedRelation', relation);
}

/**
 *
 * @param  {String} socketData
 * @emit {[]}
 */
async function cableDetailsRequest (socketData) {
    'use strict';

    let table = socketData === 'cabel_type' ? 'cabletypes' : socketData === 'cabel_cores' ? 'cablecores' : undefined;
    if (table === undefined) return;

    let data;
    try { data = await new DBHelper().all(`SELECT * FROM ${table}`); } catch (e) { return; }

    this.emit('cableDetailsRequested', data);
}

/**
 *
 * @param {*} socketData
 * @emit {[]}
 */
async function nodesListRequest (socketData) {
    'use strict';

    let sql =
        `SELECT a.guid,
                b.name AS city,
                a.street,
                a.house,
                c.latitude,
                c.longitude
           FROM address AS a
           JOIN city    AS b ON a.city = b.guid
           JOIN geo     AS c ON a.guid = c.address
           ORDER BY a.street, CAST(a.house AS INTEGER)`;

    let data;
    try { data = await new DBHelper().all(sql); } catch (e) { return; }

    this.emit('nodesListRequested', data);
}

/**
 *
 * @param {*} socketData
 * @emit {[]}
 */
async function addNode (socketData) {
    'use strict';

    let junction = {
        city: null,
        address: null,
        geo: null
    };
    let queryData;
    let sql;
    let stmt;

    try {
        /**
         * Проверяем адрес, если существует - завершаем обработку.
         */
        sql =
            `SELECT a.guid AS address_guid,
                    b.guid AS city_guid,
                    b.name AS city_name,
                    a.street,
                    a.house,
                    c.latitude,
                    c.longitude
                FROM address   AS a
                LEFT JOIN city AS b ON a.city = b.guid
                LEFT JOIN geo  AS c ON a.guid = c.address
                WHERE b.name = "${socketData.city}"
                AND a.street = "${socketData.street}"
                AND c.latitude LIKE "${socketData.latitude}"
                AND c.longitude LIKE "${socketData.longitude}"`;
        if ((await new DBHelper().all(sql)).length) { return; }

        /**
         * Проверяем город.
         * Если существует - ничего не делаем.
         * В противном случае - создаем запись.
         * Получаем guid.
         */
        queryData = await new DBHelper().all(`SELECT * FROM city WHERE name = "${socketData.city}"`);
        if (!queryData.length) {
            stmt = await new DBHelper().run(`INSERT INTO city(name) VALUES("${socketData.city}")`);
            if (stmt.changes) {
                queryData = await new DBHelper().all(`SELECT * FROM city WHERE ROWID = "${stmt.lastID}"`);
            }
        }
        junction.city = queryData[0].guid;

        /**
         * Проверяем адрес.
         * Если существует - ничего не делаем.
         * В противном случае - создаем запись.
         * Получаем guid.
         */
        queryData = await new DBHelper().all(`SELECT * FROM address WHERE city = "${junction.city}" AND street = "${socketData.street}"`);
        if (!queryData.length) {
            stmt = await new DBHelper().run(`INSERT INTO address(city, street, house) VALUES("${junction.city}", "${socketData.street}", "")`);
            if (stmt.changes) {
                queryData = await new DBHelper().all(`SELECT * FROM address WHERE ROWID = "${stmt.lastID}"`);
            }
        }
        junction.address = queryData[0].guid;

        /**
         * Проверяем координаты.
         * Если существует - ничего не делаем.
         * В противном случае - создаем запись.
         * Получаем guid.
         */
        queryData = await new DBHelper().all(`SELECT * FROM geo WHERE address = "${junction.address}"`);
        if (!queryData.length) {
            stmt = await new DBHelper().run(`INSERT INTO geo(address, latitude, longitude) VALUES("${junction.address}", "${socketData.latitude}", "${socketData.longitude}")`);
            if (stmt.changes) {
                queryData = await new DBHelper().all(`SELECT * FROM geo WHERE ROWID = "${stmt.lastID}"`);
            }
        }
        junction.geo = queryData[0].guid;
    } catch (e) { return; }

    this.emit('junctionAdded', true);
}

module.exports = {
    mapRequest: mapRequest,
    removeRelation: removeRelation,
    updateRelation: updateRelation,
    addRelation: addRelation,
    cableDetailsRequest: cableDetailsRequest,
    nodesListRequest: nodesListRequest,
    addNode: addNode
};
