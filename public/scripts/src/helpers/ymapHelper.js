define(['@app/globals', 'ymaps', '@app/helpers/trackHelper', '@app/util/promiseDelay'], function (globals, ymaps, TrackHelper, delay) {
    'use strict';

    class Ymap {
        constructor (opts) {
            this._attachTo = opts ? opts.attachTo : 'map';
            this.defCoord = [44.952116, 34.102411];
            this.defControls = ['zoomControl', 'typeSelector', 'fullscreenControl', 'rulerControl'];
            this.defZoom = 13;

            this._ymap = null;

            this._func = {
                getGeo: async function (e) {
                    let wrapper = e.target.closest('.add-route-wrapper');

                    if (!wrapper) return;

                    let data = {
                        parent: wrapper.querySelectorAll('.parent input'),
                        child: wrapper.querySelectorAll('.child input')
                    };

                    (() => {
                        data.parent[3].classList.add('isVerified');
                        data.parent[4].classList.add('isVerified');
                        data.child[3].classList.add('isVerified');
                        data.child[4].classList.add('isVerified');
                    })();

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

                    (() => {
                        data.parent[3].classList.remove('isVerified');
                        data.parent[4].classList.remove('isVerified');
                        data.child[3].classList.remove('isVerified');
                        data.child[4].classList.remove('isVerified');
                    })();
                },

                saveSingle: async function (e) {
                    let self = this;
                    let wrapper = e.target.closest('.add-route-wrapper');

                    if (!wrapper) return;

                    try { await self._func.getGeo(e); } catch (e) { return; };

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

                    self._func.cancel(e);
                },

                saveMass: async function (e) {
                    let self = this;
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

                        globals.socket.emit('addRelation', relation);
                    }

                    self._func.cancel(e);
                },

                cancel: function (e) {
                    let frame = e.target.closest('.popup-frame');
                    frame.parentNode.removeChild(frame);
                }
            };

            this._buttons = {
                self: this,
                addOne: function () {
                    let self = this.self;
                    let button = (() => {
                        let data = { content: 'Добавить трассу', image: 'images/branch.svg' };
                        let options = { maxWidth: 150, float: 'left' };
                        return new ymaps.control.Button({ data: data, options: options });
                    })();

                    function pressEvent () {
                        let template = self._popupFowms.newTrack();
                        template.querySelector('.footer .button.check').addEventListener('click', self._func.getGeo.bind(self));
                        template.querySelector('.footer .button.add').addEventListener('click', self._func.saveSingle.bind(self));
                        template.querySelector('.footer .button.cancel').addEventListener('click', self._func.cancel);

                        document.body.appendChild(template);
                    }

                    button.events.add('press', pressEvent);

                    return button;
                },
                addMass () {
                    let self = this.self;
                    let button = (() => {
                        let data = { content: 'Пакетный ввод', image: `images/library.svg` };
                        let options = { maxWidth: 150, float: 'left' };
                        return new ymaps.control.Button({ data: data, options: options });
                    })();

                    function pressEvent () {
                        let template = self._popupFowms.massUpload();
                        template.querySelector('.footer .button.save').addEventListener('click', self._func.saveMass.bind(self));
                        template.querySelector('.footer .button.cancel').addEventListener('click', self._func.cancel);

                        document.body.appendChild(template);
                    }

                    button.events.add('press', pressEvent);

                    return button;
                }
            };

            this._popupFowms = {
                newTrack: function () {
                    let template = document.createElement('template');
                    template.innerHTML =
                        `<div class='add-route-frame popup-frame'>
                                <div class='add-route-wrapper wrapper'>
                                    <div class='header'>Добавление трассы</div>
                                    <div class='body'>
                                        <div class='parent address'>
                                            <input type='text' id='parent-city'      name='city'      required placeholder='A: Город'   autocomplete='on' class='city'/>
                                            <input type='text' id='parent-street'    name='street'    required placeholder='A: Улица'   autocomplete='on' class='street'/>
                                            <input type='text' id='parent-house'     name='house'              placeholder='A: Дом'     autocomplete='on' class='house'/>
                                            <input type='text' id='parent-latitude'  name='latitude'  disabled placeholder='A: Долгота' autocomplete='on' class='latitude'/>
                                            <input type='text' id='parent-longitude' name='longitude' disabled placeholder='A: Широта'  autocomplete='on' class='longitude'/>
                                        </div>
                                        <div class='child address'>
                                            <input type='text' id='child-city'      name='city'      required placeholder='B: Город'   autocomplete='on' class='city'/>
                                            <input type='text' id='child-street'    name='street'    required placeholder='B: Улица'   autocomplete='on' class='street'/>
                                            <input type='text' id='child-house'     name='house'              placeholder='B: Дом'     autocomplete='on' class='house'/>
                                            <input type='text' id='child-latitude'  name='latitude'  disabled placeholder='B: Долгота' autocomplete='on' class='latitude'/>
                                            <input type='text' id='child-longitude' name='longitude' disabled placeholder='B: Широта'  autocomplete='on' class='longitude'/>
                                        </div>
                                        <div class='information'>
                                            <input type='text' placeholder='Описание' autocomplete='on'/>
                                        </div>
                                    </div>
                                    <div class='footer'>
                                        <div class='button check'></div>
                                        <div class='button add'></div>
                                        <div class='button cancel'></div>
                                    </div>
                                </div>
                            </div>`.trim();

                    return template.content.firstChild;
                },

                massUpload: function () {
                    let template = document.createElement('template');
                    template.innerHTML =
                        `<div class='upload-mass-frame popup-frame'>
                            <div class='upload-mass-wrapper wrapper'>
                                <div class='header'>Пакетный ввод</div>
                                <div class='body'>
                                    <textarea placeholder='A:Город[\\t]Улица[\\t]Дом[\\t]B:Город[\\t]Улица[\\t]Дом[\\t]Описание[\\n]' wrap="off"></textarea>
                                </div>
                                <div class='footer'>
                                    <div class='button save'></div>
                                    <div class='button cancel'></div>
                                </div>
                            </div>
                        </div>`.trim();

                    return template.content.firstChild;
                },

                balloonFooter: function (opts) {
                    let template =
                        `<div>${opts.text.info}</div>
                                </br>
                                <div class='point-control-wrapper'>
                                    <div class='point-data-holder' data-relation-guid='${opts.text.guid}'></div>
                                    <div class='point-control-el point-checkbox'></div>
                                    <div class='point-control-el point-button'>Удалить</div>
                                </div>
                            </div>`;
                    return template;
                }
            };

            return this;
        }

        set attachTo (val) { this._attachTo = val; } get attachTo () { return this._attachTo; }
        set ymap (val) { /* this._ymap = val; */ } get ymap () { return this._ymap; }

        /**
         *
         * @return
         * @memberof Ymap
         */
        init () {
            return new Promise(async (resolve, reject) => {
                try { await ymaps.ready(); resolve(); } catch (e) { reject(); }
            });
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        attach () {
            this._ymap = new ymaps.Map(this._attachTo, { center: this.defCoord, controls: this.defControls, zoom: this.defZoom });
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        bindMapEvents () {
            document.getElementById(this._attachTo).addEventListener('click', function (e) {
                let target = e.target;
                let wrapper = target.closest('.point-control-wrapper');
                let isDeleted = false;
                let guid;

                if (!wrapper) return;

                if (target.classList.contains('point-checkbox')) {
                    target.classList.toggle('selected');
                } else if (target.classList.contains('point-button')) {
                    let cb = wrapper.querySelector('.point-checkbox');
                    if (cb.classList.contains('selected')) {
                        let data = wrapper.querySelector('.point-data-holder');
                        guid = data.dataset.relationGuid;
                        isDeleted = !!guid;
                    }
                }
                isDeleted && globals.socket.emit('removeRelation', guid);
            });
        }

        /**
         *
         * @param  {any} target
         * @return {void}@memberof Ymap
         */
        bindGeoObjEvents (target) {
            target.events.add(['hover', 'mouseleave'], function (e) {
                let target = e.get('target');
                let type = e.get('type');
                if (type === 'hover') {
                    target.options.set('strokeColor', '#FF0000');
                    target.options.set('iconGlyphColor', '#FF0000');
                } else {
                    target.options.set('strokeColor', '#1E98FF');
                    target.options.set('iconGlyphColor', '#1E98FF');
                }
            });
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        addControl () {
            this._ymap.controls.add(this._buttons.addOne());
            this._ymap.controls.add(this._buttons.addMass());
        }

        /**
         *
         * @param  {any} relation
         * @return {void}@memberof Ymap
         */
        removeRelation (relation) {
            let self = this;
            self._ymap.geoObjects.each(o => {
                switch (o.options.getName()) {
                    case 'geoObject': o.properties.get('guid') === relation.guid && self._ymap.geoObjects.remove(o); break;
                    case 'clusterer': o.getGeoObjects().forEach(p => p.properties.get('guid') === relation.guid && o.remove(p)); break;
                    default: break;
                }
            });
        }

        /**
         *
         * @param  {any} relations
         * @return
         * @memberof Ymap
         */
        async addRelation (relations) {
            let self = this;
            // Координатные точки добавялемые на карту через кластеризатор
            let points = [];
            // Данные должны быть переданы массивом
            if (!Array.isArray(relations)) { return; }
            //
            await Promise.all([1].map(async () => {
                for (let relation of relations) {
                    let track = new TrackHelper(relation);
                    let coordinates = await track.coordinates();
                    let line = self.lineString(track.track, coordinates);
                    let pointA = self.point(track.track, coordinates[0]);
                    let pointB = self.point(track.track, coordinates[1]);
                    self.bindGeoObjEvents(line);
                    self.bindGeoObjEvents(pointA);
                    self.bindGeoObjEvents(pointB);

                    self._ymap.geoObjects.add(line);
                    points.push(pointA);
                    points.push(pointB);
                }
            }));

            let clusterer = self.clusterer(points);

            self._ymap.geoObjects.add(clusterer);
        }

        /**
         *
         * @param  {any} track
         * @param  {any} coordinates
         * @return
         * @memberof Ymap
         */
        lineString (track, coordinates) {
            let geometry = {
                type: 'LineString',
                coordinates: coordinates
            };

            let properties = {
                guid: track.guid,
                hintContent: `${track.parent.street} ${track.parent.house}<-->${track.child.street} ${track.child.house}`,
                balloonContent: `${track.info}`
            };

            let options = {
                geodesic: true,
                strokeColor: '#1E98FF',
                strokeWidth: 5,
                opacity: 0.5,
                animationTime: 10000
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        /**
         *
         * @param  {any} route
         * @param  {any} coordinates
         * @return
         * @memberof Ymap
         */
        point (route, coordinates) {
            let geometry = {
                type: 'Point',
                coordinates: coordinates
            };

            let properties = {
                guid: route.guid,
                clusterCaption: `${route.child.street} ${route.child.house}`,
                hintContent: `${route.child.street} ${route.child.house}`,
                balloonContentHeader: `${route.child.street} ${route.child.house}`,
                balloonContentBody: `[${route.parent.street} ${route.parent.house}]`,
                balloonContentFooter: this._popupFowms.balloonFooter({ text: { info: route.info, guid: route.guid } })
            };

            let options = {
                preset: 'islands#glyphCircleIcon',
                iconGlyph: 'certificate', /* transfer sort | asterisk certificate | flash  */
                iconGlyphColor: '#FFE100'
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        /**
         *
         * @param  {any} points
         * @return
         * @memberof Ymap
         */
        clusterer (points) {
            let options = {
                clusterDisableClickZoom: true,
                preset: 'islands#invertedBlueClusterIcons'
            };

            let clusterer = new ymaps.Clusterer(options);
            clusterer.add(points);

            return clusterer;
        }
    }

    return Ymap;
});
