from django.conf.urls import url

from maps.views import *

urlpatterns = [
    url(r'^$', index, name="index"),
    url(r'^manage$', manage, name="manage"),
    url(r'^manage/(?P<map_id>[0-9]+)$', manage_id, name="manage_id"),
    url(r'^getMap$', get_map, name="getMap"),
    url(r'^getCabinetLocation$', get_cabinet_location, name="getCabinetLocation"),
    url(r'^phonebook$', phonebook, name="phoneBook"),
    url(r'^addObject$', edit_object, name="addObject"),
    url(r'^deleteObject', delete_object, name="deleteObject"),
]
