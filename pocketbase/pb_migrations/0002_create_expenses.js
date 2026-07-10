/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories");

  const collection = new Collection({
    name: "expenses",
    type: "base",
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      {
        name: "amount",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "merchant",
        type: "text",
        max: 200,
      },
      {
        name: "category",
        type: "relation",
        required: true,
        collectionId: categories.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      {
        name: "date",
        type: "date",
        required: true,
      },
      {
        name: "note",
        type: "text",
        max: 500,
      },
      {
        name: "receipt",
        type: "file",
        maxSelect: 1,
        maxSize: 10485760,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
      },
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("expenses");
  return app.delete(collection);
});
