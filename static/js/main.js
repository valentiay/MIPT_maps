"use strict";

var mainContainer = $('#map');
var main = map(mainContainer);

$.ajax('/getMap', {
    type: "GET",
    data: {"mapID": 0},
    dataType: "json",
    success: function(data) {
        var img = new Image;
        img.src = data.mapSRC;
        $(img).on("load", function () {
            var width = img.width;
            var height = img.height;
            main.renderMap(data, width, height);
            main.increaseScale()
        });
    }
});

$('#menu-button-increase-scale').click(main.increaseScale);
$('#menu-button-decrease-scale').click(main.decreaseScale);



var floorMapContainer = $('#floor-map');
var floorMap = map(floorMapContainer);
floorMap.deactivate();

function renderFloorList(data) {
    var floorList = $('#floor-list');
    floorList.html("");
    for (var i = 0; i < data.allFloors.length; i++) {
        var floorLink = document.createElement("p");
        if (data.allFloors[i].mapID === data.mapID)
            floorLink.className = "floor-active-p";
        floorLink.innerHTML = "Этаж " + data.allFloors[i].floor;
        floorList.get(0).appendChild(floorLink);
        $('#floor-title').html(data.title);
        $(floorLink).data('mapID', data.allFloors[i].mapID);
    }
}

function loadFloorMap(id) {
    $.ajax('/getMap', {
        type: "GET",
        data: {"mapID": id},
        dataType: "json",
        success: function(data) {
            var img = new Image;
            img.src = data.mapSRC;
            var MAX_FLOOR_MAP_WIDTH = $(document.body).width() - 170;
            var MAX_FLOOR_MAP_HEIGHT = $(document.body).height() - 40;
            $(img).on("load", function () {
                renderFloorList(data);
                var width = img.width;
                var height = img.height;
                var floorTitle = $('#floor-title');
                var floorMapBlock = $('#floor-map-container');
                floorMapBlock.css("margin-top", 0);
                floorMapBlock.css("margin-left", 0);
                if (width / height < MAX_FLOOR_MAP_WIDTH / MAX_FLOOR_MAP_HEIGHT) {
                    floorTitle.css("width", MAX_FLOOR_MAP_HEIGHT / height * width - 80 + 'px');
                    floorTitle.css("width", (MAX_FLOOR_MAP_HEIGHT - floorTitle.height()) / height * width - 80 + 'px');
                    floorMapContainer.css("height", MAX_FLOOR_MAP_HEIGHT - floorTitle.height() + 'px');
                    floorMapContainer.css("width", (MAX_FLOOR_MAP_HEIGHT - floorTitle.height()) / height * width + 'px');
                } else {
                    floorTitle.css("width", MAX_FLOOR_MAP_WIDTH - 80 + 'px');
                    floorMapContainer.css("width", MAX_FLOOR_MAP_WIDTH + 'px');
                    floorMapContainer.css("height", MAX_FLOOR_MAP_WIDTH / width * height - floorTitle.height() + 'px');
                }
                floorMapBlock.css("margin-top", ($(document.body).height() - floorMapBlock.height()) / 2 + 'px');
                floorMapBlock.css("margin-left", ($(document.body).width() - floorMapBlock.width()) / 2 + 'px');
                floorMap.renderMap(data, width, height);
                $('#floor-map').trigger('floor-map-ready');
            });
        }
    });
}

function activateFloorMap() {
    main.deactivate();
    $('#floor-map-container').css("visibility", "visible").hide().fadeIn(200);
    floorMap.activate();
}


$('#floor-list').on('click', 'p', function(event) {
    event.stopPropagation();
    if (event.target.className === "floor-active-p")
        return;
    loadFloorMap($(event.target).data('mapID'));
});

mainContainer.on('click', '.pointer-locate', function(event) {
    event.stopPropagation();
    var container = $(event.target).parent();
    loadFloorMap(container.data('mapID'));
    $('#floor-map').bind('floor-map-ready', function() {
        locateEmployeeCabinet(container.data('cabinetID'), container.data('staffInfo'));
        activateFloorMap();
        $('#floor-map').unbind('floor-map-ready');
    });
});

mainContainer.on('click', '.pointer-inside-map', function(event){
    event.stopPropagation();
    var container = $(event.target).parent();
    loadFloorMap(container.data('mapID'));
    activateFloorMap();
});

$('#floor-close').click(function() {
    floorMap.deactivate();
    $('#floor-map-container').fadeOut(200, function(){
        $(this).css("visibility", "hidden").show();
    });
    main.activate();
});



var search = navigation();
$('#menu-button-search').click(search.showNavigationMenu);
$('#search-container').on('click', '.search-employee-locate', function () {
    var employeeID = $(event.target).data("id");
    $.ajax('/phonebook', {
        type: "GET",
        data: {"rid" : employeeID},
        dataType: "json",
        success: function(staffInfo) {
            $.ajax('/getCabinetLocation', {
                type: "GET",
                data: {"cabinet": staffInfo.location[0]},
                dataType: "json",
                success: function(location) {
                    search.hideNavigationMenu();
                    locateEmployeeBuilding(location, staffInfo);
                }
            });
        }
    });
});