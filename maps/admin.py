# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.contrib import admin

from maps.models import Object, Map, Vertex, Alias

admin.site.register(Map)
admin.site.register(Object)
admin.site.register(Vertex)
admin.site.register(Alias)
