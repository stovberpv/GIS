define([], function () {
    function trackAddModel () {
        let template = document.createElement('template');
        template.innerHTML =
            `<div class='add-route-frame popup-frame'>
                    <div class='add-route-wrapper wrapper'>
                        <div class='header'>Добавление трассы</div>
                        <div class='body'>
                            <div class='parent address'>
                                <input type='text' required placeholder='A: Город'   autocomplete='on' class='city'/>
                                <input type='text' required placeholder='A: Улица'   autocomplete='on' class='street'/>
                                <input type='text'          placeholder='A: Дом'     autocomplete='on' class='house'/>
                                <input type='text' disabled placeholder='A: Долгота' autocomplete='on' class='latitude'/>
                                <input type='text' disabled placeholder='A: Широта'  autocomplete='on' class='longitude'/>
                            </div>
                            <div class='child address'>
                                <input type='text' required placeholder='B: Город'   autocomplete='on' class='city'/>
                                <input type='text' required placeholder='B: Улица'   autocomplete='on' class='street'/>
                                <input type='text'          placeholder='B: Дом'     autocomplete='on' class='house'/>
                                <input type='text' disabled placeholder='B: Долгота' autocomplete='on' class='latitude'/>
                                <input type='text' disabled placeholder='B: Широта'  autocomplete='on' class='longitude'/>
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
    }

    function massUploadModel () {
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
    }

    return {
        trackAddModel: trackAddModel,
        massUploadModel: massUploadModel
    };
});
