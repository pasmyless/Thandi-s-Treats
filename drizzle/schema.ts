import {
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/** Core user table backing the built-in Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  guestName: varchar("guestName", { length: 100 }),
  products: json("products").$type<string[]>().notNull(),
  comments: text("comments").notNull(),
  rating: int("rating").notNull(),
  recommendation: varchar("recommendation", { length: 120 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  customerName: varchar("customerName", { length: 120 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  requestedDate: varchar("requestedDate", { length: 16 }).notNull(),
  requestedTime: varchar("requestedTime", { length: 40 }).notNull(),
  fulfilment: mysqlEnum("fulfilment", ["collection", "delivery"]).notNull(),
  address: text("address"),
  items: json("items").$type<Array<{ product: string; quantity: number }>>().notNull(),
  occasion: varchar("occasion", { length: 100 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "confirmed", "completed", "cancelled"])
    .default("new")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const adminAccounts = mysqlTable("admin_accounts", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 100 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 128 }).notNull(),
  passwordSalt: varchar("passwordSalt", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
