/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "subscriptions",
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
        name: "owner",
        type: "text",
        required: true,
        max: 100,
      },
      {
        name: "amount",
        type: "number",
        required: true,
        min: 0,
      },
      {
        name: "billing_cycle",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["mensual", "trimestral", "semestral", "anual"],
      },
      {
        name: "next_renewal",
        type: "date",
        required: true,
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["activa", "pausada", "cancelada"],
      },
      {
        name: "notes",
        type: "text",
        max: 500,
      },
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("subscriptions");
  return app.delete(collection);
});
