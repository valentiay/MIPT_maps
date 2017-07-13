var ARROW_SIZE = 28;

// Создает контейнер для указателя с описанием внутри
function createBasePointer(x, y, description) {
    var menuContainer = document.createElement("div");
    menuContainer.className = "pointer-container ru indicator";

    var menuInfo = document.createElement("div");
    menuInfo.className = "pointer-info";
    menuContainer.appendChild(menuInfo);

    $(menuContainer).data('x-cord', x).data('y-cord', y);
    $(menuContainer).data('x-delta', 0).data('y-delta', -ARROW_SIZE);
    // $(menuContainer).data('arrowSize', ARROW_SIZE);
    $(menuInfo).html(description);
    $(menuInfo).css("min-width", $(menuInfo).width() + 'px');
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

// Закрывает указатель при нажатии на крестик
$(document.body).on('click', '.pointer-close', function (event) {
    event.stopPropagation();
    if (!$(event.target).parent().parent().data("isActive"))
        return;
    $(event.target).parent().detach();
});

/** Создание указателей на точку по запросу из навигационного меню */

function locateEmployeeBuilding(location, staffInfo) {
    var cords = main.getObjectCordsByID(location.buildingID);

    // Создание окна здания
    var pointer = createBasePointer(cords.x, cords.y,
        staffInfo.occupation + '<br/><b>'
        + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
        + staffInfo.phone_ext + '<br /> ' + staffInfo.location);
    $(pointer).data('mapID', location.mapID);
    appendWithLocator(pointer);
    appendWithCross(pointer);
    $(pointer).data('mapID', location.mapID);
    $(pointer).data('cabinetID', location.cabinetID);
    $(pointer).data('staffInfo', staffInfo);
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
    console.log(main.getMaxCords());
    var newCornerCords = main.toCords(mainContainer.width() + dx, mainContainer.height() + dy);
    if (newCornerCords.x > maxCords.x)
        dx = main.toPx(maxCords.x, maxCords.y).x - mainContainer.width();
    if (newCornerCords.y > maxCords.y)
        dy = main.toPx(maxCords.x, maxCords.y).y - mainContainer.height();
    main.changePosition(dx, dy);
}

function locateEmployeeCabinet(cabinetID, staffInfo) {
    var cords = floorMap.getObjectCordsByID(cabinetID); //.getObjectCordsById(cabinetID);

    var pointer = createBasePointer(cords.x, cords.y, staffInfo.occupation + '</br><b>'
        + staffInfo.full_name + '</b><br />' + 'ТЕЛ:'
        + staffInfo.phone_ext + '<br /> ' + staffInfo.location);
    $(pointer).data('mapID', location.mapID);
    appendWithCross(pointer);
    floorMap.addIndicator(pointer);
}