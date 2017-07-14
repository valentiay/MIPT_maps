var ARROW_SIZE = 28;

/** Работа с указателями */

// Создает контейнер для указателя с описанием внутри
function createBasePointer(x, y, description) {
    var pointerContainer = $("<div />", {
        "class": "pointer-container ru indicator"
    });
    pointerContainer.data('x-cord', x).data('y-cord', y);
    pointerContainer.data('x-delta', 0).data('y-delta', -ARROW_SIZE);

    var pointerInfo = $("<div />",{
        "class": "pointer-info"
    });
    pointerInfo.html(description);
    pointerInfo.css("min-width", pointerInfo.width() + 'px');

    pointerContainer.append(pointerInfo);

    return pointerContainer;
}

// Добавляет к указателю крестик
function appendWithCross(pointerContainer) {
    $("<div />", {
        "class": "pointer-button pointer-close"
    }).appendTo(pointerContainer);
}

// Добавляет к указателю кнопку для поиска кабинета
function appendWithLocator(pointerContainer) {
    $("<div />", {
        "class": "pointer-button pointer-locate"
    }).appendTo(pointerContainer);
}

// Добавляет к указателю кнопку для загрузки фотографий
function appendWithPhotos(pointerContainer) {
    $("<div />", {
        "class": "pointer-button pointer-photos"
    }).appendTo(pointerContainer);
}

// Добавляет к указателю кнопку для открытия внутренней карты
function appendWithInsideMap(pointerContainer) {
    $("<div />", {
        "class": "pointer-button pointer-inside-map"
    }).appendTo(pointerContainer);
}


// Закрывает указатель при нажатии на крестик
$(document.body).on('click', '.pointer-close', function (event) {
    event.stopPropagation();
    if (!$(event.target).parent().parent().data("isActive"))
        return;
    $(event.target).parent().remove();
});

/** Создание указателей на точку по запросу из навигационного меню */

// Найти здание с кабинетом сотрудника на главной карте
function locateEmployeeBuilding(location, staffInfo) {
    var cords = main.getObjectCordsByID(location.buildingID);

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
    var cords = floorMap.getObjectCordsByID(cabinetID);

    var pointer = createBasePointer(cords.x, cords.y, staffInfo.occupation + '</br><b>'
        + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
        + staffInfo.phone_ext + '<br /> ' + staffInfo.location);
    $(pointer).data('mapID', location.mapID);
    appendWithCross(pointer);
    floorMap.addIndicator(pointer);
}