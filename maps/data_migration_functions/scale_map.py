from maps.models import Map, Object


def scale_map(map, ratio):
    objects = map.object.child_objects.all()
    for ch_object in objects:
        for vertex in ch_object.vertex_set.all():
            vertex.x = ratio * vertex.x
            vertex.y = ratio * vertex.y
            vertex.save()


def scale_main_map(apps, schema_editor):
    scale_map(Map.objects.get(object=Object.objects.get(title="root")), 1.5)
