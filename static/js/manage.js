var manageMapContainer = $('#manage-map');
var manageMap = map(manageMapContainer);

function pointObjectVertices (object) {
    for (var i = 0; i < object.vertices.length; i++) {
        var point = createPoint(object.vertices[i].x, object.vertices[i].y, 1);
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
            "text": object.location
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

$('#objects-list').on("click", "li", function(event) {
    var object = $(event.target).data("object");
    manageMap.clear();
    manageMap.fillObject(object);
    pointObjectVertices(object);
});

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

var objectAddInProcess = false;
var addedObject;
var vertexOrder = 1;

$('#add').click(function() {
    $('#buttons').hide();
    if (!objectAddInProcess) {
        manageMap.clear();
        objectAddInProcess = true;
        $('#add-menu').show();
        vertexOrder = 1;
        addedObject = {
            title: "",
            vertices: []
        }
    }
});

$('#location').change(function() {
    if (!objectAddInProcess)
        return;
    addedObject.title = $('#location').val();
});

manageMapContainer.on("mapClick", function(event, cords) {
    if (!objectAddInProcess)
        return;

    var vertex = {
        x: cords.x,
        y: cords.y,
        order: vertexOrder++,
        mapID: MAP_ID
    };
    addError("Вершина добавлена");

    addedObject.vertices.push(vertex);
});

$('#add-save').click(function() {
    if (!objectAddInProcess)
        return;

    $('#add-menu').hide();
    $('#buttons').show();
    objectAddInProcess = false;

    $.ajax({
        url: "/addObject",
        method: "POST",
        dataType: "json",
        data: {
            "mapID": MAP_ID,
            "csrfmiddlewaretoken": $('input[name="csrfmiddlewaretoken"]').val(),
            "object": JSON.stringify(addedObject)
        },
        error: function() {
            addError("Сервер ответил ошибкой");
        },
        success: function(data) {
            addError("Объект успешно добавлен");
            addedObject.objID = data.objID;
            addedObject.location = addedObject.title;
            manageMap.addObject(addedObject);
            listObjects(manageMap.getObjectsList());
            fillAllObjects();
        }
    });
});

$('#highlight-all').click(fillAllObjects);