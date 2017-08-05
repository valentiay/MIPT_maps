"use strict";

/** Главная карта */
var mainContainer = $('#map');
var main = map(mainContainer);

// Загрузка главной карты
$.ajax('/getMap', {
    type: "GET",
    data: {"mapID": 1},
    dataType: "json",
    error: function() {
        addError("Не удалось загрузить карту, перезагрузите страницу через некоторое время")
    },
    success: function(data) {
        var img = new Image;
        img.src = data.mapSRC;
        $(img).on("load", function () {
            var width = img.width;
            var height = img.height;
            main.renderMap(data, width, height);
        });
    }
});

$('#menu-button-increase-scale').click(main.increaseScale);
$('#menu-button-decrease-scale').click(main.decreaseScale);
mainContainer.dblclick(main.increaseScale);

/** Создание указателей на точку по запросу из навигационного меню */

// Найти здание с кабинетом сотрудника на главной карте
function locateEmployeeBuilding(location, staffInfo) {
    main.clear();
    var object = main.getObjectByID(location.buildingID);
    var cords = getAvgCords(object.vertices);

    // Создание окна здания
    var pointer = createBasePointer(cords.x, cords.y,
        staffInfo.occupation + '<br/><b>'
        + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
        + staffInfo.phone_ext + '<br />' + staffInfo.location);
    pointer.data('mapID', location.mapID);
    appendWithLocator(pointer);
    appendWithCross(pointer);
    pointer.data('mapID', location.mapID);
    pointer.data('cabinetID', location.cabinetID);
    pointer.data('staffInfo', staffInfo);
    pointer.data('object', object);
    main.fillObject(object);
    main.addIndicator(pointer);


    var px = main.toPx(cords.x, cords.y);
    var dx = px.x - mainContainer.width() / 2;
    var dy = px.y - mainContainer.height() / 2;

    var origin = main.getOrigin();
    if (origin.x + dx < 0)
        dx = -origin.x;
    if (origin.y + dy < 0)
        dy = -origin.y;

    var maxCords = main.getMaxCords();
    var newCornerCords = main.toCords(mainContainer.width() + dx, mainContainer.height() + dy);
    if (newCornerCords.x > maxCords.x)
        dx = main.toPx(maxCords.x, maxCords.y).x - mainContainer.width();
    if (newCornerCords.y > maxCords.y)
        dy = main.toPx(maxCords.x, maxCords.y).y - mainContainer.height();
    main.changePosition(dx, dy);
}

// Найти кабинет сотрудника на карте этажа
function locateEmployeeCabinet(cabinetID, staffInfo) {
    floorMap.clear();

    var object = floorMap.getObjectByID(cabinetID);
    var cords = getAvgCords(object.vertices);

    var pointer = createBasePointer(cords.x, cords.y, staffInfo.occupation + '</br><b>'
        + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
        + staffInfo.phone_ext + '<br />');
    pointer.data('mapID', location.mapID);
    pointer.data('object', object);
    floorMap.fillObject(object);
    appendWithCross(pointer);
    floorMap.addIndicator(pointer);
}

/** Навигация */

var navigation = navigation();

$('#menu-button-search').click(function() {
    if ($('#floor-map-container').css("visibility") !== "hidden") {
        floorMap.deactivate();
        $('#floor-map-container').fadeOut(200, function () {
            $(this).css("visibility", "hidden").show();
        });
        main.activate();
    }
    navigation.showNavigationMenu();
});

$('#search-container').on('click', '.search-employee-locate', function (event) {
    var employeeID = $(event.target).data("id");
    var employeeContainer = $(event.target.parentNode);
    $.ajax('/phonebook', {
        type: "GET",
        data: {"rid" : employeeID},
        dataType: "json",
        beforeSend: function() {
            $("<div />", {
                "class": "employee-loader loader"
            }).appendTo($("<div />", {
                "class": "employee-loader-container"
            }).appendTo(employeeContainer));
        },
        error: function() {
            employeeContainer.children(".employee-loader-container").remove();
            addError("Не удалось загрузить информацию о сотруднике")
        },
        success: function(staffInfo) {
            if (staffInfo.location === null) {
                addError("Кабинет сотрудника не указан");
            }
            if (staffInfo instanceof Array) {
                addError("Информация о сотруднике не указана");
            }
            $.ajax('/getCabinetLocation', {
                type: "GET",
                data: {"cabinet": staffInfo.location[0]},
                dataType: "json",
                error: function() {
                    employeeContainer.children(".employee-loader-container").remove();
                    addError("Не удалось найти кабинет");
                },
                success: function(location) {
                    employeeContainer.children(".employee-loader-container").remove();
                    navigation.hideNavigationMenu();
                    locateEmployeeBuilding(location, staffInfo);
                }
            });
        }
    });
});

/** Карта этажа */

var floorMapContainer = $('#floor-map');
var floorMap = map(floorMapContainer);
floorMap.deactivate();

