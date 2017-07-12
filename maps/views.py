# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.http import HttpResponse, Http404
from django.shortcuts import render
from django.urls import reverse

from maps.models import Map


def index(request):
    return HttpResponse(render(request, 'map.html'))


def get_map(request):
    map_id = int(request.GET.get('mapID'))
    print "GET %s : Load map %d" % (reverse(get_map), map_id)
    # TODO Refactor
    if map_id == 0:
        map_id = 1
    print(Map.objects.get(id=map_id).get_json_response())
    return HttpResponse(Map.objects.get(id=map_id).get_json_response())
    #     return HttpResponse('{ "mapID" : 0, "title": "Схема кампуса", "allFloors": [], "mapSRC": "/static/img/campus_map.jpeg", "objects": [{ "objID": 0, "mapID":1, "location": "НОВЫЙ КОРПУС", "vertices": [{"x": 1531, "y": 1738}, {"x": 2337, "y": 1738}, {"x": 2337, "y": 1864}, {"x": 1531, "y": 1864}]}]}')
    # elif map_id == 1:
    #     return HttpResponse('{ "mapID" : 1, "title": "1 этаж Нового Корпуса", "allFloors": [{"floor": 1, "mapID": 1}, {"floor": 2, "mapID": 2}], "mapSRC": "/static/img/inside_map1.jpg", "objects": [{ "objID": 0, "mapID":0, "location": "НОВЫЙ КОРПУС", "vertices": [{"x": 206, "y": 464}, {"x": 206, "y": 289}, {"x": 362, "y": 289}, {"x":  362, "y": 464}]}]}')
    # elif map_id == 2:
    #     return HttpResponse('{ "mapID" : 2, "title": "2 этаж Нового Корпуса", "allFloors": [{"floor": 1, "mapID": 1}, {"floor": 2, "mapID": 2}], "mapSRC": "/static/img/inside_map2.jpeg", "objects": [{ "objID": 0, "mapID":0, "location": "НОВЫЙ КОРПУС", "vertices": [{"x": 248, "y": 433}, {"x": 248, "y": 536}, {"x": 340, "y": 536}, {"x": 340, "y": 433}]}]}')
    # raise Http404


def get_cabinet_location(request):
    cabinet = request.GET.get('cabinet')
    print "GET %s : Get cabinet location %s" % (reverse(get_cabinet_location), cabinet)
    return HttpResponse('{"cabinet": "АК310", "mapID": 1, "buildingID": 0, "cabinetID": 0}')


def phonebook(request):
    print "GET %s: Phonebook request. Proxy server is malfunctioning" % reverse(phonebook)
    raise Http404
