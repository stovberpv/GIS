'use strict';

const DBHelper = require.main.require('../helpers/databaseHelper');

/**
 * Позволяет управлять соединениями узловых точек.
 *
 * @class Track
 */
class Track {
    /**
     *Creates an instance of Track.
     * @memberof Track
     */
    constructor () { return this; }

    /**
     * TODO guid parent-child check
     * Создает или обновляет уже существующее соединение.
     * Добавляет отсутствующие записи адресов и координат в таблицах.
     *
     * @param {Object} data Описание соединения предок-потомок.
     * @returns {Promise.<String, Error>} GUID соединения.
     * @memberof Track
     */
    async addRelation (data) {
        return new Promise(async (resolve, reject) => {
            let db;
            let dbData = { parent: { city: [], address: [], geo: [] }, child: { city: [], address: [], geo: [] }, relation: [], information: [] };
            let query = {
                city: {
                    select: {
                        default: 'SELECT guid FROM city WHERE name = ?',
                        rowID: 'SELECT guid FROM city WHERE ROWID = ?'
                    },
                    insert: 'INSERT INTO city(name) VALUES(?)'
                },
                address: {
                    select: {
                        default: 'SELECT guid FROM address WHERE city = ? AND street = ? AND house = ?',
                        rowID: 'SELECT guid FROM address WHERE ROWID = ?'
                    },
                    insert: 'INSERT INTO address(city, street, house) VALUES(?,?,?)'
                },
                geo: {
                    select: {
                        default: 'SELECT guid FROM geo WHERE address = ?',
                        rowID: 'SELECT guid FROM geo WHERE ROWID = ?'
                    },
                    insert: 'INSERT INTO geo(address, latitude, longitude) VALUES(?,?,?)'
                },
                relation: {
                    select: {
                        default: 'SELECT guid FROM relation WHERE address_p = ? AND address_c = ? AND deprecated = 0',
                        rowID: 'SELECT guid FROM relation WHERE ROWID = ?'
                    },
                    insert: 'INSERT INTO relation(address_p, address_c) VALUES(?,?)'
                },
                information: {
                    select: {
                        default: 'SELECT guid FROM information WHERE relation = ?',
                        rowID: 'SELECT guid FROM information WHERE ROWID = ?'
                    },
                    insert: 'INSERT INTO information(relation, description, length, blabel, elabel, type, cores) VALUES(?,?,?,?,?,(SELECT guid FROM cabletypes WHERE type = ?),(SELECT guid FROM cablecores WHERE cores = ?))'
                }
            };

            try { db = await new DBHelper(); } catch (e) { reject(e); }

            function fetch (sql, data) {
                return new Promise(async (resolve, reject) => {
                    let queryData;

                    try { queryData = await db.all(sql.select.default, data.select); } catch (e) { reject(e); }
                    if (!queryData.length) {
                        try { var stmt = await db.run(sql.insert, data.insert); } catch (e) { reject(e); }
                        if (stmt.changes) {
                            try { queryData = await db.all(sql.select.rowID, [stmt.lastID]); } catch (e) { reject(e); }
                        }
                    }

                    resolve(queryData);
                });
            }

            // parent city
            try { dbData.parent.city = await fetch(query.city, { select: [data.parent_city], insert: [data.parent_city] }); } catch (e) { reject(e); }
            // parent address
            try { dbData.parent.address = await fetch(query.address, { select: [dbData.parent.city[0].guid, data.parent_street, data.parent_house], insert: [dbData.parent.city[0].guid, data.parent_street, data.parent_house] }); } catch (e) { reject(e); }
            // parent geo
            try { dbData.parent.geo = await fetch(query.geo, { select: [dbData.parent.address[0].guid], insert: [dbData.parent.address[0].guid, data.parent_lat, data.parent_lon] }); } catch (e) { reject(e); }

            // child city
            try { dbData.child.city = await fetch(query.city, { select: [data.child_city], insert: [data.child_city] }); } catch (e) { reject(e); }
            // child address
            try { dbData.child.address = await fetch(query.address, { select: [dbData.child.city[0].guid, data.child_street, data.child_house], insert: [dbData.child.city[0].guid, data.child_street, data.child_house] }); } catch (e) { reject(e); }
            // child geo
            try { dbData.child.geo = await fetch(query.geo, { select: [dbData.child.address[0].guid], insert: [dbData.child.address[0].guid, data.child_lat, data.child_lon] }); } catch (e) { reject(e); }

            // relation guid
            try { dbData.relation = await fetch(query.relation, { select: [dbData.parent.address[0].guid, dbData.child.address[0].guid], insert: [dbData.parent.address[0].guid, dbData.child.address[0].guid] }); } catch (e) { reject(e); }
            // information
            try { dbData.information = await fetch(query.information, { select: [dbData.relation[0].guid], insert: [dbData.relation[0].guid, data.line_description, data.line_length, data.label_begin, data.label_end, data.cabel_type, data.cabel_cores] }); } catch (e) { reject(e); }

            resolve(dbData.relation[0].guid);
        });
    }

