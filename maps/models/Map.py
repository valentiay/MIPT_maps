from __future__ import unicode_literals

from django.db import models

from maps.models.Object import Object


class Map(models.Model):
    title = models.CharField(max_length=200)
    floor = models.IntegerField()
    object = models.ForeignKey(Object)
    map_src = models.CharField(max_length=200)

    def get_map_response(self):
        return MapResponse(self)


class MapResponse:
    def __init__(self, map_instance):
        self.mapID = map_instance.id
        self.title = map_instance.title
        self.mapSRC = map_instance.map_src

        floor_maps = map_instance.object.map_set.all()
        self.allFloors = []
        for floor_map in floor_maps:
            self.allFloors.append({
                "floor": floor_map.floor,
                "mapID": floor_map.id,
            })

        map_objects = map_instance.object.map_set.all()
        self.objects = []
        for map_object in map_objects:
            self.objects.append(ResponseObject(map_object))


class ResponseObject:
    def __init__(self, map_object):
        self.objID = map_object.id
        self.location = map_object.title
        # TODO
        self.mapID = map_object.first_floor_map.id

        self.vertices = []
        vertices = map_object.vertex_set.all()
        for vertex in vertices:
            self.vertices.append({
                "x": vertex.x,
                "y": vertex.y,
            })
