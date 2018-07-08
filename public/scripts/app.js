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

require(['@app/routes/socketRouter'], function (socket) {
    socket.init();
    socket.onConnect();

    if (!document.getElementById('map-page')) return;

    socket.onMapRequisition();
    socket.onAddedRelation();
    socket.onUpdatedRelation();
    socket.onRemovedRelation();
    socket.mapRequest();
});
