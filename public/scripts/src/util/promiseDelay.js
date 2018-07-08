define([], function () {
    'use strict';

    /**
     * Задержка в основном потоке.
     */
    return function (duration) { return new Promise(resolve => setTimeout(function () { resolve(); }, duration)); };
});
