from __future__ import unicode_literals

from django.db import models


class Object(models.Model):
    title = models.CharField(max_length=200, unique=True)
