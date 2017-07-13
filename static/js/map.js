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

    var ARROW_SIZE = 28;

    // Флаг для блокировки открытия информации об объекте при перетаскивании
    var _blockClick = false;
    // Timeout для предотвращения открытия информации об объекте при двойном клике
    var _clickDelay = 0;

    function renderMap(data, width, height) {
        _container.html("");
        _mapInfo = data;
        var mapBlock = document.createElement("div");
        mapBlock.className = "map-block";
        _container.get(0).appendChild(mapBlock);
        $(mapBlock).css("background-image", 'url(' + _mapInfo.mapSRC + ')');
        _container.data("isActive", false);
        MAX_X = width;
        MAX_Y = height;
        if (MAX_X / MAX_Y < _container.width() / _container.height()) {
            $(mapBlock).css("width", "100%");
            $(mapBlock).css("height", _container.width() * MAX_Y / MAX_X);
            MAGIC_RATIO = MAX_X / _container.width();
        } else {
            $(mapBlock).css("width", _container.height() * MAX_X / MAX_Y);
            $(mapBlock).css("height", "100%");
            MAGIC_RATIO = MAX_Y / _container.height();
        }
        _container.data("isActive", true);
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

        var infoX = objPx.x;
        var infoY = objPx.y - info.height() - info.data('arrowSize');

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

    function appendWithLocator(menuContainer) {
        var employeeLocate = document.createElement("div");
        employeeLocate.className = "pointer-button pointer-locate";
        menuContainer.appendChild(employeeLocate);
    }

    function appendWithPhotos(menuContainer) {
        var employeeLocate = document.createElement("div");
        employeeLocate.className = "pointer-button pointer-photos";
        menuContainer.appendChild(employeeLocate);
    }

    function appendWithInsideMap(menuContainer) {
        var employeeLocate = document.createElement("div");
        employeeLocate.className = "pointer-button pointer-inside-map";
        menuContainer.appendChild(employeeLocate);
    }

    /** Обработка клика по карте */

    function processClick(event) {
        if (!_container.data("isActive"))
            return;
        if (_blockClick)
            return;
        if (!_clickDelay) _clickDelay = setTimeout(function () {
            clearTimeout(_clickDelay);
            _clickDelay = 0;

            var cords = toCords(event.pageX - $(_container).offset().left,
                event.pageY - $(_container).offset().top);

            for (var i = 0; i < _mapInfo.objects.length; i++) {
                var v = _mapInfo.objects[i].vertices;
                var intersections = 0;
                if ((v[0].y - cords.y)*(v[v.length - 1].y - cords.y) < 0
                    && (v[0].y - v[v.length - 1].y !== 0
                    && v[0].x + (v[0].x - v[v.length - 1].x) * (v[0].y - cords.y) / (v[0].y - v[v.length - 1].y) > cords.x
                    || v[0].y - v[v.length - 1].y === 0 && v[0].x > cords.x))
                    intersections++;
                for (var j = 1; j < v.length; j++) {
                    if (cords.x < v[j].x && (v[j].y - cords.y) * (v[j - 1].y - cords.y) < 0
                        && (v[j].y - v[j - 1].y !== 0
                        && v[j].x + (v[j].x - v[j - 1].x) * (v[j].y - cords.y) / (v[j].y - v[j - 1].y) > cords.x
                        || v[j].y - v[j - 1].y === 0 && v[j].x > cords.x))
                        intersections++;
                }
                if (intersections % 2 === 1) {
                    locateBuilding(_mapInfo.objects[i]);
                    return;
                }
            }
        }, 200);
    }

    // Обработчики
    _container.click(processClick);

    /** Создание указателей на точку по запросу из навигационного меню */

    function getObjectById(objectId) {
        var object;
        for (var i = 0; i < _mapInfo.objects.length; i++) {
            if (_mapInfo.objects[i].objID === objectId) {
                object = _mapInfo.objects[i];
                break;
            }
        }
        if (object === undefined) {
            console.error('Wrong object ID');
        }
        return object;
    }

    function getAvgObjectCords(object) {
        var x = 0, y = 0, i;
        for (i = 0; i < object.vertices.length; i++) {
            x += object.vertices[i].x;
            y += object.vertices[i].y;
        }
        x /= object.vertices.length;
        y /= object.vertices.length;
        var ans = {};
        ans.x = x;
        ans.y = y;
        return ans;
    }

    function locateBuilding(object) {
        var avgCords = getAvgObjectCords(object);
        var pointer = createBasePointer(avgCords.x, avgCords.y, object.location);
        if (object.mapID !== null) {
            appendWithInsideMap(pointer);
            $(pointer).data("mapID", object.mapID);
            appendWithPhotos(pointer);
        }
        appendWithCross(pointer);
    }

    function locateEmployeeBuilding(location, staffInfo) {
        var object = getObjectById(location.buildingID);
        var cords = getAvgObjectCords(object);

        // Создание окна здания
        var pointer = createBasePointer(cords.x, cords.y, staffInfo.occupation + ' <b>'
            + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
            + staffInfo.phone_ext + '<br /> ' + staffInfo.location);
        $(pointer).data('mapID', location.mapID);
        appendWithLocator(pointer);
        appendWithCross(pointer);
        $(pointer).data('mapID', location.mapID);
        $(pointer).data('cabinetID', location.cabinetID);
        $(pointer).data('staffInfo', staffInfo);

        var px = toPx(cords.x, cords.y);
        var dx = px.x - _container.width() / 2;
        var dy = px.y - _container.height() / 2;
        if (_originX + dx < 0)
            dx = -_originX;
        if (_originY + dy < 0)
            dy = -_originY;
        var newCornerCords = toCords(_container.width() + dx, _container.height() + dy);
        if (newCornerCords.x > MAX_X)
            dx = toPx(MAX_X, MAX_Y).x - _container.width();
        if (newCornerCords.y > MAX_Y)
            dy = toPx(MAX_X, MAX_Y).y - _container.height();

        changePosition(dx, dy);
    }

    function locateEmployeeCabinet(cabinetID, staffInfo) {
        var object = getObjectById(cabinetID);
        var cords = getAvgObjectCords(object);

        var pointer = createBasePointer(cords.x, cords.y, staffInfo.occupation + ' <b>'
            + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
            + staffInfo.phone_ext + '<br /> ' + staffInfo.location);
        $(pointer).data('mapID', location.mapID);
        appendWithCross(pointer);
        $(pointer).data('mapID', location.mapID);
        $(pointer).data('cabinetID', location.cabinetID);
        $(pointer).data('staffInfo', staffInfo);
    }

    /** Масштабирование */

    // Изменяет масштаб в ratio раз
    function changeScale(clickX, clickY, ratio) {
        if (!_container.data("isActive"))
            return;
        clearTimeout(_clickDelay);
        _clickDelay = 0;
        _scale *= ratio;

        var blocks = _container.children('.map-block');
        for (var i = 0; i < blocks.length; i++) {
            var oldW = $(blocks[i]).width();
            var oldH = $(blocks[i]).height();
            $(blocks[i]).css("width", oldW * ratio + 'px');
            $(blocks[i]).css("height", oldH * ratio + 'px');
        }

        var clickCords = toCords(clickX, clickY, _scale / ratio);
        var newClickPx = toPx(clickCords.x, clickCords.y, _scale);
        var dx = newClickPx.x - clickX;
        var dy = newClickPx.y - clickY;
        if (_originX + dx < 0)
            dx = -_originX;
        if (_originY + dy < 0)
            dy = -_originY;

        var newCornerCords = toCords(_container.width() + dx, _container.height() + dy);
        if (newCornerCords.x > MAX_X)
            dx = toPx(MAX_X, MAX_Y).x - _container.width();
        if (newCornerCords.y > MAX_Y)
            dy = toPx(MAX_X, MAX_Y).y - _container.height();

        changePosition(dx, dy);
    }

    // Увеличение масштаба
    function increaseScale(event) {
        if (!_container.data("isActive"))
            return;
        if (_scale * 1.5 > 5)
            return;
        var x, y;
        if (event === undefined) {
            x = _container.width() / 2;
            y = _container.height() / 2;
        } else {
            x = event.pageX - _container.offset().left;
            y = event.pageY - _container.offset().top;
        }
        changeScale(x, y, 1.5);
    }

    // Уменьшение масштаба
    function decreaseScale(event) {
        if (!_container.data("isActive"))
            return;
        if (_scale / 1.5 < 1)
            return;
        var x, y;
        if (event === undefined) {
            x = _container.width() / 2;
            y = _container.height() / 2;
        } else {
            x = event.pageX - _container.offset().left;
            y = event.pageY - _container.offset().top;
        }
        changeScale(x, y, 1 / 1.5);
    }

    // Обработчики
    _container.dblclick(increaseScale);

    /** Перетаскивание */

    // Смещает положение карты на (dx, dy) в пикселях
    function changePosition(dx, dy) {
        if (!_container.data("isActive"))
            return;
        _originX += dx;
        _originY += dy;
        var blocks = _container.children('.map-block');
        for (var i = 0; i < blocks.length; i++) {
            var x = $(blocks[i]).css("left").split('px')[0];
            var y = $(blocks[i]).css("top").split('px')[0];
            $(blocks[i]).css("left", x - dx);
            $(blocks[i]).css("top", y - dy);
        }

        var pointMenus = _container.children('.pointer-container');
        for (i = 0; i < pointMenus.length; i++)
            setPointerPosition($(pointMenus[i]));
    }

    // Координаты мыши после предыдущего смещения
    var oldX;
    var oldY;

    // Функция для смещения карты при движении мыши
    function moveProcessing(event) {
        if (!_container.data("isActive"))
            return;
        _blockClick = true;
        clearTimeout(_clickDelay);
        _clickDelay = 0;

        var clickX = event.pageX;
        var clickY = event.pageY;
        var dx = oldX - clickX;
        var dy = oldY - clickY;

        var newOriginCords = toCords(dx, dy);
        var newCornerCords = toCords(_container.width() + dx, _container.height() + dy);
        if (newOriginCords.x < 0 || newCornerCords.x > MAX_X)
            dx = 0;
        if (newOriginCords.y < 0 || newCornerCords.y > MAX_Y)
            dy = 0;

        changePosition(dx, dy);

        oldX = clickX;
        oldY = clickY;
    }

    // Обработчик события нажатия кнопки
    _container.mousedown(function (event) {
        if (!_container.data("isActive"))
            return;
        oldX = event.pageX;
        oldY = event.pageY;
        // Включение обработки перемещения мыши
        _container.on('mousemove', moveProcessing);
    });


    // Функция для выключения обработки перемещения мыши
    function moveInterruption() {
        if (!_container.data("isActive"))
            return;
        setTimeout(function () {
            _blockClick = false
        }, 100);
        _container.off('mousemove');
    }

    // Обработчики событий
    _container.mouseup(moveInterruption);
    _container.dblclick(moveInterruption);
    _container.click(moveInterruption);


    return {
        activate: function() {
            _container.data("isActive", true);
        },
        deactivate: function() {
            _container.data("isActive", false);
        },
        increaseScale: increaseScale,
        decreaseScale: decreaseScale,
        locateEmployeeBuilding: locateEmployeeBuilding,
        locateEmployeeCabinet: locateEmployeeCabinet,
        renderMap: renderMap
    }
}