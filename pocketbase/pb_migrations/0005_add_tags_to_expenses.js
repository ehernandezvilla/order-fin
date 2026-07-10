/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("expenses");
  const tags = app.findCollectionByNameOrId("tags");

  collection.fields.add(new Field({
    name: "tags",
    type: "relation",
    collectionId: tags.id,
    maxSelect: 50,
    cascadeDelete: false,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("expenses");
  collection.fields.removeByName("tags");
  return app.save(collection);
});
