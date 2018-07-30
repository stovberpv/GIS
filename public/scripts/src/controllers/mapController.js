define(['@app/globals', 'ymaps', '@app/helpers/trackHelper', '@app/views/trackView', '@app/views/mapView'], function (globals, ymaps, TrackHelper, TrackView, MapView) {
    'use strict';

    class MapController {
        constructor (opts = {}) {
            this._ymap = null;
            this._mapView = new MapView();
            this._attachTo = 'map';

            return this;
        }

        get map () { return this._ymap; }

        async create () {
            try { await this._mapView.load(); } catch (e) { console.log(e); return; }

            this._ymap = new ymaps.Map(this._attachTo, this._mapView.stateConfig, this._mapView.optionsConfig);
        }

        setEvents () {
            let mark = this._mapView.mark();

            function onMapClicked (e) {
                mark.init(e.get('coords'));
                if (mark.get()) {
                    mark.move();
                } else {
                    mark.create();
                    mark.onDragged(function (e) { this.init(e.originalEvent.target.geometry.getCoordinates()).find(); });
                    mark.find();
                    this._ymap.geoObjects.add(mark.get());
                }
            }

            this._ymap.events.add('click', onMapClicked.bind(this));
        }

        addControl () {
            let button = new ymaps.control.Button({ data: { content: 'Добавить трассу', image: 'images/branch.svg' }, options: { maxWidth: 150, float: 'left' } });

            function pressEvent () {
                let viewOpts = {
                    format: { dom: true },
                    header: true,
                    body: true,
                    footer: true,
                    sections: { a: true, b: true, i: true },
                    controls: { save: true, cancel: true }
                };

                let view = new TrackView(viewOpts).build();
                TrackHelper.fillForm(view.view, { track_parent_city: 'Симферополь', track_child_city: 'Симферополь' });
                view.show('#map-page');
            }

            button.events.add('press', pressEvent);

            this._ymap.controls.add(button);
        }

        _setGeoObjectEvents (target) {
            target.events.add(['hover', 'mouseleave'], function (e) {
                let target = e.get('target');
                let type = e.get('type');
                if (type === 'hover') {
                    target.options.set('strokeColor', '#FF0000');
                } else {
                    target.options.set('strokeColor', '#1E98FF');
                }
            });
        }

        async addRelation (relations) {
            if (!Array.isArray(relations)) { return; }

            let self = this;
            let points = [];
            let lines = [];

            let trackView = function (track) {
                let viewOpts = {
                    format: { dom: true }, /* html: true */
                    body: true,
                    footer: true,
                    sections: { i: true },
                    controls: { checkbox: true, remove: true, save: true }
                };
                let balloonContentFooter = new TrackView(viewOpts).build();
                balloonContentFooter = TrackHelper.fillForm(balloonContentFooter.view, track);

                return {
                    dom: balloonContentFooter,
                    html: balloonContentFooter.outerHTML
                };
            };

            await Promise.all([1].map(async () => {
                for (let track of relations) {
                    let trackHelper;

                    try { trackHelper = await new TrackHelper(track).coordinates(); } catch (e) { return; }

                    (() => {
                        let line = self._mapView.lineString(trackHelper);
                        let balloonContentFooter = new TrackView({ format: { dom: true }, body: true, sections: { i: true } }).build();
                        balloonContentFooter = TrackHelper.fillForm(balloonContentFooter.view, track);
                        line.properties.set('balloonContent', balloonContentFooter.outerHTML);

                        self._setGeoObjectEvents(line);
                        lines.push(line);
                    })();

                    (() => {
                        let point = self._mapView.point(trackHelper);
                        let view = trackView(trackHelper.track);
                        point.parent.properties.set('balloonContentFooter', view.html);
                        point.child.properties.set('balloonContentFooter', view.html);

                        self._setGeoObjectEvents(point.parent);
                        points.push(point.parent);

                        self._setGeoObjectEvents(point.child);
                        points.push(point.child);
                    })();
                }
            }));

            let clusterer = self._mapView.clusterer(points);
            self._ymap.geoObjects.add(clusterer);

            lines.forEach(l => self._ymap.geoObjects.add(l));
        }

        updateRelation (relations) {
            let self = this;

            let trackView = function (track, view) {
                let template = document.createElement('template');
                template.innerHTML = view;
                view = TrackHelper.fillForm(template.content.firstChild, track);
                return view.outerHTML;
            };

            relations.forEach(track => {
                self._ymap.geoObjects.each(o => {
                    switch (o.options.getName()) {
                        case 'geoObject':
                            if (o.properties.get('guid') === track.track_guid) {
                                o.properties.set('balloonContent', trackView(track, o.properties.get('balloonContent')));
                            }
                            break;

                        case 'clusterer':
                            o.getGeoObjects().forEach(p => {
                                if (p.properties.get('guid') === track.track_guid) {
                                    p.properties.set('balloonContentFooter', trackView(track, p.properties.get('balloonContentFooter')));
                                }
                            });
                            break;

                        default: break;
                    }
                });
            });
        }

        removeRelation (track) {
            let self = this;
            self._ymap.geoObjects.each(o => {
                switch (o.options.getName()) {
                    case 'geoObject': o.properties.get('guid') === track.track_guid && self._ymap.geoObjects.remove(o); break;
                    case 'clusterer': o.getGeoObjects().forEach(p => p.properties.get('guid') === track.track_guid && o.remove(p)); break;
                    default: break;
                }
            });
        }
    }

    return MapController;
});
