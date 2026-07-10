/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("categories");

  const categories = [
    { name: "Alimentación", icon: "🍽️", color: "#f97316" },
    { name: "Transporte", icon: "🚌", color: "#3b82f6" },
    { name: "Vivienda", icon: "🏠", color: "#8b5cf6" },
    { name: "Servicios", icon: "💡", color: "#eab308" },
    { name: "Salud", icon: "💊", color: "#ef4444" },
    { name: "Entretenimiento", icon: "🎬", color: "#ec4899" },
    { name: "Compras", icon: "🛍️", color: "#14b8a6" },
    { name: "Otros", icon: "🔖", color: "#6b7280" },
  ];

  for (const c of categories) {
    const record = new Record(collection);
    record.set("name", c.name);
    record.set("icon", c.icon);
    record.set("color", c.color);
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("categories");
  const records = app.findRecordsByFilter(collection.id, "");
  for (const r of records) {
    app.delete(r);
  }
});
