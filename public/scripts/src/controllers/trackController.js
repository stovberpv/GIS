define(['@app/globals', '@app/helpers/trackHelper'], function (globals, TrackHelper) {
    'use strict';

    class TrackController {
        constructor () {
            this._handlers = {
                getNodesList: function (e) {
                    let target = e.target;

                    if (document.querySelectorAll('#nodes-list').length) {
                        this._closePopup();
                    } else {
                        this._closePopup();

                        globals.socket.on('nodesListRequested', this._onNodesListRequested.bind(this, target));
                        globals.socket.emit('nodesListRequest');
                    }
                },
                getCableDetailsList: function (e) {
                    let target = e.target.closest('.cabel-type') || e.target.closest('.cabel-cores');

                    if (document.querySelectorAll('#info-values-list').length) {
                        this._closePopup();
                    } else {
                        this._closePopup();

                        globals.socket.on('cableDetailsRequested', this._onCableDetailsRequested.bind(this, target));
                        globals.socket.emit('cableDetailsRequest', target.querySelector('input').name);
                    }
                },
                controls: function (e) {
                    let target = e.target;

                    let frame = target.closest('#track-view.frame');
                    if (!frame) return;

                    let sections = {
                        controls: frame.querySelector('.section.controls')
                    };
                    if (!sections.controls) return;

                    let controls = {
                        checkbox: sections.controls.querySelector('#checkbox'),
                        remove: sections.controls.querySelector('#remove'),
                        save: sections.controls.querySelector('#save')
                    };

                    let trackValues = TrackHelper.readForm(frame);

                    switch (target.id) {
                        case 'checkbox':
                            controls.checkbox.classList.toggle('selected');
                            controls.remove.classList.toggle('active');
                            break;

                        case 'remove':
                            if (controls.remove.classList.contains('active')) {
                                globals.socket.emit('removeRelation', trackValues.track_guid);
                            }
                            break;

                        case 'save':
                            if (controls.save.classList.contains('active')) {
                                controls.save.classList.remove('active');

                                if (TrackHelper.isNotEmpty(trackValues)) {
                                    let emit = trackValues.track_guid ? 'updateRelation' : 'addRelation';
                                    globals.socket.emit(emit, trackValues);
                                }
                            }
                            break;

                        case 'cancel':
                            this._closePopup();
                            this._closeView();
                            break;

                        default: break;
                    }
                },
                addNode: function (e) {
                    let input = e.target.closest('#node.frame').querySelector('input');
                    if (!input) return;

                    let node = {
                        city: input.dataset.city,
                        street: input.value || input.dataset.street,
                        latitude: input.dataset.lat,
                        longitude: input.dataset.lon
                    };

                    globals.socket.emit('addNode', node);

                    globals.map.balloon.close();
                },
                keys: function (e) {
                    let key = e.keyCode;

                    switch (key) {
                        case 27:
                            this._closePopup();
                            break;

                        default:
                            if (e.target.nodeName === 'INPUT') {
                                let saveButton = e.target.closest('.frame').querySelector('#save');
                                !saveButton.classList.contains('active') && saveButton.classList.add('active');
                            }
                            break;
                    }
                }
            };
            return this;
        }

        init () {
            this._delegate('#map-page', 'div.frame', 'keypress', this._handlers.keys.bind(this));
            this._delegate('#map-page', 'div.frame', 'keyup', this._handlers.keys.bind(this));
            this._delegate('#map-page', '.section-parent.address .title-section', 'click', this._handlers.getNodesList.bind(this));
            this._delegate('#map-page', '.section-child.address .title-section', 'click', this._handlers.getNodesList.bind(this));
            this._delegate('#map-page', '.section.info .cabel-cores', 'click', this._handlers.getCableDetailsList.bind(this));
            this._delegate('#map-page', '.section.info .cabel-type', 'click', this._handlers.getCableDetailsList.bind(this));
            this._delegate('#map-page', '.section.controls', 'click', this._handlers.controls.bind(this));
            this._delegate('#map-page', '#node.frame #save', 'click', this._handlers.addNode.bind(this));
        }

        _closePopup () {
            Array.from(document.querySelectorAll('ul.popup.list')).forEach(l => l.parentNode.removeChild(l));
        }

        _closeView () {
            let view = document.getElementById('track-view');
            view.parentNode.removeChild(view);
        }

        /* FIX имена dataset для fillForm */
        _createNidesList (target, list) {
            let ul = document.createElement('ul');
            ul.id = 'nodes-list';
            ul.classList.add('popup');
            ul.classList.add('list');
            list.forEach(l => {
                let li = document.createElement('li');
                li.appendChild(document.createTextNode(`${l.city} ${l.street} ${l.house}`.trim()));
                li.setAttribute('data-guid', l.guid);
                li.setAttribute('data-city', l.city);
                li.setAttribute('data-street', l.street);
                li.setAttribute('data-house', l.house);
                li.setAttribute('data-lat', l.latitude);
                li.setAttribute('data-lon', l.longitude);
                ul.appendChild(li);
            });

            /* TODO guid fillForm */
            ul.addEventListener('click', function (target, e) {
                if (e.target.localName !== 'li') return;
                let address = target.closest('.section.address');
                address.querySelector('.city input').value = e.target.dataset.city;
                address.querySelector('.street input').value = e.target.dataset.street;
                address.querySelector('.house input').value = e.target.dataset.house === 'null' ? '' : e.target.dataset.house;
                address.querySelector('.latitude input').value = e.target.dataset.lat;
                address.querySelector('.longitude input').value = e.target.dataset.lon;

                target.closest('.frame').querySelector('#save').classList.add('active');

                this._closePopup();
            }.bind(this, target));

            return ul;
        }

        _onNodesListRequested (target, list) {
            this._closePopup();
            target.appendChild(this._createNidesList.bind(this, target)(list));

            globals.socket.removeListener('nodesListRequested', this._onNodesListRequested);
        }

        _createCableDetailsList (target, list) {
            let ul = document.createElement('ul');
            ul.id = 'info-values-list';
            ul.classList.add('popup');
            ul.classList.add('list');
            list.forEach(l => {
                let li = document.createElement('li');
                li.appendChild(document.createTextNode(l.type || l.cores));
                li.setAttribute('data-value', l.type || l.cores);
                ul.appendChild(li);
            });

            ul.addEventListener('click', function (target, e) {
                if (e.target.localName !== 'li') return;
                target.querySelector('input').value = e.target.dataset.value;

                target.closest('.frame').querySelector('#save').classList.add('active');

                this._closePopup();
            }.bind(this, target));

            return ul;
        }

        _onCableDetailsRequested (target, list) {
            this._closePopup();
            target.appendChild(this._createCableDetailsList.bind(this, target)(list));
            globals.socket.removeListener('cableDetailsRequested', this._onCableDetailsRequested);
        }

        _delegate (parent, child, event, cb) {
            let p = document.querySelector(parent);

            p.addEventListener(event, e => {
                let target = e.target;
                let closestChild = p.querySelector(child);
                if (!closestChild) return;
                if (closestChild === target || closestChild === target.closest(child)) {
                    cb.call(p, e) && e.stopPropagation();
                }
            });
        }
    }

    return TrackController;
});
