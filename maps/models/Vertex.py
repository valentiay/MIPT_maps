from __future__ import unicode_literals

from django.db import models

from maps.models import Object


class Vertex(models.Model):
    object = models.ForeignKey(Object)
    x = models.IntegerField()
    y = models.IntegerField()
    order = models.IntegerField()

    def __unicode__(self):
        return "Vertex#%d: n%d(%d, %d), Object: %s#%d" % (self.id, self.order, self.x, self.y,
                                                          self.object.title, self.object.id)
