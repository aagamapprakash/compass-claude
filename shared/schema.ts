import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";
import { users } from "./models/auth";

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  destination: text("destination").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  transportMode: text("transport_mode").notNull().default("airplane"),
  description: text("description"),
  userId: varchar("user_id").notNull(),
  allowJoinRequests: boolean("allow_join_requests").notNull().default(true),
  isPublic: boolean("is_public").notNull().default(false),
  inviteCode: varchar("invite_code", { length: 12 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripMembers = pgTable("trip_members", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const joinRequests = pgTable("join_requests", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripStops = pgTable("trip_stops", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  name: text("name").notNull(),
  placeId: text("place_id"),
  notes: text("notes"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  sortOrder: integer("sort_order").notNull().default(0),
  link: text("link"),
  confirmationNumber: text("confirmation_number"),
  attachmentType: text("attachment_type"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tripLikes = pgTable("trip_likes", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  paidByUserId: varchar("paid_by_user_id").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  category: text("category").notNull().default("other"),
  splitType: text("split_type").notNull().default("equal"),
  date: text("date"),
  stopId: integer("stop_id"),
  assignedToUserId: varchar("assigned_to_user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseSplits = pgTable("expense_splits", {
  id: serial("id").primaryKey(),
  expenseId: integer("expense_id").notNull(),
  userId: varchar("user_id").notNull(),
  amount: integer("amount").notNull(),
  settled: boolean("settled").notNull().default(false),
});

export const tripsRelations = relations(trips, ({ one, many }) => ({
  owner: one(users, { fields: [trips.userId], references: [users.id] }),
  members: many(tripMembers),
  joinRequests: many(joinRequests),
  stops: many(tripStops),
  likes: many(tripLikes),
  expenses: many(expenses),
}));

export const tripMembersRelations = relations(tripMembers, ({ one }) => ({
  trip: one(trips, { fields: [tripMembers.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripMembers.userId], references: [users.id] }),
}));

export const joinRequestsRelations = relations(joinRequests, ({ one }) => ({
  trip: one(trips, { fields: [joinRequests.tripId], references: [trips.id] }),
  user: one(users, { fields: [joinRequests.userId], references: [users.id] }),
}));

export const tripStopsRelations = relations(tripStops, ({ one, many }) => ({
  trip: one(trips, { fields: [tripStops.tripId], references: [trips.id] }),
  expenses: many(expenses),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id] }),
  following: one(users, { fields: [follows.followingId], references: [users.id] }),
}));

export const tripLikesRelations = relations(tripLikes, ({ one }) => ({
  trip: one(trips, { fields: [tripLikes.tripId], references: [trips.id] }),
  user: one(users, { fields: [tripLikes.userId], references: [users.id] }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  trip: one(trips, { fields: [expenses.tripId], references: [trips.id] }),
  paidBy: one(users, { fields: [expenses.paidByUserId], references: [users.id] }),
  stop: one(tripStops, { fields: [expenses.stopId], references: [tripStops.id] }),
  assignedTo: one(users, { fields: [expenses.assignedToUserId], references: [users.id], relationName: "assignedExpenses" }),
  splits: many(expenseSplits),
}));

export const expenseSplitsRelations = relations(expenseSplits, ({ one }) => ({
  expense: one(expenses, { fields: [expenseSplits.expenseId], references: [expenses.id] }),
  user: one(users, { fields: [expenseSplits.userId], references: [users.id] }),
}));

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
});

export const insertTripStopSchema = createInsertSchema(tripStops).omit({
  id: true,
  createdAt: true,
});

export const insertJoinRequestSchema = createInsertSchema(joinRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
});

export const insertExpenseSplitSchema = createInsertSchema(expenseSplits).omit({
  id: true,
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
export type TripMember = typeof tripMembers.$inferSelect;
export type JoinRequest = typeof joinRequests.$inferSelect;
export type TripStop = typeof tripStops.$inferSelect;
export type InsertTripStop = z.infer<typeof insertTripStopSchema>;
export type Follow = typeof follows.$inferSelect;
export type TripLike = typeof tripLikes.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type InsertExpenseSplit = z.infer<typeof insertExpenseSplitSchema>;
