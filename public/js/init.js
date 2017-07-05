"use strict";

var mainContainer = $('#map');
var main = map(mainContainer);

var EMPTY_MAP_INFO = '{ "mapID" : 0, "title": "Схема кампуса", "allFloors": [], "mapSRC": "/img/campus_map.jpeg", "objects": []}'
var mapData = JSON.parse(EMPTY_MAP_INFO); // Твоя тема

var pointsData = JSON.parse(POINT_LIST);

var img = new Image;
img.src = mapData.mapSRC;
$(img).on("load", function () {
    var width = img.width;
    var height = img.height;
    main.renderMap(mapData, width, height, pointsData);
});