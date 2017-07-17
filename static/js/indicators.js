var ARROW_SIZE = 28;
var POINT_RAD = 3;

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
    var container = $(event.target).parent();
    if (!container.parent().data("isActive"))
        return;
    // Sorry
    container.data("clearObject")(container.data("object"));
    container.remove();
});

/** Работа с точками */

function createPoint(x, y, pointData) {
    var point = $("<div />", {
        "class": "point indicator"
    });
    point.data("x-cord", x).data("y-cord", y);
    point.data("x-delta", -POINT_RAD).data("y-delta", POINT_RAD);
    point.data("pointData", pointData);
    return point;
}