define([
    '@app/config/appConfig',
    '@app/engine/globals',
    'ymaps',
    '@app/helpers/trackHelper',
    '@app/models/trackModel',
    '@app/helpers/ymapGeometryHelper',
    '@app/util/promiseDelay'], function (config, globals, ymaps, TrackHelper, trackModel, GeometryHelper, delay) {
    'use strict';

    function mapAttach () {
        return new ymaps.Map('map', {
            center: config.ymap.defCoord,
            controls: ['zoomControl', 'typeSelector', 'fullscreenControl', 'rulerControl'],
            zoom: config.ymap.defZoom
        });
    }

    async function onMapRequisition (data) {
        await ymaps.ready();

        let points = [];

        let inializedMap = mapAttach();

        await Promise.all([1].map(async () => {
            for (let d of data) {
                let track = new TrackHelper(d);
                let coordinates = await track.coordinates();
                let line = GeometryHelper.lineString(track.track, coordinates);
                let pointA = GeometryHelper.point(track.track, coordinates[0]);
                let pointB = GeometryHelper.point(track.track, coordinates[1]);
                GeometryHelper.initEvents(line);
                GeometryHelper.initEvents(pointA);
                GeometryHelper.initEvents(pointB);

                inializedMap.geoObjects.add(line);
                points.push(pointA);
                points.push(pointB);
            }
        }));

        var cluster = GeometryHelper.cluster();
        cluster.add(points);
        inializedMap.geoObjects.add(cluster);

        createHandlerMapPointControlEvents();
        createCustomMapControl(inializedMap);

        globals.ymap = inializedMap;
    }

    function createHandlerMapPointControlEvents () {
        document.getElementById('map').addEventListener('click', function (e) {
            let target = e.target;
            let wrapper = target.closest('.point-control-wrapper');

            if (!wrapper) return;

            if (target.classList.contains('point-checkbox')) {
                target.classList.toggle('selected');
            } else if (target.classList.contains('point-button')) {
                let cb = wrapper.querySelector('.point-checkbox');
                if (cb.classList.contains('selected')) {
                    let data = wrapper.querySelector('.point-data-holder');
                    let guid = data.dataset.relationGuid;
                    if (!guid) return;
                    globals.socket.emit('removeRelation', guid);
                }
            }
        });
    }

    function createCustomMapControl (map) {
        let button;

        //
        button = (() => {
            function pressEvent () {
                async function getGeo (e) {
                    let wrapper = e.target.closest('.add-route-wrapper');

                    if (!wrapper) return;

                    let data = {
                        parent: wrapper.querySelectorAll('.parent input'),
                        child: wrapper.querySelectorAll('.child input')
                    };

                    ((data) => {
                        data.parent[3].classList.add('isVerified');
                        data.parent[4].classList.add('isVerified');
                        data.child[3].classList.add('isVerified');
                        data.child[4].classList.add('isVerified');
                    })(data);

                    let addr = {
                        guid: '',
                        p_city: data.parent[0].value,
                        p_street: data.parent[1].value,
                        p_house: data.parent[2].value,
                        p_lat: 0,
                        p_lon: 0,
                        c_city: data.child[0].value,
                        c_street: data.child[1].value,
                        c_house: data.child[2].value,
                        c_lat: 0,
                        c_lon: 0,
                        text: ''
                    };

                    let track = new TrackHelper(addr);
                    try { await track.coordinates(); } catch (e) { return; }

                    (() => {
                        data.parent[3].value = track.track.parent.geo.lat;
                        data.parent[4].value = track.track.parent.geo.lon;

                        data.child[3].value = track.track.child.geo.lat;
                        data.child[4].value = track.track.child.geo.lon;
                    })();

                    ((data) => {
                        data.parent[3].classList.remove('isVerified');
                        data.parent[4].classList.remove('isVerified');
                        data.child[3].classList.remove('isVerified');
                        data.child[4].classList.remove('isVerified');
                    })(data);
                }

                async function save (e) {
                    let wrapper = e.target.closest('.add-route-wrapper');

                    if (!wrapper) return;

                    try { await getGeo(e); } catch (e) { return; };

                    let data = {
                        parent: wrapper.querySelectorAll('.parent input'),
                        child: wrapper.querySelectorAll('.child input'),
                        info: wrapper.querySelector('.information input')
                    };
                    let relation = {
                        p_city: data.parent[0].value,
                        p_street: data.parent[1].value,
                        p_house: data.parent[2].value,
                        p_lat: data.parent[3].value,
                        p_lon: data.parent[4].value,
                        c_city: data.child[0].value,
                        c_street: data.child[1].value,
                        c_house: data.child[2].value,
                        c_lat: data.child[3].value,
                        c_lon: data.child[4].value,
                        text: data.info.value
                    };

                    globals.socket.emit('addRelation', relation);

                    cancel(e);
                }

                function cancel (e) {
                    let frame = e.target.closest('.add-route-frame');
                    frame.parentNode.removeChild(frame);
                }

                let template = trackModel.trackAddModel();
                template.querySelector('.footer .button.check').addEventListener('click', getGeo);
                template.querySelector('.footer .button.add').addEventListener('click', save);
                template.querySelector('.footer .button.cancel').addEventListener('click', cancel);

                document.body.appendChild(template);
            }

            let data = { content: 'Добавить трассу', image: 'images/branch.svg' };
            let options = { maxWidth: 150, float: 'left' };
            let button = new ymaps.control.Button({ data: data, options: options });
            button.events.add('press', pressEvent);

            return button;
        })();
        //
        map.controls.add(button);

        button = (() => {
            function pressEvent () {
                async function save (e) {
                    let text = e.target.closest('.popup-frame').querySelector('textarea');
                    if (!text) return;

                    let data = text.value.split('\n');
                    for (let row of data) {
                        let columns = row.split('\t');
                        let addr = {
                            p_city: columns[0],
                            p_street: columns[1],
                            p_house: columns[2],
                            c_city: columns[3],
                            c_street: columns[4],
                            c_house: columns[5],
                            text: columns[6]
                        };

                        let trackHelper = new TrackHelper(addr);
                        try { await trackHelper.coordinates(); } catch (e) { return; }
                        let track = trackHelper.track;

                        let relation = {
                            guid: '',
                            p_city: track.parent.city,
                            p_street: track.parent.street,
                            p_house: track.parent.house,
                            p_lat: track.parent.geo.lat,
                            p_lon: track.parent.geo.lon,
                            c_city: track.child.city,
                            c_street: track.child.street,
                            c_house: track.child.house,
                            c_lat: track.child.geo.lat,
                            c_lon: track.child.geo.lon,
                            text: track.info
                        };

                        /**
                         * Await for DB work finished.
                         * Too short interval may occur DB data inconsistency.
                         */
                        await delay(2000);
                        // Emit new relation after short delay.
                        globals.socket.emit('addRelation', relation);
                    }

                    cancel(e);
                }

                function cancel (e) {
                    let frame = e.target.closest('.upload-mass-frame');
                    frame.parentNode.removeChild(frame);
                }

                let template = trackModel.massUploadModel();
                template.querySelector('.footer .button.save').addEventListener('click', save);
                template.querySelector('.footer .button.cancel').addEventListener('click', cancel);

                document.body.appendChild(template);
            }

            let data = { content: 'Пакетный ввод', image: `images/library.svg` };
            let options = { maxWidth: 150, float: 'left' };
            let button = new ymaps.control.Button({ data: data, options: options });
            button.events.add('press', pressEvent);

            return button;
        })();
        //
        map.controls.add(button);
    }

    function onRemovedRelation (relation) {
        let map = globals.ymap;
        map.geoObjects.each(o => {
            switch (o.options.getName()) {
                case 'geoObject': o.properties.get('guid') === relation.guid && map.geoObjects.remove(o); break;
                case 'clusterer': o.getGeoObjects().forEach(p => p.properties.get('guid') === relation.guid && o.remove(p)); break;
                default: break;
            }
        });
    }

    async function onAddedRealtion (relation) {
        let points = [];
        let inializedMap = globals.ymap;

        let track = new TrackHelper(relation);
        let coordinates = await track.coordinates();
        let line = GeometryHelper.lineString(track.track, coordinates);
        let pointA = GeometryHelper.point(track.track, coordinates[0]);
        let pointB = GeometryHelper.point(track.track, coordinates[1]);
        GeometryHelper.initEvents(line);
        GeometryHelper.initEvents(pointA);
        GeometryHelper.initEvents(pointB);

        inializedMap.geoObjects.add(line);
        inializedMap.geoObjects.add(pointA);
        inializedMap.geoObjects.add(pointB);

        points.push(pointA);
        points.push(pointB);

        var cluster = GeometryHelper.cluster();
        cluster.add(points);
        inializedMap.geoObjects.add(cluster);
    }

    return {
        mapAttach: mapAttach,
        onMapRequisition: onMapRequisition,
        onRemovedRelation: onRemovedRelation,
        onAddedRealtion: onAddedRealtion,
        createHandlerMapPointControlEvents: createHandlerMapPointControlEvents,
        createCustomMapControl: createCustomMapControl
    };
});
