/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "api_keys",
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
      {
        name: "prefix",
        type: "text",
        required: true,
        max: 20,
      },
      {
        name: "hash",
        type: "text",
        required: true,
        max: 64,
      },
      {
        name: "last_used",
        type: "date",
      },
    ],
    indexes: ["CREATE UNIQUE INDEX idx_api_keys_hash ON api_keys (hash)"],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("api_keys");
  return app.delete(collection);
});