// Загружает карту этажа и изменяет размер контейнера карты
function loadFloorMap(id) {
    $.ajax('/getMap', {
        type: "GET",
        data: {"mapID": id},
        dataType: "json",
        error: function() {
            addError("Не удалось загрузить карту, перезагрузите страницу через некоторое время")
        },
        success: function(data) {
            var img = new Image;
            img.src = data.mapSRC;
            var MAX_FLOOR_MAP_WIDTH = $(document.body).width() - 190;
            var MAX_FLOOR_MAP_HEIGHT = $(document.body).height() - 40;
            $(img).on("load", function () {
                // Отрисовывает информацию об этаже
                function renderFloorInfo(data) {
                    var floorList = $('#floor-list');
                    floorList.html("");
                    for (var i = 0; i < data.allFloors.length; i++) {
                        var floorLink = $("<p />", {
                            "class": (data.allFloors[i].mapID === data.mapID)?"floor-active-p":"",
                            "text": "Этаж " + data.allFloors[i].floor
                        });
                        floorLink.data('mapID', data.allFloors[i].mapID);
                        floorList.append(floorLink);
                        $('#floor-title').text(data.title);
                    }
                }
                renderFloorInfo(data);

                var width = img.width;
                var height = img.height;
                var floorTitle = $('#floor-title');
                var floorMapContainer = $('#floor-map');
                if (width / height < MAX_FLOOR_MAP_WIDTH / MAX_FLOOR_MAP_HEIGHT) {
                    if (MAX_FLOOR_MAP_HEIGHT < height) {
                        floorTitle.width(width * MAX_FLOOR_MAP_WIDTH / height - 80);
                        floorMapContainer.height(MAX_FLOOR_MAP_HEIGHT - floorTitle.height());
                        floorMapContainer.width(floorMapContainer.height() * width / height);
                        floorMapContainer.css("left", 10 + (MAX_FLOOR_MAP_HEIGHT * width / height - floorMapContainer.width()) / 2);
                    } else {
                        floorTitle.width(width);
                        floorMapContainer.height(height - floorTitle.height());
                        floorMapContainer.width(floorMapContainer.height() * width / height);
                        floorMapContainer.css("left", 10 + (width - floorMapContainer.width()) / 2);
                    }
                 } else {
                    if (MAX_FLOOR_MAP_WIDTH < width) {
                        floorTitle.width(MAX_FLOOR_MAP_WIDTH - 80);
                        floorMapContainer.width(MAX_FLOOR_MAP_WIDTH);
                        floorMapContainer.height(height * MAX_FLOOR_MAP_WIDTH / width);
                        floorMapContainer.css("left", 10);
                    } else {
                        floorTitle.width(width - 80);
                        floorMapContainer.width(width);
                        floorMapContainer.height(height);
                        floorMapContainer.css("left", 10);
                    }
                }

                var refactor = $('#floor-map-container');
                refactor
                    .css("margin-top", ($(document.body).height() - refactor.height()) / 2 + 'px')
                    .css("margin-left", ($(document.body).width() - refactor.width()) / 2 + 'px');
                floorMap.renderMap(data, width, height);
                floorMapContainer.trigger('floor-map-ready');
            });
        }
    });
}

// Переключение этажей
$('#floor-list').on('click', 'p', function(event) {
    event.stopPropagation();
    if (event.target.className === "floor-active-p")
        return;
    loadFloorMap($(event.target).data('mapID'));
});

// Показывает контейнер с картой этажа
function activateFloorMap() {
    main.deactivate();
    $('#floor-map-container').hide().css("visibility", "visible").fadeIn(200);
    floorMap.activate();
}

// Показывает положение сотрудника на карте этажа
mainContainer.on('click', '.pointer-locate', function(event) {
    event.stopPropagation();
    var container = $(event.target).parent();

    $("<div />", {
        "class": "floor-loader loader"
    }).appendTo($("<div />", {
        "class": "floor-loader-container"
    }).appendTo($(document.body)));

    loadFloorMap(container.data('mapID'));

    $('#floor-map').bind('floor-map-ready', function() {
        $(document.body).children(".floor-loader-container").remove();
        locateEmployeeCabinet(container.data('cabinetID'), container.data('staffInfo'));
        activateFloorMap();
        $('#floor-map').unbind('floor-map-ready');
    });
});

// Открывает внутреннюю карту здания
mainContainer.on('click', '.pointer-inside-map', function(event){
    event.stopPropagation();
    var container = $(event.target).parent();

    $("<div />", {
        "class": "floor-loader loader"
    }).appendTo($("<div />", {
        "class": "floor-loader-container"
    }).appendTo($(document.body)));

    loadFloorMap(container.data('mapID'));

    $('#floor-map').bind("floor-map-ready", function() {
        $(document.body).children(".floor-loader-container").remove();
        activateFloorMap();
        $('#floor-map').unbind('floor-map-ready');
    });
});

// Закрывает карту этажа
$('#floor-close').click(function() {
    floorMap.deactivate();
    $('#floor-map-container').fadeOut(200, function(){
        $(this).css("visibility", "hidden").show();
    });
    main.activate();
});


function bindObjectPointing(map) {
    function pointObject(object) {
        var avgCords = getAvgCords(object.vertices);
        var pointer = createBasePointer(avgCords.x, avgCords.y, object.title.toUpperCase());
        pointer.data("object", object);
        if (object.mapID !== null) {
            appendWithInsideMap(pointer);
            pointer.data("mapID", object.mapID);
            appendWithPhotos(pointer);
        }
        appendWithCross(pointer);
        map.addIndicator(pointer);
    }

    var container = map.getContainer();
    container.on("mapClick", function(event, cords) {
        map.clear();

        var objects = map.getObjectsList();
        var object;
        for (var key in objects) {
            if (objects.hasOwnProperty(key)) {
                object = objects[key];
                var vertices = object.vertices;
                if (polygonContainsDot(vertices, cords)) {
                    pointObject(object);
                    map.fillObject(object);
                    return;
                }
            }
        }
    });
}

bindObjectPointing(main);
bindObjectPointing(floorMap);