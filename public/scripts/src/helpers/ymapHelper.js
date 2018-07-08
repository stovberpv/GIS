define(['@app/globals', 'ymaps', '@app/helpers/trackHelper', '@app/util/promiseDelay'], function (globals, ymaps, TrackHelper, delay) {
    'use strict';

    /**
     *
     *
     * @class Ymap
     */
    class Ymap {
        /**
         *Creates an instance of Ymap.
         * @param {*} opts
         * @memberof Ymap
         */
        constructor(opts) {
            this._ymap = null;

            this._attachTo = opts ? opts.attachTo : 'map';
            this._defCoord = [44.952116, 34.102411];
            this._defControls = ['zoomControl', 'typeSelector', 'fullscreenControl', 'rulerControl'];
            this._defOpts = { suppressMapOpenBlock: true };
            this._defZoom = 13;

            this._buttons = {
                self: this,
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
                inputOne: function () {
                    let self = this.self;
                    let button = (() => {
                        let data = { content: 'Добавить трассу', image: 'images/branch.svg' };
                        let options = { maxWidth: 150, float: 'left' };
                        return new ymaps.control.Button({ data: data, options: options });
                    })();

                    function pressEvent() {
                        let template = self._popupFowms.newTrack();
                        template.querySelector('.footer .button.check').addEventListener('click', self._buttons.getGeo.bind(self));
                        template.querySelector('.footer .button.add').addEventListener('click', self._buttons.saveOne.bind(self));
                        template.querySelector('.footer .button.cancel').addEventListener('click', self._buttons.cancel);

                        document.body.appendChild(template);
                    }

                    button.events.add('press', pressEvent);

                    return button;
                },
                inputMass: function () {
                    let self = this.self;
                    let button = (() => {
                        let data = { content: 'Пакетный ввод', image: `images/library.svg` };
                        let options = { maxWidth: 150, float: 'left' };
                        return new ymaps.control.Button({ data: data, options: options });
                    })();

                    function pressEvent() {
                        let template = self._popupFowms.massUpload();
                        template.querySelector('.footer .button.save').addEventListener('click', self._buttons.saveMass.bind(self));
                        template.querySelector('.footer .button.cancel').addEventListener('click', self._buttons.cancel);

                        document.body.appendChild(template);
                    }

                    button.events.add('press', pressEvent);

                    return button;
                },
                saveOne: async function (e) {
                    let self = this;
                    let wrapper = e.target.closest('.add-route-wrapper');

                    if (!wrapper) return;

                    try { await self._buttons.getGeo(e); } catch (e) { return; };

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

                    self._buttons.cancel(e);
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

                    self._buttons.cancel(e);
                },
                remove: function (e, data) {
                    if (!e.querySelector('#checkbox').classList.contains('selected')) return;

                    globals.socket.emit('removeRelation', data.guid);
                },
                update: function (e, data) {
                    let inputInfo = e.querySelector('input#info');
                    if (!inputInfo.classList.contains('edited')) return;

                    inputInfo.classList.remove('edited');

                    globals.socket.emit('updateRelation', { guid: data.guid, text: inputInfo.value });
                },
                cancel: function (e) {
                    let frame = e.target.closest('.popup-frame');
                    frame.parentNode.removeChild(frame);
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
                        `<div class='point-footer-wrapper'>
                            <input type='text' id='info' name='info' placeholder='Комментарий' autocomplete='on' value='${opts.text.info}' data-relation-guid='${opts.text.guid}'/>
                            <div class='point-controls'>
                                <div id='checkbox'      class='point-control point-checkbox'></div>
                                <div id='button-remove' class='point-control point-button remove'>Удалить</div>
                                <div id='button-save'   class='point-control point-button save'>Сохранить</div>
                            </div>
                        </div>`;
                    return template;
                }
            };

            return this;
        }

        /**
         *
         *
         * @memberof Ymap
         */
        set attachTo(val) { this._attachTo = val; } get attachTo() { return this._attachTo; }
        /**
         *
         *
         * @memberof Ymap
         */
        set ymap(val) { /* this._ymap = val; */ } get ymap() { return this._ymap; }

        /**
         *
         * @return
         * @memberof Ymap
         */
        init() {
            return new Promise(async (resolve, reject) => {
                try { await ymaps.ready(); resolve(); } catch (e) { reject(); }
            });
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        attach() {
            this._ymap = new ymaps.Map(this._attachTo, { center: this._defCoord, controls: this._defControls, zoom: this._defZoom }, this._defOpts);
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        bindMapEvents() {
            let self = this;

            function clicked(e) {
                let target = e.target;

                let wrapper = target.closest('.point-footer-wrapper');
                if (!wrapper) return;

                let guid = wrapper.querySelector('input#info').dataset.relationGuid;
                if (!guid) return;

                switch (target.id) {
                    case 'checkbox': target.classList.toggle('selected'); break;
                    case 'button-remove': self._buttons.remove(wrapper, { guid: guid }); break;
                    case 'button-save': self._buttons.update(wrapper, { guid: guid }); break;
                    default: break;
                }
            }

            function keypressed(e) {
                let target = e.target;
                let wrapper = target.closest('.point-footer-wrapper');
                if (!wrapper) return;
                if (target.id !== 'info') return;
                !target.classList.contains('edited') && target.classList.add('edited');
            }

            document.getElementById(this._attachTo).addEventListener('click', clicked);
            document.getElementById(this._attachTo).addEventListener('keypress', keypressed);
        }

        /**
         *
         * @param  {any} target
         * @return {void}@memberof Ymap
         */
        bindGeoObjEvents(target) {
            target.events.add(['hover', 'mouseleave'], function (e) {
                let target = e.get('target');
                let type = e.get('type');
                if (type === 'hover') {
                    target.options.set('strokeColor', '#FF0000');
                    // target.options.set('iconGlyphColor', '#FF0000');
                } else {
                    target.options.set('strokeColor', '#1E98FF');
                    // target.options.set('iconGlyphColor', '#1E98FF');
                }
            });
        }

        /**
         *
         * @return {void}@memberof Ymap
         */
        addControl() {
            this._ymap.controls.add(this._buttons.inputOne());
            this._ymap.controls.add(this._buttons.inputMass());
        }

        /**
         *
         * @param  {any} relations
         * @return
         * @memberof Ymap
         */
        async addRelation(relations) {
            let self = this;
            // Координатные точки добавялемые на карту через кластеризатор
            let points = [];
            let lines = [];
            // Данные должны быть переданы массивом
            if (!Array.isArray(relations)) { return; }
            //
            await Promise.all([1].map(async () => {
                for (let relation of relations) {
                    let coordinates;

                    let th = new TrackHelper(relation);
                    try { coordinates = await th.coordinates(); } catch (e) { return; };

                    (() => {
                        let line = self.lineString(th.track, coordinates);
                        self.bindGeoObjEvents(line);
                        lines.push(line);
                    })();

                    (() => {
                        let trackData = {
                            guid: th.track.guid,
                            clusterCaption: `${th.track.parent.street} ${th.track.parent.house}`,
                            hintContent: `${th.track.parent.street} ${th.track.parent.house}`,
                            balloonHeader: `${th.track.parent.street} ${th.track.parent.house}`,
                            balloonBody: `${th.track.child.street} ${th.track.child.house}`,
                            info: th.track.info,
                            coordinates: coordinates[0]
                        };
                        let point = self.point(trackData);
                        self.bindGeoObjEvents(point);
                        points.push(point);
                    })();

                    (() => {
                        let trackData = {
                            guid: th.track.guid,
                            clusterCaption: `${th.track.child.street} ${th.track.child.house}`,
                            hintContent: `${th.track.child.street} ${th.track.child.house}`,
                            balloonHeader: `${th.track.child.street} ${th.track.child.house}`,
                            balloonBody: `${th.track.parent.street} ${th.track.parent.house}`,
                            info: th.track.info,
                            coordinates: coordinates[1]
                        };
                        let point = self.point(trackData);
                        self.bindGeoObjEvents(point);
                        points.push(point);
                    })();
                }
            }));

            let clusterer = self.clusterer(points);
            self._ymap.geoObjects.add(clusterer);

            lines.forEach(l => self._ymap.geoObjects.add(l));
        }

        /**
         *
         * @param {*} relation
         */
        updateRelation(relations) {
            let self = this;

            relations.forEach(relation => {
                self._ymap.geoObjects.each(o => {
                    switch (o.options.getName()) {
                        case 'geoObject':
                            if (o.properties.get('guid') === relation.guid) {
                                o.properties.set('balloonContent', relation.text);
                            }
                            break;

                        case 'clusterer':
                            o.getGeoObjects().forEach(p => {
                                if (p.properties.get('guid') === relation.guid) {
                                    let template = document.createElement('template');
                                    template.innerHTML = p.properties.get('balloonContentFooter');
                                    let content = template.content.firstChild;
                                    content.querySelector('input#info').value = relation.text;
                                    content.querySelector('input#info').setAttribute('value', relation.text);
                                    p.properties.set('balloonContentFooter', template.innerHTML);
                                }
                            });
                            break;

                        default: break;
                    }
                });
            });
        }

        /**
         *
         * @param  {any} relation
         * @return {void}@memberof Ymap
         */
        removeRelation(relation) {
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
         * @param  {any} track
         * @param  {any} coordinates
         * @return
         * @memberof Ymap
         */
        lineString(track, coordinates) {
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
                opacity: 0.5
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        /**
         *
         * @param  {any} data
         * @param  {any} coordinates
         * @return
         * @memberof Ymap
         */
        point(data) {
            let geometry = {
                type: 'Point',
                coordinates: data.coordinates
            };

            let properties = {
                guid: data.guid,
                clusterCaption: data.clusterCaption, // `КК${data.child.street} ${data.child.house}`,
                hintContent: data.hintContent, // `ХК${data.child.street} ${data.child.house}`,
                balloonContentHeader: data.balloonHeader, // `БХ${data.child.street} ${data.child.house}`,
                balloonContentBody: data.balloonBody, // `ББ[${data.parent.street} ${data.parent.house}]`,
                balloonContentFooter: this._popupFowms.balloonFooter({ text: { info: data.info, guid: data.guid } })
            };

            let options = {
                preset: 'islands#glyphCircleIcon', // glyphIcon glyphCircleIcon
                iconGlyph: '', /* transfer sort | asterisk certificate | flash  */
                iconGlyphColor: '#1E98FF'
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        /**
         *
         * @param  {any} points
         * @return
         * @memberof Ymap
         */
        clusterer(points) {
            var clusterIcons = [
                {
                    href: '',
                    size: [50, 50],
                    offset: [-25, -25]
                }
            ];
            let tlf = ymaps.templateLayoutFactory.createClass(
                `<div
                    style="
                        width: 50px;
                        height: 50px;
                        box-shadow: 0 0 10px 0 rgba(039, 046, 057, .7);
                        background-color: rgba(054, 064, 080, .7);
                        border-radius: 100%;
                        color: rgba(255, 255, 255, 1);
                        font-weight: bold;
                        line-height: 50px;
                    ">
                    {{ properties.geoObjects.length }}
                </div>`);
            let options = {
                preset: 'islands#invertedBlackClusterIcons',
                // clusterIcons: clusterIcons,
                // clusterIconContentLayout: tlf,
                clusterDisableClickZoom: true
            };

            let clusterer = new ymaps.Clusterer(options);
            clusterer.add(points);

            return clusterer;
        }
    }

    return Ymap;
});
