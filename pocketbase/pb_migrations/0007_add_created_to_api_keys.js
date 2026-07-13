/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("api_keys");

  collection.fields.add(new Field({
    name: "created",
    type: "autodate",
    onCreate: true,
    onUpdate: false,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("api_keys");
  collection.fields.removeByName("created");
  return app.save(collection);
});
