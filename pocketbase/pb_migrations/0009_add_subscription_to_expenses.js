/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("expenses");
  const subscriptions = app.findCollectionByNameOrId("subscriptions");

  collection.fields.add(new Field({
    name: "subscription",
    type: "relation",
    collectionId: subscriptions.id,
    maxSelect: 1,
    cascadeDelete: false,
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("expenses");
  collection.fields.removeByName("subscription");
  return app.save(collection);
});
