define([], function () {
    'use strict';

    /**
     *
    */
    return function (duration) { return new Promise(resolve => setTimeout(function () { resolve(); }, duration)); };
});
