from __future__ import unicode_literals

import json

from django.db import models

from maps.models.Object import Object


class Map(models.Model):
    title = models.CharField(max_length=200)
    floor = models.IntegerField(blank=True, null=True)
    src = models.CharField(max_length=200)
    object = models.ForeignKey(Object, related_name="floor_maps")

    def __unicode__(self):
        return "Map#%d: %s" % (self.id, self.title)

    # noinspection PyDictCreation
    def get_data_dict(self):
        map_dict = {}
        map_dict["mapID"] = self.id
        map_dict["title"] = self.title
        map_dict["mapSRC"] = self.src

        map_dict["allFloors"] = []
        if self.object.parent_object is not None:
            floor_maps = self.object.floor_maps.order_by("floor").all()
            for floor_map in floor_maps:
                map_dict["allFloors"].append({
                    "floor": floor_map.floor,
                    "mapID": floor_map.id,
                })

        if self.floor is not None:
            child_objects = self.object.child_objects.filter(floor=self.floor).all()
        else:
            child_objects = self.object.child_objects.all()

        map_dict["objects"] = []
        for child_object in child_objects:
            map_dict["objects"].append(child_object.get_data_dict())
        return map_dict

    def get_data_json(self):
        return json.dumps(self.get_data_dict())
