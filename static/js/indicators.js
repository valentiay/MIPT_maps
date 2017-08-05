var ARROW_SIZE = 28;
var POINT_RAD = 2;

/** Работа с указателями */

// Создает контейнер для указателя с описанием внутри
function createBasePointer(x, y, description) {
    var pointerContainer = $("<div />", {
        "class": "pointer-container indicator"
    });
    pointerContainer.data('x-cord', x).data('y-cord', y);

    var pointerInfo = $("<div />", {
        "class": "pointer-info"
    });
    pointerInfo.html(description);

    pointerContainer.append(pointerInfo);

    pointerContainer.addClass("ru");
    pointerContainer.data("x-delta", 0).data("y-delta", 0);

    pointerContainer.data("onMove", function() {
        var parentMap = pointerContainer.parent();
        var offset = pointerContainer.offset();
        var parentOffset = pointerContainer.parent().offset();
        var x = offset.left - pointerContainer.data("x-delta") - parentOffset.left;
        var y = offset.top - pointerContainer.data("y-delta") - pointerContainer.height() - parentOffset.top;
        var r = true;
        var u = true;
        if (x + pointerContainer.width() > parentMap.width() && x - pointerContainer.width() >= 0) {
            r = false;
        }
        if (y < 0 && y + 2 * (pointerContainer.height() + ARROW_SIZE) <= parentMap.height()) {
            u = false;
        }

        function clearClasses() {
            pointerContainer.removeClass("ru");
            pointerContainer.removeClass("rd");
            pointerContainer.removeClass("lu");
            pointerContainer.removeClass("ld");
        }

        function flipLeft() {
            if (pointerContainer.hasClass("ru") || pointerContainer.hasClass("rd")) {
                var buttons = [];
                var curr;
                while ((curr = pointerContainer.children(":last")).hasClass("pointer-button")) {
                    buttons.push(curr.detach());
                }
                pointerContainer.children(".pointer-info").css("margin-right", "0px");
                pointerContainer.children(".pointer-info").css("margin-left", "1px");
                while (buttons.length > 0) {
                    pointerContainer.prepend(buttons.pop());
                }
            }
        }

        function flipRight() {
            if (pointerContainer.hasClass("lu") || pointerContainer.hasClass("ld")) {
                var buttons = [];
                var curr;
                while ((curr = pointerContainer.children(":first")).hasClass("pointer-button")) {
                    buttons.push(curr.detach());
                }
                pointerContainer.children(".pointer-info").css("margin-left", "0px");
                pointerContainer.children(".pointer-info").css("margin-right", "1px");
                while (buttons.length > 0) {
                    pointerContainer.append(buttons.pop());
                }
            }
        }

        if (r && u) {
            flipRight();
            clearClasses();
            pointerContainer.addClass("ru");
            pointerContainer
                .data('x-delta', 0)
                .data('y-delta', -ARROW_SIZE);
        } else if (u) {
            flipLeft();
            clearClasses();
            pointerContainer.addClass("lu");
            pointerContainer
                .data('x-delta', -pointerContainer.width())
                .data('y-delta', -ARROW_SIZE);
        } else if (r) {
            flipRight();
            clearClasses();
            pointerContainer.addClass("rd");
            pointerContainer
                .data('x-delta', 0)
                .data('y-delta', pointerContainer.height() + ARROW_SIZE);
        } else {
            flipLeft();
            clearClasses();
            pointerContainer.addClass("ld");
            pointerContainer
                .data('x-delta', -pointerContainer.width())
                .data('y-delta', pointerContainer.height() + ARROW_SIZE);
        }
    });

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