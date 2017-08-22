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

function getStaffInfoText(staffInfo) {
    var result = "";
    if (staffInfo.occupation !== null) {
        result += staffInfo.occupation + '<br/>';
    }
    if (staffInfo.full_name !== null) {
        result += '<b>' + staffInfo.full_name + '</b><br />';
    }
    if (staffInfo.phone_ext !== null) {
        result += 'ТЕЛ:' + staffInfo.phone_ext + '<br />';
    }
    if (staffInfo.location !== null) {
        result += staffInfo.location;
    }
    return result;
}

// Найти здание с кабинетом сотрудника на главной карте
function locateEmployeeBuilding(location, staffInfo) {
    main.clear();
    var building = main.getObjectByID(location.buildingID);
    var cords = getAvgCords(building.vertices);

    var pointer;
    if (staffInfo !== undefined) {
        // Создание указателя на здание
        pointer = createBasePointer(cords.x, cords.y, getStaffInfoText(staffInfo));
        pointer.data('staffInfo', staffInfo);
    } else {
        if (location.cabinetID !== null) {
            pointer = createBasePointer(cords.x, cords.y, location.cabinet);
        } else {
            pointer = createBasePointer(cords.x, cords.y, building.title);
        }
    }

    pointer.data('mapID', location.mapID);
    pointer.data('object', building);
    if (location.cabinetID !== null) {
        pointer.data('cabinetID', location.cabinetID);
        appendWithLocator(pointer);
    } else {
        if (building.mapID !== null) {
            pointer.data("mapID", building.mapID);
            appendWithInsideMap(pointer)
        }
    }

    appendWithCross(pointer);
    main.fillObject(building);
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

    var cabinet = floorMap.getObjectByID(cabinetID);
    var cords = getAvgCords(cabinet.vertices);

    var pointer;
    if (staffInfo !== undefined) {
        pointer = createBasePointer(cords.x, cords.y, getStaffInfoText(staffInfo));
    } else {
        pointer = createBasePointer(cords.x, cords.y, cabinet.title);
    }

    pointer.data('mapID', location.mapID);
    pointer.data('object', cabinet);
    floorMap.fillObject(cabinet);
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
    if ($('#photos-container').css("display") !== "none") {
        $('#photos-container').fadeOut(200);
        photos = undefined;
        photoIndex = undefined;
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
                employeeContainer.children(".employee-loader-container").remove();
                employeeContainer.append();
                return;
            }
            if (staffInfo instanceof Array) {
                console.error("staffInfo is an array");
                employeeContainer.children(".employee-loader-container").remove();
                addError("Что-то пошло не так");
                return;
            }
            $.ajax('/getCabinetLocation', {
                type: "GET",
                data: {"cabinet": staffInfo.location[0]},
                dataType: "json",
                error: function() {
                    employeeContainer.children(".employee-loader-container").remove();
                    var se = employeeContainer.children(".search-employee");
                    se.children("h5").remove();
                    se.children("br").remove();
                    if (staffInfo.location !== null) {
                        se.append("<br /><h5>" + staffInfo.location + "</h5>");
                    }
                    if (staffInfo.phone_ext !== null) {
                        se.append("<h5>ТЕЛ:" + staffInfo.phone_ext + "</h5>");
                    }
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

$('#navigation-search-cabinet').click(function() {
    $.ajax('/getCabinetLocation', {
        type: "GET",
        data: {"cabinet": $("#search-input-text").val()},
        dataType: "json",
        error: function() {
            addError("Не удалось найти кабинет");
        },
        success: function(location) {
            navigation.hideNavigationMenu();
            locateEmployeeBuilding(location);
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
            var HORIZONTAL_SPACE = 160;
            var VERTICAL_SPACE = 30;
            var MAX_FLOOR_MAP_WIDTH = $(document.body).width() - HORIZONTAL_SPACE - 30;
            var MAX_FLOOR_MAP_HEIGHT = $(document.body).height() - VERTICAL_SPACE - 30;
            $(img).on("load", function() {
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
                        floorTitle.width(width * MAX_FLOOR_MAP_HEIGHT / height - 80);
                        floorMapContainer.height(MAX_FLOOR_MAP_HEIGHT - floorTitle.height());
                        floorMapContainer.width(floorMapContainer.height() * width / height);
                        floorMapContainer.css("left", 10 + (MAX_FLOOR_MAP_HEIGHT * width / height - floorMapContainer.width()) / 2);
                    } else {
                        floorTitle.width(width - 80);
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

                $('#floor-list').height(floorMapContainer.height());
                var refactor = $('#floor-map-container');
                refactor.width(floorMapContainer.width() + 2 * floorMapContainer.css("left").split("px")[0] - 20 + HORIZONTAL_SPACE);
                refactor.height(floorMapContainer.height() + floorTitle.height() + VERTICAL_SPACE);
                refactor
                    .css("margin-top", ($(document.body).height() - refactor.height()) / 2 + 'px')
                    .css("margin-left", ($(document.body).width() - refactor.width()) / 2 + 'px');
                floorMap.renderMap(data, width, height);
                floorMapContainer.trigger('floor-map-ready');
            });
            $(img).on("error", function() {
                floorMapContainer.trigger('floor-map-error');
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

    floorMapContainer.bind('floor-map-ready', function() {
        $(document.body).children(".floor-loader-container").remove();
        locateEmployeeCabinet(container.data('cabinetID'), container.data('staffInfo'));
        activateFloorMap();
        floorMapContainer.unbind('floor-map-ready');
        floorMapContainer.unbind('floor-map-error');
    });

    floorMapContainer.bind('floor-map-error', function() {
        $(document.body).children(".floor-loader-container").remove();
        main.activate();
        floorMapContainer.unbind('floor-map-ready');
        floorMapContainer.unbind('floor-map-error');
        addError("Не удалось загрузить карту");
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

    floorMapContainer.bind("floor-map-ready", function() {
        $(document.body).children(".floor-loader-container").remove();
        activateFloorMap();
        floorMapContainer.unbind('floor-map-ready');
        floorMapContainer.unbind('floor-map-error');
    });

    floorMapContainer.bind('floor-map-error', function() {
        $(document.body).children(".floor-loader-container").remove();
        main.activate();
        floorMapContainer.unbind('floor-map-ready');
        floorMapContainer.unbind('floor-map-error');
        addError("Не удалось загрузить карту");
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

/** Клик по карте **/

function bindObjectPointing(map) {
    function pointObject(object) {
        var avgCords = getAvgCords(object.vertices);
        var pointer = createBasePointer(avgCords.x, avgCords.y, object.title.toUpperCase());
        pointer.data("object", object);
        if (object.mapID !== null) {
            appendWithInsideMap(pointer);
            pointer.data("mapID", object.mapID);
        }
        if (object.photos.length > 0) {
            appendWithPhotos(pointer);
            pointer.data("photos", object.photos)
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

/** Фотографии **/

var photos;
var photoIndex;

function loadPhoto() {
    var photosContainer = $('#photos-container');
    if (photosContainer.css("display") !== "none") {
        photosContainer.hide();
    }
    photosContainer.children("img").remove();
    var img = new Image;
    img.src = photos[photoIndex];
    var MAX_PHOTO_WIDTH = $(document.body).width() - 80;
    var MAX_PHOTO_HEIGHT = $(document.body).height() - 80;

    $(img).on("load", function () {
        var width = img.width;
        var height = img.height;
        photosContainer.append(img);
        if (width / height < MAX_PHOTO_WIDTH / MAX_PHOTO_HEIGHT) {
            if (MAX_PHOTO_HEIGHT < height) {
                img.height = MAX_PHOTO_HEIGHT;
                img.width = MAX_PHOTO_HEIGHT * width / height;
            } else {
                img.height = height;
                img.width = width;
            }
         } else {
            if (MAX_PHOTO_WIDTH < width) {
                img.width = MAX_PHOTO_WIDTH;
                img.height = height * MAX_PHOTO_WIDTH / width;
            } else {
                img.width = width;
                img.height = height;
            }
        }
        var prev = $('#photos-prev');
        var next = $('#photos-next');

        if (photoIndex - 1 >= 0) {
            prev.show();
            prev.css("top", photosContainer.height() / 2 + 10 + "px");
        } else {
            prev.hide();
        }

        if (photoIndex + 1 < photos.length) {
            next.show();
            next.css("top", photosContainer.height() / 2 + 10 + "px");
        } else {
            next.hide();
        }

        photosContainer.css("left", ($(document.body).width() - photosContainer.width()) / 2 - 30 + "px");
        photosContainer.css("top", ($(document.body).height() - photosContainer.height()) / 2 - 30 + "px");
        photosContainer.fadeIn(200);
    });
    $(img).on("error", function() {
        photos = undefined;
        photoIndex = undefined;
        $('#photos-container').hide();
        main.activate();
        addError("Не удалось загрузить фотографию");
    });
}

$(document.body).on("click", ".pointer-photos", function(event) {
    main.deactivate();
    var pointer = $(event.target).parent();
    photos = pointer.data("object").photos;
    photoIndex = 0;
    loadPhoto();
});

$('#photos-cross').click(function() {
    photos = undefined;
    photoIndex = undefined;
    $('#photos-container').fadeOut(200);
    main.activate();
});

$('#photos-prev').click(function() {
    if (photoIndex - 1 >= 0) {
        photoIndex--;
        loadPhoto();
    }
});

$('#photos-next').click(function() {
    if (photoIndex + 1 < photos.length) {
        photoIndex++;
        loadPhoto();
    }
});