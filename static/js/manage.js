var manageMapContainer = $('#manage-map');
var manageMap = map(manageMapContainer);

/** Выделение объектов **/

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

/** Вывод информации **/

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

/** Загрузка карты **/

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

/** Выбор объекта **/

$('#highlight-all').click(fillAllObjects);

$('#objects-list').on("click", "li", function(event) {
    editObject($(event.target).data("object"));
});

/** Изменение объекта **/

var editingInProcess = false;
var editedObject;
var editedObjectBackup;

function setAction(action) {
    $("#current-action").html(action);
}

function editObject(object) {
    setAction("Изменение объекта");
    $('#buttons').hide();
    manageMap.clear();
    editingInProcess = true;
    editedObjectBackup = object;
    editedObject = JSON.parse(JSON.stringify(object));

    if (object.id !== undefined) {
        manageMap.clearObject(object);
    }

    $('#edit-menu').show();
    $('#edit-title').val(editedObject.title);
    highlightObject(editedObject);
}

function stopEditing() {
    setAction("Выберите объект");
    $('#edit-menu').hide();
    $('#buttons').show();

    editingInProcess = false;
    editedObject = undefined;
    editedObjectBackup = undefined;

    stopVertexAdding();

    listObjects(manageMap.getObjectsList());
    fillAllObjects();
}

$('#add').click(function() {
    if (!editingInProcess) {
        editObject({
            title: "",
            vertices: []
        });
        startVertexAdding();
    }
});

$('#edit-title').change(function() {
    if (!editingInProcess)
        return;
    editedObject.title = $('#edit-title').val();
});

/** Добавление вершин **/

var vertexAddButton = $("#edit-add-vertex");

function addVertex(event, cords) {
    var vertex = {
        x: cords.x,
        y: cords.y
    };

    addError("Вершина добавлена");

    editedObject.vertices.push(vertex);
    manageMap.clearObject(editedObject);
    manageMap.fillObject(editedObject);
    highlightObject(editedObject);
}

function startVertexAdding() {
    if (!editingInProcess)
        return;

    setAction("Добавление вершин");

    manageMapContainer.on("mapClick", addVertex);

    vertexAddButton.off("click", startVertexAdding);
    vertexAddButton.html("Остановить добавление вершин");

    vertexAddButton.click(stopVertexAdding);
}

function stopVertexAdding() {
    setAction("Изменение объекта");

    manageMapContainer.off("mapClick", addVertex);
    vertexAddButton.html("Добавить вершины");
    vertexAddButton.off("click");
    vertexAddButton.click(startVertexAdding);
}

vertexAddButton.on("click", startVertexAdding);

function addRect() {
    if (!editingInProcess)
        return;

    setAction("Добавление вершин прямоугольником");

    manageMapContainer.off("mousedown", rectProcessing);

    function rectProcessing(event) {
        manageMapContainer.off("mousedown", rectProcessing);
        manageMapContainer.mouseup();
        manageMap.deactivate();
        event.stopPropagation();

        var ver1 = manageMap.toCords(
            event.pageX - manageMapContainer.offset().left,
            event.pageY - manageMapContainer.offset().top
        );
        var ver2;

        // Координаты мыши после предыдущего смещения
        var oldX = event.pageX;
        var oldY = event.pageY;

        // Функция для смещения карты при движении мыши
        function moveProcessing(event) {
            var clickX = event.pageX;
            var clickY = event.pageY;

            ver2 = manageMap.toCords(
                event.pageX - manageMapContainer.offset().left,
                event.pageY - manageMapContainer.offset().top
            );

            var rect = {
                vertices:[
                    ver1,
                    {x: ver2.x, y: ver1.y},
                    ver2,
                    {x: ver1.x, y: ver2.y}
                ]
            };
            rect.vertices = rect.vertices.concat(editedObject.vertices);
            highlightObject(rect);

            oldX = clickX;
            oldY = clickY;
        }

        // Включение обработки перемещения мыши
        $(document.body).on('mousemove', moveProcessing);

        // Функция для выключения обработки перемещения мыши
        function moveInterruption() {
            $(document.body).off('mousemove', moveProcessing);
            $(document.body).off("mouseup", moveInterruption);

            editedObject.vertices.push(ver1);
            editedObject.vertices.push({x: ver2.x, y: ver1.y});
            editedObject.vertices.push(ver2);
            editedObject.vertices.push({x: ver1.x, y: ver2.y});

            highlightObject(editedObject);
            manageMap.activate();
        }

        // Обработчики событий
        $(document.body).mouseup(moveInterruption);
    }

    manageMapContainer.mousedown(rectProcessing);
}

$("#edit-add-rectangle").click(addRect);

/** Подтверждение изменений **/

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
        },
        success: function(addedObject) {
            setAction("Выберите объект");
            addError("Объект успешно добавлен");
            addedObject = JSON.parse(addedObject);
            manageMap.addObject(addedObject);
            stopEditing();
        }
    });
}

$('#edit-save').click(function() {
    if (!editingInProcess)
        return;

    saveObject(editedObject);
});

$('#edit-delete').click(function() {
    if (!editingInProcess)
        return;

    $.ajax('/deleteObject', {
        method: "POST",
        data: {
            "id": editedObject.id,
            "csrfmiddlewaretoken": $('input[name="csrfmiddlewaretoken"]').val(),
        },
        success: function() {
            setAction("Выберите объект");
            manageMap.removeObject(editedObject);
            stopEditing();
            addError("Объект успешно удален");
        },
        error: function() {
            addError("Сервер ответил ошибкой");
        }
    });
});

$('#edit-cancel').click(function() {
    if (!editingInProcess)
        return;

    setAction("Выберите объект");

    $('#edit-menu').hide();
    $('#buttons').show();
    editingInProcess = false;

    if (editedObjectBackup.id !== undefined) {
        manageMap.addObject(editedObjectBackup);
    }
    editedObject = undefined;
    editedObjectBackup = undefined;

    manageMap.clear();
    fillAllObjects();
});

/** Перетаскивание вершины **/

$(document.body).on("mousedown", ".point", function(event) {
    manageMapContainer.mouseup();
    manageMap.deactivate();
    event.stopPropagation();
    var editedPoint = $(event.currentTarget);

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

        var cords = manageMap.toCords(
            editedPoint.offset().left - editedPoint.parent().offset().left - editedPoint.data("x-delta"),
            editedPoint.offset().top - editedPoint.parent().offset().top + editedPoint.data("y-delta")
        );

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
        var cords = manageMap.toCords(
            editedPoint.offset().left - editedPoint.parent().offset().left - editedPoint.data("x-delta"),
            editedPoint.offset().top - editedPoint.parent().offset().top + editedPoint.data("y-delta")
        );

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