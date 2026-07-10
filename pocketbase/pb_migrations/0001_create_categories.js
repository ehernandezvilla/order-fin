/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "categories",
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
        name: "icon",
        type: "text",
        max: 10,
      },
      {
        name: "color",
        type: "text",
        max: 20,
      },
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("categories");
  return app.delete(collection);
});
