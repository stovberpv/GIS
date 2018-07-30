define(['ymaps'], function (ymaps) {
    'use strict';

    /**
     *
     * @class Track
     */
    class TrackHelper {
        /**
         *Creates an instance of Track.
         * @param {*} track
         * @memberof Track
         */
        constructor (track = {}) {
            this._track = {
                track_guid: track.track_guid ? track.track_guid : '',
                parent_guid: track.parent_guid ? track.parent_guid : '',
                parent_city: track.parent_city ? track.parent_city : '',
                parent_street: track.parent_street ? track.parent_street : '',
                parent_house: track.parent_house ? track.parent_house : '',
                parent_lat: track.parent_lat ? parseFloat(track.parent_lat) : '',
                parent_lon: track.parent_lon ? parseFloat(track.parent_lon) : '',
                child_guid: track.child_guid ? track.child_guid : '',
                child_city: track.child_city ? track.child_city : '',
                child_street: track.child_street ? track.child_street : '',
                child_house: track.child_house ? track.child_house : '',
                child_lat: track.child_lat ? parseFloat(track.child_lat) : '',
                child_lon: track.child_lon ? parseFloat(track.child_lon) : '',
                line_description: track.line_description ? track.line_description : '',
                line_length: track.line_length ? parseFloat(track.line_length) : '',
                label_begin: track.label_begin ? parseFloat(track.label_begin) : '',
                label_end: track.label_end ? parseFloat(track.label_end) : '',
                cabel_cores: track.cabel_cores ? parseInt(track.cabel_cores) : '',
                cabel_type: track.cabel_type ? track.cabel_type : '',
                is_active: track.is_active ? track.is_active : true,
                is_actual: track.is_actual ? track.is_actual : true
            };

            return this;
        }

        /**
         *
         * @readonly
         * @memberof Track
         */
        get track () { return this._track; }

        /**
         * FIX перенести
         *
         * @return
         * @memberof Track
         */
        coordinates () {
            let self = this;
            return new Promise(async (resolve, reject) => {
                let track = this.track;
                let geo = !!track.parent_lat + !!track.parent_lon + !!track.child_lat + !!track.child_lon;

                if (!geo) {
                    let parent, child;

                    parent = `Город ${track.parent_city}, ${track.parent_street}, дом ${track.parent_house}`.trim();
                    try { parent = await ymaps.geocode(parent); } catch (e) { reject(e); }
                    parent = parent.metaData.geocoder.results ? parent.geoObjects.get(0).geometry.getCoordinates() : null;
                    this._track.parent_lon = parent[0];
                    this._track.parent_lat = parent[1];

                    child = `Город ${track.child_city}, ${track.child_street}, дом ${track.child_house}`.trim();
                    try { child = await ymaps.geocode(child); } catch (e) { reject(e); }
                    child = child.metaData.geocoder.results ? child.geoObjects.get(0).geometry.getCoordinates() : null;
                    this._track.child_lon = child[0];
                    this._track.child_lat = child[1];
                }

                resolve(self);
            });
        }

        /**
         *
         *
         * @static
         * @param  {any} target
         * @return
         * @memberof Track
         */
        static readForm (target) {
            let trackGuid = target.querySelector('.track-guid input');
            let parentGuid = target.querySelector('.parent-guid input');
            let parentCity = target.querySelector('.parent-city input');
            let parentStreet = target.querySelector('.parent-street input');
            let parentHouse = target.querySelector('.parent-house input');
            let parentLat = target.querySelector('.parent-lat input');
            let parentLon = target.querySelector('.parent-lon input');
            let childGuid = target.querySelector('.child-guid input');
            let childCity = target.querySelector('.child-city input');
            let childStreet = target.querySelector('.child-street input');
            let childHouse = target.querySelector('.child-house input');
            let childLat = target.querySelector('.child-lat input');
            let childLon = target.querySelector('.child-lon input');
            let lineDescription = target.querySelector('.line-description input');
            let lineLength = target.querySelector('.line-length input');
            let labelBegin = target.querySelector('.label-begin input');
            let labelEnd = target.querySelector('.label-end input');
            let cabelCores = target.querySelector('.cabel-cores input');
            let cabelType = target.querySelector('.cabel-type input');
            return {
                track_guid: trackGuid ? trackGuid.value : '',
                parent_guid: parentGuid ? parentGuid.value : '',
                parent_city: parentCity ? parentCity.value : '',
                parent_street: parentStreet ? parentStreet.value : '',
                parent_house: parentHouse ? parentHouse.value : '',
                parent_lat: parentLat ? parentLat.value : '',
                parent_lon: parentLon ? parentLon.value : '',
                child_guid: childGuid ? childGuid.value : '',
                child_city: childCity ? childCity.value : '',
                child_street: childStreet ? childStreet.value : '',
                child_house: childHouse ? childHouse.value : '',
                child_lat: childLat ? childLat.value : '',
                child_lon: childLon ? childLon.value : '',
                line_description: lineDescription ? lineDescription.value : '',
                line_length: lineLength ? lineLength.value : '',
                label_begin: labelBegin ? labelBegin.value : '',
                label_end: labelEnd ? labelEnd.value : '',
                cabel_cores: cabelCores ? cabelCores.value : '',
                cabel_type: cabelType ? cabelType.value : ''
            };
        }

        /**
         *
         *
         * @static
         * @param  {any} target
         * @param  {any} values
         * @return
         * @memberof Track
         */
        static fillForm (target, values) {
            let trackGuid = target.querySelector('.track-guid input');
            let parentGuid = target.querySelector('.parent-guid input');
            let parentCity = target.querySelector('.parent-city input');
            let parentStreet = target.querySelector('.parent-street input');
            let parentHouse = target.querySelector('.parent-house input');
            let parentLat = target.querySelector('.parent-lat input');
            let parentLon = target.querySelector('.parent-lon input');
            let childGuid = target.querySelector('.child-guid input');
            let childCity = target.querySelector('.child-city input');
            let childStreet = target.querySelector('.child-street input');
            let childHouse = target.querySelector('.child-house input');
            let childLat = target.querySelector('.child-lat input');
            let childLon = target.querySelector('.child-lon input');
            let lineDescription = target.querySelector('.line-description input');
            let lineLength = target.querySelector('.line-length input');
            let labelBegin = target.querySelector('.label-begin input');
            let labelEnd = target.querySelector('.label-end input');
            let cabelCores = target.querySelector('.cabel-cores input');
            let cabelType = target.querySelector('.cabel-type input');

            if (trackGuid) {
                trackGuid.value = values.track_guid ? values.track_guid : '';
                trackGuid.setAttribute('value', (values.track_guid ? values.track_guid : ''));
            }
            if (parentGuid) {
                parentGuid.value = values.track_parent_guid ? values.track_parent_guid : '';
                parentGuid.setAttribute('value', (values.track_parent_guid ? values.track_parent_guid : ''));
            }
            if (parentCity) {
                parentCity.value = values.track_parent_city ? values.track_parent_city : '';
                parentCity.setAttribute('value', (values.track_parent_city ? values.track_parent_city : ''));
            }
            if (parentStreet) {
                parentStreet.value = values.track_parent_street ? values.track_parent_street : '';
                parentStreet.setAttribute('value', (values.track_parent_street ? values.track_parent_street : ''));
            }
            if (parentHouse) {
                parentHouse.value = values.track_parent_house ? values.track_parent_house : '';
                parentHouse.setAttribute('value', (values.track_parent_house ? values.track_parent_house : ''));
            }
            if (parentLat) {
                parentLat.value = values.track_parent_lat ? values.track_parent_lat : '';
                parentLat.setAttribute('value', (values.track_parent_lat ? values.track_parent_lat : ''));
            }
            if (parentLon) {
                parentLon.value = values.track_parent_lon ? values.track_parent_lon : '';
                parentLon.setAttribute('value', (values.track_parent_lon ? values.track_parent_lon : ''));
            }
            if (childGuid) {
                childGuid.value = values.track_child_guid ? values.track_child_guid : '';
                childGuid.setAttribute('value', (values.track_child_guid ? values.track_child_guid : ''));
            }
            if (childCity) {
                childCity.value = values.track_child_city ? values.track_child_city : '';
                childCity.setAttribute('value', (values.track_child_city ? values.track_child_city : ''));
            }
            if (childStreet) {
                childStreet.value = values.track_child_street ? values.track_child_street : '';
                childStreet.setAttribute('value', (values.track_child_street ? values.track_child_street : ''));
            }
            if (childHouse) {
                childHouse.value = values.track_child_house ? values.track_child_house : '';
                childHouse.setAttribute('value', (values.track_child_house ? values.track_child_house : ''));
            }
            if (childLat) {
                childLat.value = values.track_child_lat ? values.track_child_lat : '';
                childLat.setAttribute('value', (values.track_child_lat ? values.track_child_lat : ''));
            }
            if (childLon) {
                childLon.value = values.track_child_lon ? values.track_child_lon : '';
                childLon.setAttribute('value', (values.track_child_lon ? values.track_child_lon : ''));
            }
            if (lineDescription) {
                lineDescription.value = values.line_description ? values.line_description : '';
                lineDescription.setAttribute('value', (values.line_description ? values.line_description : ''));
            }
            if (lineLength) {
                lineLength.value = values.line_length ? values.line_length : '';
                lineLength.setAttribute('value', (values.line_length ? values.line_length : ''));
            }
            if (labelBegin) {
                labelBegin.value = values.label_begin ? values.label_begin : '';
                labelBegin.setAttribute('value', (values.label_begin ? values.label_begin : ''));
            }
            if (labelEnd) {
                labelEnd.value = values.label_end ? values.label_end : '';
                labelEnd.setAttribute('value', (values.label_end ? values.label_end : ''));
            }
            if (cabelCores) {
                cabelCores.value = values.cabel_cores ? values.cabel_cores : '';
                cabelCores.setAttribute('value', (values.cabel_cores ? values.cabel_cores : ''));
            }
            if (cabelType) {
                cabelType.value = values.cabel_type ? values.cabel_type : '';
                cabelType.setAttribute('value', (values.cabel_type ? values.cabel_type : ''));
            }

            return target;
        }

        /**
         *
         * @param {Object} values
         */
        static isNotEmpty (values) {
            return !!values.parent_street && !!values.child_street;
        }
    }

    return TrackHelper;
});
