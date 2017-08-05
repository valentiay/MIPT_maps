from __future__ import unicode_literals

import json

from django.db import models


class Object(models.Model):
    title = models.CharField(max_length=200, unique=True, db_index=True)
    floor = models.IntegerField(blank=True, null=True)
    parent_object = models.ForeignKey('self', blank=True, null=True, related_name="child_objects")

    def __unicode__(self):
        return "Object#%d: %s" % (self.id, self.title)

    # noinspection PyDictCreation
    def get_data_dict(self):
        object_dict = {}
        object_dict["id"] = self.id
        object_dict["title"] = self.title

        # TODO Refactor
        try:
            object_dict["mapID"] = self.floor_maps.order_by("floor")[0].id
        except IndexError:
            object_dict["mapID"] = None

        object_dict["vertices"] = []
        vertices = self.vertex_set.order_by('order').all()
        for vertex in vertices:
            object_dict["vertices"].append({
                "x": vertex.x,
                "y": vertex.y,
                "order": vertex.order,
            })
        return object_dict

    def get_data_json(self):
        return json.dumps(self.get_data_dict())

    def get_location_json_as_cabinet(self):
        parent_object = self.parent_object
        object_dict = {
            "cabinet": self.title,
            "mapID": parent_object.floor_maps.filter(floor=self.floor).all()[0].id,
            "buildingID": parent_object.id,
            "cabinetID": self.id,
        }
        return json.dumps(object_dict)

    def get_location_json_as_building(self):
        object_dict = {
            "cabinet": None,
            "mapID": self.parent_object.floor_maps.filter(floor=self.floor).all()[0].id,
            "buildingID": self.id,
            "cabinetID": None,
        }
        return json.dumps(object_dict)
