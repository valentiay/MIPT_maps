"use strict";

/** Главная карта */
var mainContainer = $('#map');
var main = map(mainContainer);

// Загрузка главной карты
$.ajax('/getMap', {
    type: "GET",
    data: {"mapID": 0},
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
            main.increaseScale()
        });
    }
});

$('#menu-button-increase-scale').click(main.increaseScale);
$('#menu-button-decrease-scale').click(main.decreaseScale);


/** Карта этажа */

var floorMapContainer = $('#floor-map');
var floorMap = map(floorMapContainer);
floorMap.deactivate();

// Отрисовывает список этажей
function renderFloorList(data) {
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
            var MAX_FLOOR_MAP_WIDTH = $(document.body).width() - 170;
            var MAX_FLOOR_MAP_HEIGHT = $(document.body).height() - 40;
            $(img).on("load", function () {
                renderFloorList(data);
                var width = img.width;
                var height = img.height;
                var floorTitle = $('#floor-title');
                var floorMapBlock = $('#floor-map-container');
                floorMapBlock.css("margin-top", 0);
                floorMapBlock.css("margin-left", 0);
                if (width / height < MAX_FLOOR_MAP_WIDTH / MAX_FLOOR_MAP_HEIGHT) {
                    floorTitle.css("width", MAX_FLOOR_MAP_HEIGHT / height * width - 80 + 'px');
                    floorTitle.css("width", (MAX_FLOOR_MAP_HEIGHT - floorTitle.height()) / height * width - 80 + 'px');
                    floorMapContainer.css("height", MAX_FLOOR_MAP_HEIGHT - floorTitle.height() + 'px');
                    floorMapContainer.css("width", (MAX_FLOOR_MAP_HEIGHT - floorTitle.height()) / height * width + 'px');
                } else {
                    floorTitle.css("width", MAX_FLOOR_MAP_WIDTH - 80 + 'px');
                    floorMapContainer.css("width", MAX_FLOOR_MAP_WIDTH + 'px');
                    floorMapContainer.css("height", MAX_FLOOR_MAP_WIDTH / width * height - floorTitle.height() + 'px');
                }
                floorMapBlock.css("margin-top", ($(document.body).height() - floorMapBlock.height()) / 2 + 'px');
                floorMapBlock.css("margin-left", ($(document.body).width() - floorMapBlock.width()) / 2 + 'px');
                floorMap.renderMap(data, width, height);
                $('#floor-map').trigger('floor-map-ready');
            });
        }
    });
}

// Загружает карту другого этажа
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

/** Навигация */

var navigation = navigation();

$('#menu-button-search').click(navigation.showNavigationMenu);
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