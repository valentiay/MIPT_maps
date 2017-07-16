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

    // Флаг для блокировки открытия информации об объекте при перетаскивании
    var _blockClick = false;
    // Timeout для предотвращения открытия информации об объекте при двойном клике
    var _clickDelay = 0;

    var _context;
    var _mapBlock;

    function renderMap(data, width, height) {
        _container.html("");
        _mapInfo = data;
        _mapBlock = $("<canvas />", {
            "class": "map-block"
        });
        _mapBlock.attr("width", width);
        _mapBlock.attr("height", height);
        _context = _mapBlock.get(0).getContext("2d");
        _container.append(_mapBlock);
        _mapBlock.css("background-image", 'url(' + _mapInfo.mapSRC + ')');
        _container.data("isActive", false);
        MAX_X = width;
        MAX_Y = height;
        if (MAX_X / MAX_Y < _container.width() / _container.height()) {
            _mapBlock.css("width", "100%");
            _mapBlock.css("height", _container.width() * MAX_Y / MAX_X);
            MAGIC_RATIO = MAX_X / _container.width();
        } else {
            _mapBlock.css("width", _container.height() * MAX_X / MAX_Y);
            _mapBlock.css("height", "100%");
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

    // Задает координаты обозначению на карте
    function setIndicatorPosition(indicator) {
        if (!_container.data("isActive"))
            return;

        var xCord = indicator.data('x-cord');
        var yCord = indicator.data('y-cord');
        var xDelta = indicator.data('x-delta');
        var yDelta = indicator.data('y-delta');
        var objPx = toPx(xCord, yCord);

        var infoX = objPx.x + xDelta;
        var infoY = objPx.y + yDelta - indicator.height();

        indicator.css("left", infoX + 'px');
        indicator.css("top", infoY + 'px');
    }

    /** Масштабирование */

    // Изменяет масштаб в ratio раз
    function changeScale(clickX, clickY, ratio) {
        if (!_container.data("isActive"))
            return;
        clearTimeout(_clickDelay);
        _clickDelay = 0;
        _scale *= ratio;

        var block = _container.children('.map-block');
        var oldW = block.width();
        var oldH = block.height();
        block.css("width", oldW * ratio + 'px');
        block.css("height", oldH * ratio + 'px');

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
        if (_scale * 1.5 > 3)
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
        var block = _container.children('.map-block');
        var x = block.css("left").split('px')[0];
        var y = block.css("top").split('px')[0];
        block.css("left", x - dx);
        block.css("top", y - dy);

        var indicators = _container.children('.indicator');
        for (var i = 0; i < indicators.length; i++)
            setIndicatorPosition($(indicators[i]));
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
    $(document.body).mouseup(moveInterruption);
    _container.dblclick(moveInterruption);
    _container.click(moveInterruption);

    /** Работа с холстом */

    function clear() {
        _container.children(":not(.map-block)").remove();
        _context.clearRect(0, 0, MAX_X, MAX_Y);
    }

    function fillObject(object) {
        var vertices = object.vertices;
        _context.beginPath();
        _context.moveTo(vertices[vertices.length - 1].x, vertices[vertices.length - 1].y);
        for (var i = 0; i < vertices.length; i++) {
            _context.lineTo(vertices[i].x, vertices[i].y);
        }
        _context.fillStyle = "rgba(255, 0, 0, 0.5)";
        _context.fill();
    }

    function clearObject(object) {
        var vertices = object.vertices;
        var minX = MAX_X;
        var maxX = 0;
        var minY = MAX_Y;
        var maxY = 0;
        for (var i = 0; i < vertices.length; i++) {
            if (minX > vertices[i].x)
                minX = vertices[i].x;
            if (maxX < vertices[i].x)
                maxX = vertices[i].x;
            if (minY > vertices[i].y)
                minY = vertices[i].y;
            if (maxY < vertices[i].y)
                maxY = vertices[i].y;
        }
        _context.clearRect(minX, minY, maxX - minX, maxY - minY);
    }

    /** Обработка клика по карте */

    function addIndicator(indicator) {
        indicator.data("clearObject", clearObject);
        _container.append(indicator);
        setIndicatorPosition(indicator);
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

    function pointBuilding(object) {
        var avgCords = getAvgObjectCords(object);
        var pointer = createBasePointer(avgCords.x, avgCords.y, object.location);
        pointer.data("object", object);
        if (object.mapID !== null) {
            appendWithInsideMap(pointer);
            pointer.data("mapID", object.mapID);
            appendWithPhotos(pointer);
        }
        appendWithCross(pointer);
        addIndicator(pointer);
    }

    function countIntersections(vers, dot) {
        var intersections = 0;
        if ((vers[0].y - dot.y)*(vers[vers.length - 1].y - dot.y) < 0
            && (vers[0].y - vers[vers.length - 1].y !== 0
            && vers[0].x + (vers[0].x - vers[vers.length - 1].x) * (vers[0].y - dot.y) / (vers[0].y - vers[vers.length - 1].y) > dot.x
            || vers[0].y - vers[vers.length - 1].y === 0 && vers[0].x > dot.x))
            intersections++;
        for (var j = 1; j < vers.length; j++) {
            if (dot.x < vers[j].x && (vers[j].y - dot.y) * (vers[j - 1].y - dot.y) < 0
                && (vers[j].y - vers[j - 1].y !== 0
                && vers[j].x + (vers[j].x - vers[j - 1].x) * (vers[j].y - dot.y) / (vers[j].y - vers[j - 1].y) > dot.x
                || vers[j].y - vers[j - 1].y === 0 && vers[j].x > dot.x))
                intersections++;
        }
        return intersections;
    }

    function processClick(event) {
        if (!_container.data("isActive"))
            return;
        if (_blockClick)
            return;
        if (!_clickDelay) _clickDelay = setTimeout(function () {
            clearTimeout(_clickDelay);
            _clickDelay = 0;

            clear();
            var cords = toCords(event.pageX - _container.offset().left,
                event.pageY - _container.offset().top);
            console.log(cords);

            for (var i = 0; i < _mapInfo.objects.length; i++) {
                var vertices = _mapInfo.objects[i].vertices;
                var intersections = countIntersections(vertices, cords);
                if (intersections % 2 === 1) {
                    pointBuilding(_mapInfo.objects[i]);
                    fillObject(_mapInfo.objects[i]);
                    return;
                }
            }
        }, 200);
    }
    _container.on("click", ".map-block", processClick);

    function getObjectByID(objectId) {
        var object;
        // TODO
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

    return {
        activate: function() {
            _container.data("isActive", true);
        },
        deactivate: function() {
            _container.data("isActive", false);
        },
        increaseScale: increaseScale,
        decreaseScale: decreaseScale,
        changePosition: changePosition,
        renderMap: renderMap,
        addIndicator: addIndicator,
        getObjectByID: getObjectByID,
        getAvgObjectCords: getAvgObjectCords,
        toPx: toPx,
        toCords: toCords,
        getMaxCords: function() {
            var ans = {};
            ans.x = MAX_X;
            ans.y = MAX_Y;
            return ans;
        },
        getOrigin: function() {
            var ans = {};
            ans.x = _originX;
            ans.y = _originY;
            return ans;
        },
        getObjectsList: function() {
            return _mapInfo.objects
        },
        clearObject: clearObject,
        fillObject: fillObject,
        clear: clear
    }
}