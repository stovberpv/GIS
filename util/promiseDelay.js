module.exports = function (duration) {
    'use strict';

    return () => { return new Promise(resolve => setTimeout(() => resolve(), duration)); };
};
