'use strict';

const DBHelper = require.main.require('../helpers/databaseHelper');

class Track {
    constructor () { return this; }

    async addRelation (data) {
        return new Promise(async (resolve, reject) => {
            let db;
            let sqlData = { parent: { city: [], address: [], geo: [] }, child: { city: [], address: [], geo: [] }, relation: [], information: [] };
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
                    insert: 'INSERT INTO information(relation, text) VALUES(?,?)'
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
            try { sqlData.parent.city = await fetch(query.city, { select: [data.p_city], insert: [data.p_city] }); } catch (e) { reject(e); }
            // parent address
            try { sqlData.parent.address = await fetch(query.address, { select: [sqlData.parent.city[0].guid, data.p_street, data.p_house], insert: [sqlData.parent.city[0].guid, data.p_street, data.p_house] }); } catch (e) { reject(e); }
            // parent geo
            try { sqlData.parent.geo = await fetch(query.geo, { select: [sqlData.parent.address[0].guid], insert: [sqlData.parent.address[0].guid, data.p_lat, data.p_lon] }); } catch (e) { reject(e); }

            // child city
            try { sqlData.child.city = await fetch(query.city, { select: [data.c_city], insert: [data.c_city] }); } catch (e) { reject(e); }
            // child address
            try { sqlData.child.address = await fetch(query.address, { select: [sqlData.child.city[0].guid, data.c_street, data.c_house], insert: [sqlData.child.city[0].guid, data.c_street, data.c_house] }); } catch (e) { reject(e); }
            // child geo
            try { sqlData.child.geo = await fetch(query.geo, { select: [sqlData.child.address[0].guid], insert: [sqlData.child.address[0].guid, data.c_lat, data.c_lon] }); } catch (e) { reject(e); }

            // relation guid
            try { sqlData.relation = await fetch(query.relation, { select: [sqlData.parent.address[0].guid, sqlData.child.address[0].guid], insert: [sqlData.parent.address[0].guid, sqlData.child.address[0].guid] }); } catch (e) { reject(e); }
            // information
            try { sqlData.information = await fetch(query.information, { select: [sqlData.relation[0].guid], insert: [sqlData.relation[0].guid, data.text] }); } catch (e) { reject(e); }

            resolve(sqlData.relation[0].guid);
        });
    }

    async getRelation (guid) {
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql =
                `SELECT a.guid,
                        parent_city.name     AS p_city,
                        parent_addr.street   AS p_street,
                        parent_addr.house    AS p_house,
                        parent_geo.latitude  AS p_lat,
                        parent_geo.longitude AS p_lon,
                        child_city.name      AS c_city,
                        child_addr.street    AS c_street,
                        child_addr.house     AS c_house,
                        child_geo.latitude   AS c_lat,
                        child_geo.longitude  AS c_lon,
                        b.text,
                        a.deprecated,
                        a.override
                    FROM relation         AS a
                    JOIN address          AS parent_addr ON a.address_p      = parent_addr.guid
                    JOIN address          AS child_addr  ON a.address_c      = child_addr.guid
                    JOIN city             AS parent_city ON parent_addr.city = parent_city.guid
                    JOIN city             AS child_city  ON child_addr.city  = child_city.guid
                    LEFT JOIN geo         AS parent_geo  ON parent_addr.guid = parent_geo.address
                    LEFT JOIN geo         AS child_geo   ON child_addr.guid  = child_geo.address
                    LEFT JOIN information AS b           ON a.guid           = b.relation`;
            sql = guid ? `${sql} WHERE a.guid = '${guid}'` : sql;

            let data;
            try { data = await db.all(sql); resolve(data); } catch (e) { reject(e); }
        });
    }

    async removeRelation (guid) {
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql = `UPDATE relation SET deprecated = ? WHERE guid = ?`;
            try { let result = await db.run(sql, [1, guid]); resolve(result); } catch (e) { reject(e); }
        });
    }
}

module.exports = Track;
