# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.http import HttpResponse, Http404
from django.shortcuts import render, get_object_or_404
from django.urls import reverse

from maps.models import Map, Object


def index(request):
    return HttpResponse(render(request, 'map.html'))


def get_map(request):
    map_id = int(request.GET.get('mapID'))
    print "GET %s : Load map %d" % (reverse(get_map), map_id)

    # TODO Refactor
    if map_id == 0:
        map_id = 1

    requested_map = get_object_or_404(Map, id=map_id)
    return HttpResponse(requested_map.get_json_info())


def get_cabinet_location(request):
    cabinet = request.GET.get('cabinet')
    print "GET %s : Get cabinet location %s" % (reverse(get_cabinet_location), cabinet)

    requested_object = get_object_or_404(Object, title=cabinet)
    return HttpResponse(requested_object.get_json_info())


def phonebook(request):
    print "GET %s: Phonebook request. Proxy server is malfunctioning" % reverse(phonebook)
    raise Http404


def manage_id(request, map_id):
    context = {
        "map_id": map_id,
    }
    return HttpResponse(render(request, 'manage.html', context))


def manage(request):
    return manage_id(request, 0)
