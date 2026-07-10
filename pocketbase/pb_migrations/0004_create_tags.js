/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "tags",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        max: 100,
      },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_tags_name ON tags (name)"],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("tags");
  return app.delete(collection);
});
