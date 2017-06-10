"use strict";

var main = map('#map', 0);
var mainContainer = $('#map');

$('#menu-button-increase-scale').click(function() { main.increaseScale();});
$('#menu-button-decrease-scale').click(function() { main.decreaseScale();});

var insideMap = map('#floor-map', 0);
insideMap.deactivate();

var search = searcher();
$('#menu-button-search').click(search.showNavigationMenu);

function renderFloorList() {
    var mapInfo = insideMap.getMapInfo();
    var floorList = $('#floor-list');
    floorList.html("");
    for (var i = 0; i < mapInfo.allFloors.length; i++) {
        var floorLink = document.createElement("p");
        if (mapInfo.allFloors[i].mapID === mapInfo.mapID)
            floorLink.className = "floor-active-p";
        floorLink.innerHTML = "Этаж " + mapInfo.allFloors[i].floor;
        floorList.get(0).appendChild(floorLink);
        $('#floor-title').html(mapInfo.title);
        $(floorLink).data('mapID', mapInfo.allFloors[i].mapID);
    }
}

function activateInsideMap() {
    main.deactivate();
    $('#floor-map-container').css("visibility", "visible").hide().fadeIn(200);
    renderFloorList();
    insideMap.activate();
}

$('#floor-list').on('click', 'p', function(event) {
    event.stopPropagation();
    if (event.target.className === "floor-active-p")
        return;
    insideMap.loadMap($(event.target).data('mapID'));
    $('#floor-map').bind('load', function() {
        renderFloorList();
    });
});

mainContainer.on('click', '.pointer-locate', function(event) {
    event.stopPropagation();
    var container = $(event.target).parent();
    insideMap.loadMap(container.data('mapID'));
    $('#floor-map').bind('load', function() {
        activateInsideMap();
        insideMap.locateEmployeeCabinet(container.data('cabinetID'), container.data('staffInfo'));
        $('#floor-map').unbind('load');
    });
});

mainContainer.on('click', '.pointer-inside-map', function(event){
    event.stopPropagation();
    var container = $(event.target).parent();
    insideMap.loadMap(container.data('mapID'));
    insideMap.loadMap(container.data('mapID'));
    $('#floor-map').bind('load', function() {
        activateInsideMap();
        $('#floor-map').unbind('load');
    });
});

$('#floor-close').click(function() {
    insideMap.deactivate();
    $('#floor-map-container').fadeOut(200, function(){
        $(this).css("visibility", "hidden").show();
    });
    main.activate();
});

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