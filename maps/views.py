# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import json

import re
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, Http404
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from maps.forms import ObjectForm
from maps.models import Map, Object, Vertex, Alias


@require_GET
def index(request):
    return HttpResponse(render(request, 'map.html'))


@require_GET
def get_map(request):
    map_id = int(request.GET.get('mapID'))

    try:
        requested_map = get_object_or_404(Map, id=map_id)
        return HttpResponse(requested_map.get_data_json())
    except Http404:
        return HttpResponse(status=404)


@require_GET
def get_cabinet_location(request):
    cabinet = request.GET.get('cabinet').strip().upper()

    try:
        requested_cabinet = Object.objects.get(title=cabinet)
        return HttpResponse(requested_cabinet.get_location_json_as_cabinet())
    except Object.DoesNotExist:
        try:
            alias = re.split(r'[1-9]+', cabinet)[0].strip()
            return HttpResponse(Alias.objects.get(title=alias).related_object.get_location_json_as_building())
        except Alias.DoesNotExist:
            return HttpResponse(status=404)


@require_GET
def phonebook(request):
    return HttpResponse(status=404)


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
def edit_object(request):
    object_info = json.loads(request.POST["object"])
    map_id = request.POST["mapID"]

    object_info["map_id"] = map_id
    object_form = ObjectForm(object_info)

    try:
        if object_form.is_valid() and len(object_info["vertices"]) > 2:
            new_object = object_form.save()
            new_object.vertex_set.all().delete()

            order = 0
            for vertex_info in object_info["vertices"]:
                vertex = Vertex()
                vertex.object = new_object
                vertex.x = vertex_info["x"]
                vertex.y = vertex_info["y"]
                vertex.order = order
                order += 1
                vertex.save()

            return HttpResponse(json.dumps(new_object.get_data_json()))
        else:
            return HttpResponse(status=406)

    except IntegrityError:
        return HttpResponse(status=406)


@login_required(login_url='/admin')
@require_POST
def delete_object(request):
    try:
        if "id" not in request.POST:
            raise Object.DoesNotExist
        Object.objects.get(id=request.POST["id"]).delete()
        return HttpResponse("OK")
    except Object.DoesNotExist:
        return HttpResponse(status=406)
