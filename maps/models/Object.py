from __future__ import unicode_literals

from django.db import models


class Object(models.Model):
    title = models.CharField(max_length=200)
    floor = models.IntegerField(blank=True, null=True)
    parent_object = models.ForeignKey('self', blank=True, null=True, related_name="child_objects")

    def __unicode__(self):
        return "Object#%d: %s" % (self.id, self.title)
