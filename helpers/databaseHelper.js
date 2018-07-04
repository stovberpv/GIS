'use strict';

const sqlite = require('sqlite3'); // .verbose();
const log = require('fancy-log');
const appConfig = require.main.require('../config/appConfig');
const cv = require.main.require('../config/console');

class DBHelper {
    constructor (opts = { autoclose: true, autoopen: true }) {
        this._path = `./database/${appConfig.dbName}.db`;
        this._db = null;
        this._autoclose = opts.autoclose;
        this._autoopen = opts.autoopen;
        this._status = {
            closed: true,
            opened: false
        };

        return this;
    }

    async open () {
        let self = this;
        return new Promise((resolve, reject) => {
            this._db = new sqlite.Database(this._path, sqlite.OPEN_READWRITE, e => {
                log(e ? `${cv.BgRed}[APP] ERROR::${e.code}[${e.errno}][${e.message}]${cv.Reset}` : `${cv.BgGreen}[APP] SUCCESS::Connected to database${cv.Reset}`);
                e ? reject(e) : resolve();
                self._status = e ? { opened: false, closed: true } : { opened: true, closed: false };
                self._setTimeout();
            });
        });
    }

    async close () {
        let self = this;
        return new Promise((resolve, reject) => {
            this._db.close(e => {
                log(e ? `${cv.BgRed}[APP] ERROR::${e.code}[${e.errno}][${e.message}]${cv.Reset}` : `${cv.BgGreen}[APP] SUCCESS::Database connection was closed ${cv.Reset}`);
                e ? reject(e) : resolve();
                self._status = e ? { opened: true, closed: false } : { opened: false, closed: true };
            });
        });
    }

    _setTimeout (time) {
        this._db.configure('busyTimeout', time || appConfig.dbTimeout);
    }

    all (sql, data = []) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (self._autoopen && self._status.closed) { try { await self.open(); } catch (e) { reject(e); } }
            this._db.all(sql, data, async function (e, r) {
                if (self._autoclose && self._status.opened) { try { await self.close(); } catch (e) { reject(e); } }
                e ? reject(e) : resolve(r);
            });
        });
    }

    run (sql, data = []) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (self._autoopen && self._status.closed) { try { await self.open(); } catch (e) { reject(e); } }
            this._db.run(sql, data, async function (e, r) {
                if (self._autoclose && self._status.opened) { try { await self.close(); } catch (e) { reject(e); } }
                e ? reject(e) : resolve(r || this);
            });
        });
    }
}

module.exports = DBHelper;
