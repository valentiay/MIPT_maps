var manageMapContainer = $('#manage-map');
var manageMap = map(manageMapContainer);
var list = $('#list');

function pointObjectVertices (object) {
    for (var i = 0; i < object.vertices.length; i++) {
        var point = createPoint(object.vertices[i].x, object.vertices[i].y, 1);
        manageMap.addIndicator(point);
    }
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

            list.append("<h1>" + data.title + "</h1>");

            if(data.allFloors.length !== 0) {
                list.append("<h2>Другие этажи</h2><ul>");
                for (var i = 0; i < data.allFloors.length; i++) {
                    list.append('<li><a href = "/manage/' + data.allFloors[i].mapID + '"> Этаж ' + data.allFloors[i].floor + '</a></li>');
                }
                list.append("</ul>");
            }

            if(data.objects.length !== 0) {
                list.append("<h2>Объекты</h2><ul>");
                for (i = 0; i < data.objects.length; i++) {
                    manageMap.fillObject(data.objects[i]);
                    pointObjectVertices(data.objects[i]);

                    if (data.objects[i].mapID !== null)
                        list.append('<li><a href = "/manage/' + data.objects[i].mapID + '">' + data.objects[i].location + '</a></li>');
                    else
                        list.append('<li>' + data.objects[i].location + '</li>');
                }
                list.append("</ul>");
            }
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
    $('#add').hide();
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
    $('#add').show();
    objectAddInProcess = false;

    $.ajax({
        url: "/addObject",
        method: "POST",
        data: {
            "mapID": MAP_ID,
            "csrfmiddlewaretoken": $('input[name="csrfmiddlewaretoken"]').val(),
            "object": JSON.stringify(addedObject)
        },
        error: function() {
            addError("Сервер ответил ошибкой");
        },
        success: function() {
            addError("Объект успешно добавлен");
        }
    });
});
