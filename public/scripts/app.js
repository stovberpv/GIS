// initialize app
require.config({
    baseUrl: 'scripts/src',
    paths: {
        'ymaps': 'https://api-maps.yandex.ru/2.1/?lang=ru_RU', // '//api-maps.yandex.ru/2.0/?load=package.full&lang=ru-RU'
        '@app': ['.']
    },
    shim: {
        'ymaps': { exports: 'ymaps' }
    }
});

require(['@app/helpers/socketioHelper'], function (socketio) {
    socketio.init();
    socketio.onConnect();
    socketio.onMapRequisition();
    socketio.onAddedRelation();
    socketio.onUpdatedRelation();
    socketio.onRemovedRelation();
    socketio.mapRequest();
});
