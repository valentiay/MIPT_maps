from __future__ import unicode_literals

from django.db import models

from maps.models import Object


class Vertex(models.Model):
    object = models.ForeignKey(Object)
    x = models.FloatField()
    y = models.FloatField()
    order = models.IntegerField()
