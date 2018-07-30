define([], function () {
    'use strict';

    class TrackView {
        constructor (opts) {
            this.format = opts.format || { dom: false, html: false };
            this.header = opts.header || false;
            this.body = opts.body || false;
            this.footer = opts.footer || false;
            this.sections = opts.sections || { a: false, b: false, i: false };
            this.controls = opts.controls || { checkbox: false, save: false, remove: false, cancel: true };

            this._view = null;

            return this;
        }

        get view () { return this._view; }

        _wrapper () {
            let tree =
                `<div id='track-view' class='frame' tabindex='0'>
                    <div class='wrapper'>
                        ${this._header()}
                        ${this._body()}
                        ${this._footer()}
                    </div>
                </div>`;

            return tree;
        }

        _header () {
            let tree = `<div class='header'>Добавление трассы</div>`;

            return this.header ? tree : '';
        }

        _body () {
            let tree =
                `<div class='body'>
                    ${this._sectionA('Начало', 'parent', this.sections.a)}
                    ${this._sectionA('Конец', 'child', this.sections.b)}
                    ${this._sectionI(this.sections.i)}
                </div>`;

            return this.body ? tree : '';
        }

        _footer () {
            let tree =
                `<div class='footer'>
                    <div class='section controls'>
                        ${this.controls.checkbox ? `<div id='checkbox' class='button checkbox' ></div>` : ''}
                        ${this.controls.remove ? `<div id='remove' class='button remove' ></div>` : ''}
                        ${this.controls.save ? `<div id='save' class='button save' ></div>` : ''}
                        ${this.controls.cancel ? `<div id='cancel' class='button cancel' ></div>` : ''}
                    </div>
                </div>`;

            return this.footer ? tree : '';
        }

        _sectionA (title = '', name = 'template', active = false) {
            let tree =
                `<div class='section address section-${name}'>
                    <label class='title-section selectable drop-down-list'>${title}</label>
                    <div class='${name}-guid guid hidden'>
                        <input type='text' hidden name='${name}_guid' autocomplete='off' />
                        <label>GUID</label>
                    </div>
                    <div class='${name}-city city'>
                        <input type='text' required name='${name}_city' autocomplete='on' />
                        <label>Город</label>
                    </div>
                    <div class='${name}-street street'>
                        <input type='text' required name='${name}_street' autocomplete='on' />
                        <label>Улица</label>
                    </div>
                    <div class='${name}-house house'>
                        <input type='text' required name='${name}_house' autocomplete='on' />
                        <label>Дом</label>
                    </div>
                    <div class='${name}-lat coordinates latitude hidden'>
                        <input type='text' hidden name='${name}_lat' autocomplete='on' />
                        <label>Долгота</label>
                    </div>
                    <div class='${name}-lon coordinates longitude hidden'>
                        <input type='text' hidden name='${name}_lon' autocomplete='on' />
                        <label>Широта</label>
                    </div>
                </div>`;

            return active ? tree : '';
        }

        _sectionI (active = false) {
            let tree =
                `<div class='section info'>
                    <label class='title-section'>Описание трассы</label>
                    <div class='track-guid guid hidden'>
                        <input type='text' hidden name='track_guid' autocomplete='off' />
                        <label>GUID</label>
                    </div>
                    <div class='line-description' data-tip='Комментарий'>
                        <input type='text' required name='line_description' autocomplete='on' title='Комментарий' />
                        <label>Комментарий</label>
                    </div>
                    <div class='line-length' data-tip='Длина кабеля'>
                        <input type='text' required name='line_length' autocomplete='on' title='Длина кабеля' />
                        <label>Длина</label>
                    </div>
                    <div class='label-begin' data-tip='Начальная метка длины'>
                        <input type='text' required name='label_begin' autocomplete='on' title='Начальная метка длины' />
                        <label>Метка А</label>
                    </div>
                    <div class='label-end' data-tip='Конечная метка длины'>
                        <input type='text' required name='label_end' autocomplete='on' title='Конечная метка длины' />
                        <label>Метка Б</label>
                    </div>
                    <div class='cabel-cores selectable drop-down-list' data-tip='Жильность кабеля'>
                        <input type='text' required name='cabel_cores' autocomplete='on' title='Жильность кабеля' />
                        <label>Жильность</label>
                    </div>
                    <div class='cabel-type selectable drop-down-list' data-tip='Тип кабеля'>
                        <input type='text' required name='cabel_type' autocomplete='on' title='Тип кабеля' />
                        <label>Тип</label>
                    </div>
                </div>`;

            return active ? tree : '';
        }

        build () {
            let html = this._wrapper().trim();

            (() => {
                html = html.replace(/\s\s+/g, '');
                html.trim();
            })();

            let dom = document.createElement('template');
            dom.innerHTML = html;
            dom = dom.content.firstChild;
            dom.addEventListener('mouseover', function () { this.focus(); });

            this._view = this.format.dom ? dom : (this.format.html ? html : '');

            return this;
        }

        show (target) {
            document.querySelector(target).appendChild(this.view);
        }
    }

    return TrackView;
});
