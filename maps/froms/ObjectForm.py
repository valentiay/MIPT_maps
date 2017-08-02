from __future__ import unicode_literals

from django import forms
from django.db import DatabaseError

from maps.models import Object, Map


class ObjectForm(forms.Form):
    id = forms.IntegerField(required=False)
    map_id = forms.IntegerField(required=False)
    title = forms.CharField(max_length=200)

    def clean_title(self):
        title = self.cleaned_data["title"]
        if title == "":
            raise forms.ValidationError("Title is empty")
        return title

    def clean(self):
        cleaned_data = super(ObjectForm, self).clean()
        if "id" not in cleaned_data \
                and "map_id" not in cleaned_data:
            raise forms.ValidationError("No parent object or map defined")
        return cleaned_data

    def save(self):
        if self.cleaned_data["id"] is not None:
            object_id = self.cleaned_data["id"]
            edited_object = Object.objects.get(id=object_id)
            edited_object.title = self.cleaned_data["title"]
            edited_object.save()
            return edited_object
        else:
            new_object = Object()
            new_object.title = self.cleaned_data["title"]

            new_object_map = Map.objects.get(id=self.cleaned_data["map_id"])
            new_object.floor = new_object_map.floor
            new_object.parent_object = new_object_map.object

            new_object.save()
            return new_object
