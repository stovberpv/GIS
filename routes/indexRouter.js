const express = require('express');
// var jwt = require('jsonwebtoken');
const router = express.Router();
// var token = jwt.sign({ name:'iostreamer' }, 'secret-key', { expiresIn : 24 * 60 * 60 * 1000 });

const Authorization = require.main.require('../helpers/authorizationHelper');

/**
 * GET home page.
 */
router.get('/', function (req, res, next) {
    // check user sid
    // if err - render login
    // else if ok render map
    res.render('login', { title: 'TS.GIS' });
});

/**
 *
 */
router.post('/', async function (req, res, next) {
    let authHelper = new Authorization({ login: req.body.username, password: req.body.password });
    try { await authHelper.check(); } catch (e) {  }
    if (authHelper.result.length && authHelper.result[0]['COUNT(*)']) {
        res.render('map', { title: 'TS.GIS' });
    } else {
        res.render('login', { title: 'TS.GIS' });
    }
});

module.exports = router;
