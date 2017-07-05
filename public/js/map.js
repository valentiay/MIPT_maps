"use strict";

function map(container) {
    /** Инициализация и обновление карты */
    // Ссылка на блок с картой
    var _container = container;
    // Загруженная информация по карте
    var _mapInfo;

    // Масшатаб - отношение ширины карты в пикселях к ширине контейнера
    var _scale = 1;
    // Удаление левого верхнего угла экрана от начала координат карты в пикселях
    var _originX = 0;
    var _originY = 0;
    // Размеры карты в координатах
    var MAX_X;
    var MAX_Y;

    var MAGIC_RATIO;

    var ARROW_SIZE = ($(document.body).width() > 800)?28:6;

    function correctMap() {
        var mapBlock = _container.children('.map-block');
        if (MAX_X / MAX_Y > _container.width() / _container.height()) {
            $(mapBlock).css("width", "100%");
            $(mapBlock).css("height", _container.width() * MAX_Y / MAX_X);
            _container.css("margin-left", "0");
            _container.css("margin-top", ($(document.body).height() - $(mapBlock).height()) / 2 + 'px');
            MAGIC_RATIO = MAX_X / _container.width();
        } else {
            $(mapBlock).css("width", _container.height() * MAX_X / MAX_Y);
            $(mapBlock).css("height", "100%");
            _container.css("margin-top", "0");
            _container.css("margin-left", ($(document.body).width() - $(mapBlock).width()) / 2 + 'px');
            MAGIC_RATIO = MAX_Y / _container.height();
        }

        var i;
        var points = $('.point');
        for (i = 0; i < points.length; i++) {
            setPointPosition($(points[i]));
        }

        var pointers = $('.pointer-container');
        for (i = 0; i < pointers.length; i++) {
            setPointerPosition($(pointers[i]));
        }
    }

    $(window).resize(correctMap);

    function renderMap(data, width, height, pointsData) {
        _container.html("");
        _mapInfo = data;
        var mapBlock = document.createElement("div");
        mapBlock.className = "map-block";
        _container.get(0).appendChild(mapBlock);
        $(mapBlock).css("background-image", 'url(' + _mapInfo.mapSRC + ')');
        _container.data("isActive", false);
        MAX_X = width;
        MAX_Y = height;
        correctMap();
        _container.data("isActive", true);
        for (var i = 0; i < pointsData.data.length; i++) {
            createPoint(pointsData.data[i]);
        }
    }

    _container.click(function(event) {
        console.log(toCords(event.pageX - _container.offset().left, event.pageY - _container.offset().top));
    });

    /** Функции для работы с точками */

    function createPoint(pointData) {
        var pointDiv = document.createElement("div");
        pointDiv.className = "point";
        $(pointDiv).data('x-cord', pointData.x);
        $(pointDiv).data('y-cord', pointData.y);
        $(pointDiv).data('title', pointData.title);
        $(_container).get(0).appendChild(pointDiv);
        setPointPosition($(pointDiv));

        $(pointDiv).click(function(event) {
            var point = $(event.target);
            var pointer = createBasePointer(point.data('x-cord'), point.data('y-cord'), point.data('title'));
            point.css("background-color", "#005892");
            appendWithCross(pointer);

            $(pointer).on('click', '.pointer-close', function () {
                point.css("background-color", "#9c0a09");
            });
        });

        // $(pointDiv).mouseenter(function(event) {
        //     var point = $(event.target);
        //     point.animate({width: "16px", height: "16px", borderRadius: "8px", top: "-=3px", left: "-=3px"}, 200);
        // });
        //
        // $(pointDiv).mouseleave(function(event) {
        //     var point = $(event.target);
        //     point.animate({width: "10px", height: "10px", borderRadius: "5px", top: "+=3px", left: "+=3px"}, 200);
        // });
    }

    function setPointPosition(point) {
        if (!_container.data("isActive"))
            return;
        var xCord = point.data('x-cord');
        var yCord = point.data('y-cord');
        var objPx = toPx(xCord, yCord);

        var pointX;
        var pointY;

        pointX = objPx.x - point.width() / 2;
        pointY = objPx.y - point.height() / 2;

        point.css("left", pointX + 'px');
        point.css("top", pointY + 'px');
    }

    /** Функции для работы с координатами */

    // Переводит удаление точки от левого верхнего угла экрана в координаты на карте
    function toCords(offsetX, offsetY, scale) {
        if (scale === undefined)
            scale = _scale;
        var ans = {};
        ans.x = (_originX + offsetX) / scale * MAGIC_RATIO;
        ans.y = (_originY + offsetY) / scale * MAGIC_RATIO;
        return ans;
    }

    // Переводит координаты точки на карте в удаление точки от левого верхнего угла экрана
    function toPx(cordX, cordY, scale) {
        if (scale === undefined)
            scale = _scale;
        var ans = {};
        ans.x = cordX * scale / MAGIC_RATIO - _originX;
        ans.y = cordY * scale / MAGIC_RATIO - _originY;
        return ans;
    }


    /** Функции для работы указателем на точку */

    // Задает указателю координаты
    function setPointerPosition(info) {
        if (!_container.data("isActive"))
            return;
        var xCord = info.data('x-cord');
        var yCord = info.data('y-cord');
        var objPx = toPx(xCord, yCord);

        var infoX;
        var infoY;

        infoX = objPx.x;
        infoY = objPx.y - info.height() - info.data('arrowSize');

        info.css("left", infoX + 'px');
        info.css("top", infoY + 'px');
    }

    // Закрывает указатель при нажатии на крестик
    _container.on('click', '.pointer-close', function (event) {
        event.stopPropagation();
        if (!_container.data("isActive"))
            return;
        $(event.target).parent().detach();
    });

    // Создает контейнер для указателя с описанием внутри
    function createBasePointer(x, y, description) {
        var menuContainer = document.createElement("div");
        menuContainer.className = "pointer-container ru";
        _container.get(0).appendChild(menuContainer);

        var menuInfo = document.createElement("div");
        menuInfo.className = "pointer-info";
        menuContainer.appendChild(menuInfo);

        $(menuContainer).data('x-cord', x).data('y-cord', y);
        $(menuContainer).data('arrowSize', ARROW_SIZE);
        $(menuInfo).html(description);
        $(menuInfo).css("min-width", $(menuInfo).width() + 'px');
        setPointerPosition($(menuContainer));
        return menuContainer;
    }

    function appendWithCross(menuContainer) {
        var menuClose = document.createElement("div");
        menuClose.className = "pointer-button pointer-close";
        menuContainer.appendChild(menuClose);
    }

    return {
        renderMap: renderMap
    }
}