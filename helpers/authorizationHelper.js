const crypto = require('crypto');
// const sha1 = require.main.require('../util/sha1'); // not necessary for this project
const DBHelper = require.main.require('../helpers/databaseHelper');

'use strict';

/**
 *
 *
 * @class Authorization
 */
class Authorization {
    /**
     *Creates an instance of Authorization.
     * @param {*} user
     * @memberof Authorization
     */
    constructor (user) {
        this._login = user.login;
        this._password = user.password;
        this._result = null;

        return this;
    }

    get result () { return this._result; }

    /**
     *
     *
     * @returns
     * @memberof Authorization
     */
    isActive () {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql = `SELECT COUNT(*) FROM users WHERE login = ? AND active = 1`;
            try { let result = await db.run(sql, [this._login]); resolve(result); self._result = result; } catch (e) { reject(e); }
        });
    }

    /**
     *
     *
     * @returns
     * @memberof Authorization
     */
    check () {
        let self = this;
        return new Promise(async (resolve, reject) => {
            let db = new DBHelper();
            let sql = `SELECT COUNT(*) FROM users WHERE login = ? AND password = ? AND active = 1`;
            try { let result = await db.all(sql, [this._login, this._password]); resolve(result); self._result = result; } catch (e) { reject(e); }
        });
    }
}

module.exports = Authorization;
