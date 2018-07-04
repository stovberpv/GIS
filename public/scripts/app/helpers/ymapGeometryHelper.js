define(['ymaps'], function (ymaps) {
    'use strict';

    class Geometry {
        constructor () {
            return this;
        }
        static lineString (track, coordinates) {
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

        static point (route, coordinates) {
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
                balloonContentFooter:
                    `<div>${route.info}</div>
                        </br>
                        <div class='point-control-wrapper'>
                            <div class='point-data-holder' data-relation-guid='${route.guid}'></div>
                            <div class='point-control-el point-checkbox'></div>
                            <div class='point-control-el point-button'>Удалить</div>
                        </div>
                    </div>`
            };

            let options = {
                preset: 'islands#glyphCircleIcon',
                iconGlyph: 'certificate', /* transfer sort | asterisk certificate | flash  */
                iconGlyphColor: '#FFE100'
            };

            return new ymaps.GeoObject({ geometry: geometry, properties: properties }, options);
        }

        static cluster () {
            let options = {
                clusterDisableClickZoom: true,
                preset: 'islands#invertedBlueClusterIcons'
            };

            return new ymaps.Clusterer(options);
        }

        static initEvents (target) {
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
    }

    return Geometry;
});
