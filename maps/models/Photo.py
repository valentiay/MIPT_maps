from django.db import models

from maps.models import Object


class Photo(models.Model):
    url = models.CharField(max_length=1000)
    related_object = models.ForeignKey(Object, related_name="photo_set")
