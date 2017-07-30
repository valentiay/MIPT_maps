"use strict";

/** Полезные функции для работы с кординатами **/

// Посчитать среднее значение координат
function getAvgCords(vers) {
    var x = 0, y = 0, i;
    for (i = 0; i < vers.length; i++) {
        x += vers[i].x;
        y += vers[i].y;
    }
    x /= vers.length;
    y /= vers.length;
    var ans = {};
    ans.x = x;
    ans.y = y;
    return ans;
}

// Проверить, принадлежит ли точка многоугольнику
function polygonContainsDot(vers, dot) {
    var intersections = 0;
    if ((vers[0].y - dot.y)*(vers[vers.length - 1].y - dot.y) < 0
        && (vers[0].y - vers[vers.length - 1].y !== 0
        && vers[0].x + (vers[0].x - vers[vers.length - 1].x) * (vers[0].y - dot.y) / (vers[0].y - vers[vers.length - 1].y) > dot.x
        || vers[0].y - vers[vers.length - 1].y === 0 && vers[0].x > dot.x))
        intersections++;
    for (var j = 1; j < vers.length; j++) {
        if (dot.x < vers[j].x && (vers[j].y - dot.y) * (vers[j - 1].y - dot.y) < 0
            && (vers[j].y - vers[j - 1].y !== 0
            && vers[j].x + (vers[j].x - vers[j - 1].x) * (vers[j].y - dot.y) / (vers[j].y - vers[j - 1].y) > dot.x
            || vers[j].y - vers[j - 1].y === 0 && vers[j].x > dot.x))
            intersections++;
    }
    return intersections % 2 === 1;
}