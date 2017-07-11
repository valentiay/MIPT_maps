from django.conf.urls import url

from maps.views import *

urlpatterns = [
    url(r'^$', index, name="index"),
    url(r'^getMap$', get_map, name="getMap"),
    url(r'^getCabinetLocation$', get_cabinet_location, name="getCabinetLocation"),
    url(r'^phonebook$', phonebook, name="phoneBook")
]
