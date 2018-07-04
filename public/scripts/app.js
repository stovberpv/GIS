// initialize app
require.config({
    baseUrl: 'scripts/app',
    paths: {
        // 'io': '/lib/socket.io.slim',
        // 'ymaps': '//api-maps.yandex.ru/2.0/?load=package.full&lang=ru-RU'
        'ymaps': 'https://api-maps.yandex.ru/2.1/?lang=ru_RU',
        '@app': ['.']
    },
    shim: {
        // 'io': { exports: 'io' },
        'ymaps': { exports: 'ymaps' }
    }
});

require(['@app/helpers/socketioHelper'], function (socketio) {
    socketio.init();
    socketio.onConnect();
    socketio.onMapRequisition();
    socketio.onAddedRelation();
    socketio.onRemovedRelation();
    socketio.mapRequest();
});
