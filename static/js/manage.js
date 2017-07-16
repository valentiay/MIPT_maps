var manageMapContainer = $('#manage-map');
var manageMap = map(manageMapContainer);
var controls = $('#controls');

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

            controls.append("<h1>" + data.title + "</h1>");

            if(data.allFloors.length !== 0) {
                controls.append("<h2>Другие этажи</h2><ul>");
                for (var i = 0; i < data.allFloors.length; i++) {
                    controls.append('<li><a href = "/manage/' + data.allFloors[i].mapID + '"> Этаж ' + data.allFloors[i].floor + '</a></li>');
                }
                controls.append("</ul>");
            }

            if(data.objects.length !== 0) {
                controls.append("<h2>Объекты</h2><ul>");
                for (i = 0; i < data.objects.length; i++) {
                    manageMap.fillObject(data.objects[i]);
                    if (data.objects[i].mapID !== null)
                        controls.append('<li><a href = "/manage/' + data.objects[i].mapID + '">' + data.objects[i].location + '</a></li>');
                    else
                        controls.append('<li>' + data.objects[i].location + '</li>');
                }
                controls.append("</ul>");
            }
        });
    }
});

$('#menu-button-increase-scale').click(manageMap.increaseScale);
$('#menu-button-decrease-scale').click(manageMap.decreaseScale);