    /**
     * Возвращает все соединения или одно, если передан его guid.
     *
     * @param {String} guid Уникальный идентификатор соединения.
     * @returns {Promise.<Array, Error>} Соединения.
     * @memberof Track
     */
    async getRelation (guid) {
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql =
                `SELECT a.guid           AS track_guid,
                        p_addr.guid      AS parent_guid,
                        p_city.name      AS parent_city,
                        p_addr.street    AS parent_street,
                        p_addr.house     AS parent_house,
                        p_geo.latitude   AS parent_lat,
                        p_geo.longitude  AS parent_lon,
                        c_addr.guid      AS child_guid,
                        c_city.name      AS child_city,
                        c_addr.street    AS child_street,
                        c_addr.house     AS child_house,
                        c_geo.latitude   AS child_lat,
                        c_geo.longitude  AS child_lon,
                        b.description    AS line_description,
                        b.length         AS line_length,
                        b.blabel         AS label_begin,
                        b.elabel         AS label_end,
                        c.cores          AS cabel_cores,
                        d.type           AS cabel_type,
                        a.deprecated     AS is_active,
                        a.override       AS is_actual
                    FROM relation         AS a
                    JOIN address          AS p_addr ON a.address_p = p_addr.guid
                    JOIN address          AS c_addr ON a.address_c = c_addr.guid
                    JOIN city             AS p_city ON p_addr.city = p_city.guid
                    JOIN city             AS c_city ON c_addr.city = c_city.guid
                    LEFT JOIN geo         AS p_geo  ON p_addr.guid = p_geo.address
                    LEFT JOIN geo         AS c_geo  ON c_addr.guid = c_geo.address
                    LEFT JOIN information AS b      ON a.guid      = b.relation
                    LEFT JOIN cablecores  AS c      ON b.cores     = c.guid
                    LEFT JOIN cabletypes  AS d      ON b.type      = d.guid`;
            sql = guid ? `${sql} WHERE a.guid = '${guid}'` : sql;

            let data;
            try { data = await db.all(sql); resolve(data); } catch (e) { reject(e); }
        });
    }

    /**
     * Помечает соединения устаревшим.
     *
     * @param {String} guid Уникальный идентификатор соединения.
     * @returns {Promise.<Object, Error>} Статус обработки SQL запроса.
     * @memberof Track
     */
    async removeRelation (guid) {
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql = `UPDATE relation SET deprecated = ? WHERE guid = ?`;
            try { let result = await db.run(sql, [1, guid]); resolve(result); } catch (e) { reject(e); }
        });
    }

    /**
     * Обновляет данные соединения.
     *
     * @param {Object} data Данные соединения.
     * @returns {Promise.<Object, Error>} Статус обработки SQL запроса.
     * @memberof Track
     */
    async updateRelation (data) {
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql = `UPDATE information SET description = ?, length = ?, blabel = ?, elabel = ?, type = (SELECT guid FROM cabletypes WHERE type = ?), cores = (SELECT guid FROM cablecores WHERE cores = ?) WHERE relation = ?`;
            try { let result = await db.run(sql, [data.line_description, data.line_length, data.label_begin, data.label_end, data.cabel_type, data.cabel_cores, data.track_guid]); resolve(result); } catch (e) { reject(e); }
        });
    }
}

module.exports = Track;
