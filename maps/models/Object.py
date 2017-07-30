from __future__ import unicode_literals

import json

from django.db import models

class Object(models.Model):
    title = models.CharField(max_length=200)
    floor = models.IntegerField(blank=True, null=True)
    parent_object = models.ForeignKey('self', blank=True, null=True, related_name="child_objects")

    def __unicode__(self):
        return "Object#%d: %s" % (self.id, self.title)

    def get_json_info(self):
        parent_object = self.parent_object
        object_dict = {
            "cabinet": self.title,
            "mapID": parent_object.floor_maps.filter(floor=self.floor).all()[0].id,
            "buildingID": parent_object.id,
            "cabinetID": self.id,
        }
        return json.dumps(object_dict)
