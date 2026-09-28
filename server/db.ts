import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  adminAccounts,
  bookings,
  InsertUser,
  reviews,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type ReviewInput = {
  guestName?: string;
  products: string[];
  comments: string;
  rating: number;
  recommendation: string;
};

export async function createReview(input: ReviewInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(reviews).values({
    guestName: input.guestName || null,
    products: input.products,
    comments: input.comments,
    rating: input.rating,
    recommendation: input.recommendation,
  });
  return Number(result[0].insertId);
}

export async function getRatingSummary() {
  const db = await getDb();
  if (!db) return { average: 0, count: 0 };
  const result = await db
    .select({
      average: sql<string>`COALESCE(AVG(${reviews.rating}), 0)`,
      count: sql<string>`COUNT(*)`,
    })
    .from(reviews);
  return {
    average: Number(Number(result[0]?.average ?? 0).toFixed(1)),
    count: Number(result[0]?.count ?? 0),
  };
}

export type BookingInput = {
  customerName: string;
  email: string;
  phone: string;
  requestedDate: string;
  requestedTime: string;
  fulfilment: "collection" | "delivery";
  address?: string;
  items: Array<{ product: string; quantity: number }>;
  occasion?: string;
  notes?: string;
};

export async function createBooking(input: BookingInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(bookings).values({
    ...input,
    address: input.address || null,
    occasion: input.occasion || null,
    notes: input.notes || null,
  });
  return Number(result[0].insertId);
}

export async function getAdminAccount(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db
    .select()
    .from(adminAccounts)
    .where(eq(adminAccounts.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function seedAdminAccount(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(adminAccounts).values(input).onDuplicateKeyUpdate({
    set: { displayName: input.displayName },
  });
}

export async function updateAdminPassword(email: string, passwordHash: string, passwordSalt: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db
    .update(adminAccounts)
    .set({ passwordHash, passwordSalt })
    .where(eq(adminAccounts.email, email.toLowerCase()));
}

export async function getAdminDashboardData() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [allBookings, recentReviews, rating] = await Promise.all([
    db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(250),
    db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(100),
    getRatingSummary(),
  ]);
  return { bookings: allBookings, reviews: recentReviews, rating };
}

export async function updateBookingStatus(
  bookingId: number,
  status: "new" | "confirmed" | "completed" | "cancelled",
) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(bookings).set({ status }).where(eq(bookings.id, bookingId));
}
