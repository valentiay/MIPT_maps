from __future__ import unicode_literals

from django.db import models

from maps.models import Object


class Alias(models.Model):
    title = models.CharField(max_length=20, unique=True)
    related_object = models.ForeignKey(Object, related_name="alias_set")

    def __unicode__(self):
        return "%s#%d" % (self.title, self.id)
