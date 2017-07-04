"use strict";

var mainContainer = $('#map');
var main = map(mainContainer, 0);
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
            $(img).on("load", function () {
                var width = img.width;
                var height = img.height;
                floorMap.renderMap(data, width, height);
                renderFloorList(data);
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

var floorMap = map($('#floor-map'), 0);
floorMap.deactivate();

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
        floorMap.locateEmployeeCabinet(container.data('cabinetID'), container.data('staffInfo'));
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



var search = searcher();
$('#menu-button-search').click(search.showNavigationMenu);
$('#search-container').on('click', '.search-employee-locate', function () {
    var employeeID = $(event.target).data("id");
    $.ajax('/phonebook/', {
        type: "GET",
        data: {"rid" : employeeID},
        dataType: "json",
        success: function(staffInfo) {
            $.ajax('/getCabinetLocation', {
                type: "GET",
                data: {cabinet: staffInfo.location},
                dataType: "json",
                success: function(location) {
                    search.hideNavigationMenu();
                    main.locateEmployeeBuilding(location, staffInfo);
                }
            });
        }
    });
});