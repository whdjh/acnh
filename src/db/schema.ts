import { pgTable, serial, varchar, timestamp, integer, pgEnum, uniqueIndex, jsonb } from "drizzle-orm/pg-core";

export const hemisphereEnum = pgEnum("hemisphere", ["north", "south"]);
export const categoryEnum = pgEnum("category", ["fish", "bug", "sea", "fossil"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 30 }).notNull().unique(),
  hemisphere: hemisphereEnum("hemisphere").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const caughtItems = pgTable(
  "caught_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: categoryEnum("category").notNull(),
    itemName: varchar("item_name", { length: 100 }).notNull(),
    caughtAt: timestamp("caught_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("user_item_unique").on(table.userId, table.category, table.itemName),
  ]
);

export const acnhItems = pgTable("acnh_items", {
  id: serial("id").primaryKey(),
  category: categoryEnum("category").notNull(),
  originalName: varchar("original_name", { length: 120 }).notNull(),
  nameKo: varchar("name_ko", { length: 120 }).notNull(),
  imageUrl: varchar("image_url", { length: 512 }).notNull(),
  location: varchar("location", { length: 160 }),
  sellNook: integer("sell_nook"),
  raw: jsonb("raw"),
  dataVersion: varchar("data_version", { length: 80 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("uniq_cat_name").on(t.category, t.originalName),
]);

export const acnhAvailability = pgTable("acnh_availability", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => acnhItems.id, { onDelete: "cascade" }),
  hemisphere: hemisphereEnum("hemisphere").notNull(),
  month: integer("month").notNull(),
  hoursMask: integer("hours_mask").notNull(),
}, (t) => [
  uniqueIndex("uniq_item_hemi_month").on(t.itemId, t.hemisphere, t.month),
]);