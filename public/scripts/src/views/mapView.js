define(['ymaps'], function (ymaps) {
    'use strict';

    class MapView {
        constructor (opts = {}) {
            this._stateConfig = { center: [44.952116, 34.102411], controls: ['zoomControl', 'typeSelector', 'rulerControl'], zoom: 13 };
            this._optionsConfig = { suppressMapOpenBlock: true };

            return this;
        }

        get stateConfig () { return this._stateConfig; }
        get optionsConfig () { return this._optionsConfig; }

        load () {
            return new Promise(async (resolve, reject) => {
                try { await ymaps.ready(); resolve(); } catch (e) { reject(); }
            });
        }

        lineString (trackHelper) {
            let track = trackHelper.track;

            let strokeWidth = (() => {
                let minp = 2; // min optical cabel cores
                let maxp = 144; // max optical cabel cores

                let minv = Math.log(3); // min strokeWidth
                let maxv = Math.log(9); // max strokeWidth

                let scale = (maxv - minv) / (maxp - minp); // logarithmic scale

                return Math.exp(minv + scale * ((parseInt(track.cabel_cores) || 0) - minp));
            })();

            let geometry = {
                type: 'LineString',
                coordinates: [[track.parent_lon, track.parent_lat], [track.child_lon, track.child_lat]]
            };

            let properties = {
                guid: track.track_guid,
                hintContent: `${track.parent_street} ${track.parent_house}<-->${track.child_street} ${track.child_house}`,
                balloonContent: ''
            };

            let options = {
                geodesic: true,
                strokeColor: '#1E98FF',
                strokeWidth: strokeWidth,
                opacity: 0.6
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        point (trackHelper) {
            let track = trackHelper.track;
            let geometry = {
                parent: {
                    type: 'Point',
                    coordinates: [track.parent_lon, track.parent_lat]
                },
                child: {
                    type: 'Point',
                    coordinates: [track.child_lon, track.child_lat]
                }
            };

            let properties = {
                parent: {
                    guid: track.track_guid,
                    clusterCaption: `${track.parent_street} ${track.parent_house}`,
                    iconCaption: `${track.parent_street} ${track.parent_house}`,
                    hintContent: `${track.parent_street} ${track.parent_house}`,
                    balloonContentHeader: `${track.parent_street} ${track.parent_house}`,
                    balloonContentBody: `${track.child_street} ${track.child_house}`,
                    balloonContentFooter: ''
                },
                child: {
                    guid: track.track_guid,
                    clusterCaption: `${track.child_street} ${track.child_house}`,
                    iconCaption: `${track.child_street} ${track.child_house}`,
                    hintContent: `${track.child_street} ${track.child_house}`,
                    balloonContentHeader: `${track.child_street} ${track.child_house}`,
                    balloonContentBody: `${track.parent_street} ${track.parent_house}`,
                    balloonContentFooter: ''
                }
            };

            let options = {
                preset: 'islands#glyphCircleIcon', // glyphIcon glyphCircleIcon
                iconCaptionMaxWidth: '150'
                // iconGlyph: '', /* transfer sort | asterisk certificate | flash  */
                // iconGlyphColor: '#00A4E4'
            };

            return {
                parent: new ymaps.GeoObject({ geometry: geometry.parent, properties: properties.parent }, options),
                child: new ymaps.GeoObject({ geometry: geometry.child, properties: properties.child }, options)
            };
        }

        clusterer (points) {
            var clusterIcons = [
                {
                    href: '',
                    size: [30, 30],
                    offset: [-15, -15]
                }
            ];
            let tlf = ymaps.templateLayoutFactory.createClass(
                `<div
                    style="
                        width: 30px;
                        height: 30px;
                        background-color: rgba(var(--cerulean), .8);
                        border-radius: 100%;
                        border: 4px double rgba(var(--white), 1);
                        color: rgba(var(--white), 1);
                        font-weight: bold;
                        line-height: 22px;
                    ">
                    {{ properties.geoObjects.length }}
                </div>`);
            let options = {
                // preset: 'islands#invertedGrayClusterIcons',
                clusterIcons: clusterIcons,
                clusterIconContentLayout: tlf,
                clusterDisableClickZoom: true
            };

            let clusterer = new ymaps.Clusterer(options);
            clusterer.add(points);

            return clusterer;
        }

        mark () {
            function Mark () {
                let mark = null; // Placemark
                let loca = { ciry: '', street: '', house: '', latitude: null, longitude: null }; // localities
                let prop = { iconCaption: 'Поиск адреса...' };
                let opts = { preset: 'islands#redDotIconWithCaption', draggable: true };

                let hint = function () { return { iconCaption: 'Добавить точку соединения', balloonContent: balloonContent() }; };
                let onGeocoded = function (e) { let geo = e.geoObjects.get(0); loca.city = geo.getLocalities()[0]; loca.street = geo.getThoroughfare() || geo.getPremise() || ''; this.get().properties.set(hint()); };
                let balloonContent = function () { return `<div id='node' class='frame'> <div class='wrapper'> <div class='header'></div> <div class='body'> <div class='section info'> <div> <input type='text' title='Название соединения' placeholder='Введите название соединения' value='${loca.street}' data-city='${loca.city}' data-street='${loca.street}' data-lon='${loca.longitude}' data-lat='${loca.latitude}'> </div> </div> </div> <div class='footer'> <div class='section controls'> <div id='save' class='button save'></div> </div> </div> </div> </div>`; };

                this.init = function (coords) { loca.longitude = coords[0]; loca.latitude = coords[1]; return this; };
                this.create = function () { mark = new ymaps.Placemark([loca.longitude, loca.latitude], prop, opts); return this; };
                this.get = function () { return mark; };
                this.move = function () { this.get().geometry.setCoordinates([loca.longitude, loca.latitude]); this.find(); };
                this.find = function () { this.get().properties.set(prop); ymaps.geocode([loca.longitude, loca.latitude]).then(onGeocoded.bind(this)); };
                this.onDragged = function (cb) { this.get().events.add('dragend', cb.bind(this)); return this; };
                this.onClicked = function (cb) { this.get().events.add('click', cb.bind(this)); return this; };

                return this;
            };

            return new Mark();
        }
    }

    return MapView;
});
