define(['ymaps'], function (ymaps) {
    'use strict';

    /**
     *
     * @class TrackHelper
     */
    class TrackHelper {
        /**
         *Creates an instance of TrackHelper.
         * @param {*} track
         * @memberof TrackHelper
         */
        constructor (track) {
            this._track = {
                guid: track.guid,
                parent: {
                    city: track.p_city,
                    street: track.p_street,
                    house: track.p_house,
                    geo: { lat: parseFloat(track.p_lat), lon: parseFloat(track.p_lon) }
                },
                child: {
                    city: track.c_city,
                    street: track.c_street,
                    house: track.c_house,
                    geo: { lat: parseFloat(track.c_lat), lon: parseFloat(track.c_lon) }
                },
                info: track.text
            };

            return this;
        }
        /**
         *
         *
         * @memberof TrackHelper
         */
        set track (val) { /* this._route = val; */ } get track () { return this._track; }

        /**
         *
         * @return
         * @memberof TrackHelper
         */
        async coordinates () {
            let track = this.track;
            let geo = !!track.parent.geo.lat + !!track.parent.geo.lon + !!track.child.geo.lat + !!track.child.geo.lon;
            let result;

            if (geo) {
                result = [[track.parent.geo.lat, track.parent.geo.lon], [track.child.geo.lat, track.child.geo.lon]];
            } else {
                let parent, child;

                parent = `Город ${track.parent.city}, ${track.parent.street}, дом ${track.parent.house}`.trim();
                try { parent = await ymaps.geocode(parent); } catch (e) { return result; }
                parent = parent.metaData.geocoder.results ? parent.geoObjects.get(0).geometry.getCoordinates() : null;
                this._track.parent.geo.lat = parent[0];
                this._track.parent.geo.lon = parent[1];

                child = `Город ${track.child.city}, ${track.child.street}, дом ${track.child.house}`.trim();
                try { child = await ymaps.geocode(child); } catch (e) { return result; }
                child = child.metaData.geocoder.results ? child.geoObjects.get(0).geometry.getCoordinates() : null;
                this._track.child.geo.lat = child[0];
                this._track.child.geo.lon = child[1];

                if (parent && child) {
                    result = [parent, child];
                }
            }

            return result;
        }
    }

    return TrackHelper;
});
