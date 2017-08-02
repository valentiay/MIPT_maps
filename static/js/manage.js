var manageMapContainer = $('#manage-map');
var manageMap = map(manageMapContainer);

function highlightObject (object) {
    manageMap.clear();
    manageMap.fillObject(object);
    for (var i = 0; i < object.vertices.length; i++) {
        var point = createPoint(object.vertices[i].x, object.vertices[i].y, 1);
        point.data("vertex", object.vertices[i]);
        manageMap.addIndicator(point);
    }
}

function fillAllObjects() {
    manageMap.clear();
    var objects = manageMap.getObjectsList();
    for (var key in objects) {
        if (objects.hasOwnProperty(key)) {
            manageMap.fillObject(objects[key]);
        }
    }
}

function listFloors(floors) {
    var floorsList = $('#floors-list');
    if(floors.length !== 0) {
        floorsList.append("<h2>Другие этажи</h2><ul>");
        for (var i = 0; i < floors.length; i++) {
            floorsList.append('<li><a href = "/manage/' + floors[i].mapID + '"> Этаж ' + floors[i].floor + '</a></li>');
        }
        floorsList.append("</ul>");
    }
}

function listObjects(objects) {
    var objectsList = $('#objects-list');

    function appendToList(object) {
        var objectContainer = $("<li />", {
            "text": object.title
        });

        if (object.mapID !== null && object.mapID !== undefined) {
            objectContainer.append(" (");
            objectContainer.append($("<a />", {
                "href": "/manage/" + object.mapID,
                "text": "Править"
            }));
            objectContainer.append(")");
        }
        objectContainer.data("object", object);
        objectsList.append(objectContainer);
    }

    objectsList.html("");
    objectsList.append("<h2>Объекты</h2><ul>");
    if (objects.length !== undefined) {
        for (var i = 0; i < objects.length; i++) {
            appendToList(objects[i]);
        }
    } else {
        for (var key in objects) {
            if (objects.hasOwnProperty(key)) {
                appendToList(objects[key]);
            }
        }
    }
    objectsList.append("</ul>");
}

$.ajax('/getMap', {
    type: "GET",
    data: {"mapID": MAP_ID},
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
            manageMap.renderMap(data, width, height);
            $('#controls').prepend("<h1>" + data.title + "</h1>");
            fillAllObjects();
            listFloors(data.allFloors);
            listObjects(data.objects);
        });
    }
});

$('#menu-button-increase-scale').click(manageMap.increaseScale);
$('#menu-button-decrease-scale').click(manageMap.decreaseScale);


/** **/

function saveObject(object) {
    $.ajax("/addObject", {
        method: "POST",
        data: {
            "mapID": MAP_ID,
            "csrfmiddlewaretoken": $('input[name="csrfmiddlewaretoken"]').val(),
            "object": JSON.stringify(object)
        },
        dataType: "json",
        error: function() {
            addError("Сервер ответил ошибкой");
            fillAllObjects();
        },
        success: function(addedObject) {
            addError("Объект успешно добавлен");
            addedObject = JSON.parse(addedObject);
            manageMap.addObject(addedObject);
            listObjects(manageMap.getObjectsList());
            fillAllObjects();
        }
    });
}

var objectEditInProcess = false;
var editedObject;
var editedObjectBackup;

function editObject(object) {
    $('#buttons').hide();
    manageMap.clear();
    objectEditInProcess = true;
    editedObjectBackup = JSON.parse(JSON.stringify(object));

    if (object.id !== undefined) {
        manageMap.clearObject(object);
    }
    editedObject = object;

    $('#edit-menu').show();
    $('#edit-title').val(editedObject.title);
    highlightObject(editedObject);
}

$('#add').click(function() {
    if (!objectEditInProcess) {
        editObject({
            title: "",
            vertices: []
        });
    }
});

$('#objects-list').on("click", "li", function(event) {
    if (!objectEditInProcess) {
     editObject($(event.target).data("object"));
    }
});

$('#edit-location').change(function() {
    if (!objectEditInProcess)
        return;
    editedObject.title = $('#edit-location').val();
});

$('#edit-cancel').click(function() {
    if (!objectEditInProcess)
        return;
    $('#edit-menu').hide();
    $('#buttons').show();
    objectEditInProcess = false;

    if (editedObjectBackup.id !== undefined) {
        manageMap.addObject(editedObjectBackup);
    }
    editedObject = undefined;
    editedObjectBackup = undefined;

    manageMap.clear();
    fillAllObjects();
});

// manageMapContainer.on("mapClick", function(event, cords) {
//     if (!objectEditInProcess)
//         return;
//
//     var vertex = {
//         x: cords.x,
//         y: cords.y,
//         order: vertexOrder++,
//         mapID: MAP_ID
//     };
//
//     addError("Вершина добавлена");
//
//     editedObject.vertices.push(vertex);
//     manageMap.clearObject(editedObject);
//     manageMap.fillObject(editedObject);
//     highlightObject(editedObject);
// });

$('#add-save').click(function() {
    if (!objectEditInProcess)
        return;

    $('#edit-menu').hide();
    $('#buttons').show();
    objectEditInProcess = false;

    saveObject(editedObject);
    editedObject = undefined;
    editedObjectBackup = undefined;
});

$('#highlight-all').click(fillAllObjects);

/** Перетаскивание вершины **/

$(document.body).on("mousedown", ".point", function(event) {
    manageMap.deactivate();
    event.stopPropagation();
    var editedPoint = $(event.currentTarget);
    console.log(editedPoint.data("vertex"));

    // Координаты мыши после предыдущего смещения
    var oldX = event.pageX;
    var oldY = event.pageY;

    // Функция для смещения карты при движении мыши
    function moveProcessing(event) {
        var clickX = event.pageX;
        var clickY = event.pageY;
        var dx = oldX - clickX;
        var dy = oldY - clickY;

        editedPoint.offset({
            left: editedPoint.offset().left - dx,
            top: editedPoint.offset().top - dy
        });

        var cords = manageMap.toCords(editedPoint.offset().left - editedPoint.parent().offset().left,
                            editedPoint.offset().top - editedPoint.parent().offset().top);
        editedPoint.data("x-cord", cords.x).data("y-cord", cords.y);
        var vertex = editedPoint.data("vertex");
        vertex.x = cords.x;
        vertex.y = cords.y;

        manageMap.clearContext();
        manageMap.fillObject(editedObject);

        oldX = clickX;
        oldY = clickY;
    }

    // Включение обработки перемещения мыши
    $(document.body).on('mousemove', moveProcessing);

    // Функция для выключения обработки перемещения мыши
    function moveInterruption() {
        $(document.body).off('mousemove', moveProcessing);
        $(document.body).off("mouseup", moveInterruption);
        var cords = manageMap.toCords(editedPoint.offset().left - editedPoint.parent().offset().left,
                            editedPoint.offset().top - editedPoint.parent().offset().top);
        editedPoint.data("x-cord", cords.x).data("y-cord", cords.y);
        var vertex = editedPoint.data("vertex");
        vertex.x = cords.x;
        vertex.y = cords.y;
        editedPoint = undefined;
        manageMap.activate();
    }

    // Обработчики событий
    $(document.body).mouseup(moveInterruption);
});