import { pgTable, serial, varchar, timestamp, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";

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

