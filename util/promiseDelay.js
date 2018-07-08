module.exports = function (duration) {
    'use strict';

    /**
     * Задержка в основном потоке.
     */
    return () => { return new Promise(resolve => setTimeout(() => resolve(), duration)); };
};
