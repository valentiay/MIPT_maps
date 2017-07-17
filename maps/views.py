# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, Http404
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from maps.models import Map, Object, Vertex


@require_GET
def index(request):
    return HttpResponse(render(request, 'map.html'))


@require_GET
def get_map(request):
    map_id = int(request.GET.get('mapID'))
    print "GET %s : Load map %d" % (reverse(get_map), map_id)

    requested_map = get_object_or_404(Map, id=map_id)
    return HttpResponse(requested_map.get_json_info())


@require_GET
def get_cabinet_location(request):
    cabinet = request.GET.get('cabinet')
    print "GET %s : Get cabinet location %s" % (reverse(get_cabinet_location), cabinet)

    requested_object = get_object_or_404(Object, title=cabinet)
    return HttpResponse(requested_object.get_json_info())


@require_GET
def phonebook(request):
    print "GET %s: Phonebook request. Proxy server is malfunctioning" % reverse(phonebook)
    raise Http404


@login_required(login_url='/admin')
@require_GET
def manage_id(request, map_id):
    context = {
        "map_id": map_id,
    }
    return HttpResponse(render(request, 'manage.html', context))


@login_required(login_url='/admin')
@require_GET
def manage(request):
    return manage_id(request, 1)


@login_required(login_url='/admin')
@require_POST
def add_object(request):
    new_object_info = json.loads(request.POST["object"])
    map_id = request.POST["mapID"]
    parent_map = Map.objects.get(id=map_id)

    new_object = Object()
    new_object.title = new_object_info["title"]
    new_object.floor = parent_map.floor
    new_object.parent_object = parent_map.object
    new_object.save()

    for vertex_info in new_object_info["vertices"]:
        vertex = Vertex()
        vertex.object = new_object
        vertex.x = vertex_info["x"]
        vertex.y = vertex_info["y"]
        vertex.order = vertex_info["order"]
        vertex.save()

    return HttpResponse("OK")
