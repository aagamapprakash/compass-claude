import { 
  users, trips, tripMembers, joinRequests, tripStops, follows, tripLikes, expenses, expenseSplits,
  type User, type InsertTrip, type Trip, type TripMember, type JoinRequest, type TripStop, type InsertTripStop, type Follow, type TripLike, type Expense, type InsertExpense, type ExpenseSplit
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, inArray } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getTrips(): Promise<Trip[]>;
  getTripsByUser(userId: string): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  deleteTrip(id: number): Promise<void>;
  getTripMembers(tripId: number): Promise<TripMember[]>;
  addTripMember(tripId: number, userId: string, role?: string): Promise<TripMember>;
  removeTripMember(tripId: number, userId: string): Promise<void>;
  getJoinRequests(tripId: number): Promise<JoinRequest[]>;
  getJoinRequestsByUser(userId: string): Promise<JoinRequest[]>;
  getPendingRequestsForOwner(ownerId: string): Promise<(JoinRequest & { tripDestination: string; requesterName: string })[]>;
  createJoinRequest(tripId: number, userId: string): Promise<JoinRequest>;
  updateJoinRequestStatus(id: number, status: string): Promise<JoinRequest | undefined>;
  getJoinRequest(tripId: number, userId: string): Promise<JoinRequest | undefined>;
  getJoinRequestById(id: number): Promise<JoinRequest | undefined>;
  searchUsers(query: string): Promise<User[]>;
  searchTrips(query: string): Promise<Trip[]>;
  getTripStops(tripId: number): Promise<TripStop[]>;
  createTripStop(stop: InsertTripStop): Promise<TripStop>;
  updateTripStop(id: number, data: Partial<InsertTripStop>): Promise<TripStop | undefined>;
  deleteTripStop(id: number): Promise<void>;
  reorderTripStops(tripId: number, stopIds: number[]): Promise<void>;
  getPublicTrips(): Promise<Trip[]>;
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;
  likeTripByUser(tripId: number, userId: string): Promise<TripLike>;
  unlikeTripByUser(tripId: number, userId: string): Promise<void>;
  isTripLikedByUser(tripId: number, userId: string): Promise<boolean>;
  getTripLikeCount(tripId: number): Promise<number>;
  getTripLikeCountsBatch(tripIds: number[]): Promise<Record<number, number>>;
  getUserLikedTripIds(userId: string, tripIds: number[]): Promise<Set<number>>;
  generateInviteCode(tripId: number): Promise<string>;
  getTripByInviteCode(code: string): Promise<Trip | undefined>;
  getExpenses(tripId: number): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  addExpense(data: InsertExpense, memberUserIds: string[], splitDetails?: { userId: string; amount: number }[]): Promise<Expense>;
  updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;
  getExpenseSplits(expenseId: number): Promise<ExpenseSplit[]>;
  settleExpenseSplit(id: number, settled: boolean): Promise<ExpenseSplit | undefined>;
  recalculateExpenseSplits(expenseId: number, newAmount: number, splitDetails?: { userId: string; amount: number }[]): Promise<void>;
  getTripBalances(tripId: number): Promise<{ from: string; to: string; amount: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(desc(trips.createdAt));
  }

  async getTripsByUser(userId: string): Promise<Trip[]> {
    return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.createdAt));
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createTrip(tripData: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values(tripData).returning();
    return trip;
  }

  async deleteTrip(id: number): Promise<void> {
    const tripExpenses = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.tripId, id));
    if (tripExpenses.length > 0) {
      const expenseIds = tripExpenses.map(e => e.id);
      await db.delete(expenseSplits).where(inArray(expenseSplits.expenseId, expenseIds));
    }
    await db.delete(expenses).where(eq(expenses.tripId, id));
    await db.delete(tripLikes).where(eq(tripLikes.tripId, id));
    await db.delete(tripStops).where(eq(tripStops.tripId, id));
    await db.delete(tripMembers).where(eq(tripMembers.tripId, id));
    await db.delete(joinRequests).where(eq(joinRequests.tripId, id));
    await db.delete(trips).where(eq(trips.id, id));
  }

  async getTripMembers(tripId: number): Promise<TripMember[]> {
    return db.select().from(tripMembers).where(eq(tripMembers.tripId, tripId));
  }

  async addTripMember(tripId: number, userId: string, role: string = "member"): Promise<TripMember> {
    const [member] = await db.insert(tripMembers).values({ tripId, userId, role }).returning();
    return member;
  }

  async removeTripMember(tripId: number, userId: string): Promise<void> {
    await db.delete(tripMembers).where(
      and(eq(tripMembers.tripId, tripId), eq(tripMembers.userId, userId))
    );
  }

  async getJoinRequests(tripId: number): Promise<JoinRequest[]> {
    return db.select().from(joinRequests).where(eq(joinRequests.tripId, tripId)).orderBy(desc(joinRequests.createdAt));
  }

  async getJoinRequestsByUser(userId: string): Promise<JoinRequest[]> {
    return db.select().from(joinRequests).where(eq(joinRequests.userId, userId)).orderBy(desc(joinRequests.createdAt));
  }

  async getPendingRequestsForOwner(ownerId: string): Promise<(JoinRequest & { tripDestination: string; requesterName: string })[]> {
    const ownerTrips = await db.select().from(trips).where(eq(trips.userId, ownerId));
    const results: (JoinRequest & { tripDestination: string; requesterName: string })[] = [];
    
    for (const trip of ownerTrips) {
      const requests = await db.select().from(joinRequests)
        .where(and(eq(joinRequests.tripId, trip.id), eq(joinRequests.status, "pending")));
      
      for (const request of requests) {
        const requester = await this.getUser(request.userId);
        results.push({
          ...request,
          tripDestination: trip.destination,
          requesterName: requester?.firstName 
            ? `${requester.firstName}${requester.lastName ? ' ' + requester.lastName : ''}`
            : requester?.email || 'Unknown User',
        });
      }
    }
    
    return results;
  }

  async createJoinRequest(tripId: number, userId: string): Promise<JoinRequest> {
    const [request] = await db.insert(joinRequests).values({ tripId, userId }).returning();
    return request;
  }

  async updateJoinRequestStatus(id: number, status: string): Promise<JoinRequest | undefined> {
    const [request] = await db.update(joinRequests).set({ status }).where(eq(joinRequests.id, id)).returning();
    return request || undefined;
  }

  async getJoinRequest(tripId: number, userId: string): Promise<JoinRequest | undefined> {
    const [request] = await db.select().from(joinRequests)
      .where(and(eq(joinRequests.tripId, tripId), eq(joinRequests.userId, userId)));
    return request || undefined;
  }

  async getJoinRequestById(id: number): Promise<JoinRequest | undefined> {
    const [request] = await db.select().from(joinRequests).where(eq(joinRequests.id, id));
    return request || undefined;
  }

  async searchUsers(query: string): Promise<User[]> {
    const allUsers = await db.select().from(users);
    const lowerQuery = query.toLowerCase();
    return allUsers.filter(u => 
      u.email?.toLowerCase().includes(lowerQuery) ||
      u.firstName?.toLowerCase().includes(lowerQuery) ||
      u.lastName?.toLowerCase().includes(lowerQuery)
    );
  }

  async searchTrips(query: string): Promise<Trip[]> {
    const allTrips = await db.select().from(trips).orderBy(desc(trips.createdAt));
    const lowerQuery = query.toLowerCase();
    return allTrips.filter(t => 
      t.destination.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    );
  }

  async getTripStops(tripId: number): Promise<TripStop[]> {
    return db.select().from(tripStops)
      .where(eq(tripStops.tripId, tripId))
      .orderBy(asc(tripStops.sortOrder));
  }

  async createTripStop(stop: InsertTripStop): Promise<TripStop> {
    const [created] = await db.insert(tripStops).values(stop).returning();
    return created;
  }

  async updateTripStop(id: number, data: Partial<InsertTripStop>): Promise<TripStop | undefined> {
    const [updated] = await db.update(tripStops).set(data).where(eq(tripStops.id, id)).returning();
    return updated || undefined;
  }

  async deleteTripStop(id: number): Promise<void> {
    await db.delete(tripStops).where(eq(tripStops.id, id));
  }

  async reorderTripStops(tripId: number, stopIds: number[]): Promise<void> {
    for (let i = 0; i < stopIds.length; i++) {
      await db.update(tripStops)
        .set({ sortOrder: i })
        .where(and(eq(tripStops.id, stopIds[i]), eq(tripStops.tripId, tripId)));
    }
  }

  async getPublicTrips(): Promise<Trip[]> {
    return db.select().from(trips)
      .where(eq(trips.isPublic, true))
      .orderBy(desc(trips.createdAt));
  }

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db.insert(follows).values({ followerId, followingId }).returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows).where(
      and(eq(follows.followerId, followerId), eq(follows.followingId, followingId))
    );
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!result;
  }

  async getFollowers(userId: string): Promise<User[]> {
    const followerRows = await db.select().from(follows).where(eq(follows.followingId, userId));
    const followerUsers: User[] = [];
    for (const row of followerRows) {
      const user = await this.getUser(row.followerId);
      if (user) followerUsers.push(user);
    }
    return followerUsers;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const followingRows = await db.select().from(follows).where(eq(follows.followerId, userId));
    const followingUsers: User[] = [];
    for (const row of followingRows) {
      const user = await this.getUser(row.followingId);
      if (user) followingUsers.push(user);
    }
    return followingUsers;
  }

  async getFollowerCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(follows).where(eq(follows.followingId, userId));
    return result?.count ?? 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(follows).where(eq(follows.followerId, userId));
    return result?.count ?? 0;
  }

  async likeTripByUser(tripId: number, userId: string): Promise<TripLike> {
    const [like] = await db.insert(tripLikes).values({ tripId, userId }).returning();
    return like;
  }

  async unlikeTripByUser(tripId: number, userId: string): Promise<void> {
    await db.delete(tripLikes).where(
      and(eq(tripLikes.tripId, tripId), eq(tripLikes.userId, userId))
    );
  }

  async isTripLikedByUser(tripId: number, userId: string): Promise<boolean> {
    const [result] = await db.select().from(tripLikes)
      .where(and(eq(tripLikes.tripId, tripId), eq(tripLikes.userId, userId)));
    return !!result;
  }

  async getTripLikeCount(tripId: number): Promise<number> {
    const [result] = await db.select({ count: count() }).from(tripLikes).where(eq(tripLikes.tripId, tripId));
    return result?.count ?? 0;
  }

  async getTripLikeCountsBatch(tripIds: number[]): Promise<Record<number, number>> {
    if (tripIds.length === 0) return {};
    const rows = await db.select({ tripId: tripLikes.tripId, count: count() })
      .from(tripLikes)
      .where(sql`${tripLikes.tripId} IN (${sql.join(tripIds.map(id => sql`${id}`), sql`, `)})`)
      .groupBy(tripLikes.tripId);
    const result: Record<number, number> = {};
    for (const id of tripIds) result[id] = 0;
    for (const row of rows) result[row.tripId] = row.count;
    return result;
  }

  async getUserLikedTripIds(userId: string, tripIds: number[]): Promise<Set<number>> {
    if (tripIds.length === 0) return new Set();
    const rows = await db.select({ tripId: tripLikes.tripId })
      .from(tripLikes)
      .where(and(
        eq(tripLikes.userId, userId),
        sql`${tripLikes.tripId} IN (${sql.join(tripIds.map(id => sql`${id}`), sql`, `)})`
      ));
    return new Set(rows.map(r => r.tripId));
  }

  async generateInviteCode(tripId: number): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    let attempts = 0;
    do {
      code = '';
      const bytes = crypto.randomBytes(8);
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(bytes[i] % chars.length);
      }
      const existing = await this.getTripByInviteCode(code);
      if (!existing || existing.id === tripId) break;
      attempts++;
    } while (attempts < 10);
    await db.update(trips).set({ inviteCode: code }).where(eq(trips.id, tripId));
    return code;
  }

  async getTripByInviteCode(code: string): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.inviteCode, code));
    return trip || undefined;
  }

  async getExpenses(tripId: number): Promise<Expense[]> {
    return db.select().from(expenses)
      .where(eq(expenses.tripId, tripId))
      .orderBy(desc(expenses.createdAt));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async addExpense(data: InsertExpense, memberUserIds: string[], splitDetails?: { userId: string; amount: number }[]): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(data).returning();
    if (splitDetails && splitDetails.length > 0) {
      const splitValues = splitDetails.map(({ userId, amount }) => ({
        expenseId: expense.id,
        userId,
        amount,
        settled: userId === data.paidByUserId,
      }));
      await db.insert(expenseSplits).values(splitValues);
    } else if (data.splitType === 'equal' && memberUserIds.length > 0) {
      const perPerson = Math.floor(data.amount / memberUserIds.length);
      const remainder = data.amount - (perPerson * memberUserIds.length);
      const splitValues = memberUserIds.map((userId, i) => ({
        expenseId: expense.id,
        userId,
        amount: perPerson + (i === 0 ? remainder : 0),
        settled: userId === data.paidByUserId,
      }));
      await db.insert(expenseSplits).values(splitValues);
    }
    return expense;
  }

  async updateExpense(id: number, data: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, id));
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpenseSplits(expenseId: number): Promise<ExpenseSplit[]> {
    return db.select().from(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
  }

  async settleExpenseSplit(id: number, settled: boolean): Promise<ExpenseSplit | undefined> {
    const [updated] = await db.update(expenseSplits).set({ settled }).where(eq(expenseSplits.id, id)).returning();
    return updated || undefined;
  }

  async recalculateExpenseSplits(expenseId: number, newAmount: number, splitDetails?: { userId: string; amount: number }[]): Promise<void> {
    const splits = await this.getExpenseSplits(expenseId);
    if (splits.length === 0) return;
    if (splitDetails && splitDetails.length > 0) {
      await db.delete(expenseSplits).where(eq(expenseSplits.expenseId, expenseId));
      const expense = await this.getExpense(expenseId);
      const splitValues = splitDetails.map(({ userId, amount }) => ({
        expenseId,
        userId,
        amount,
        settled: userId === expense?.paidByUserId,
      }));
      await db.insert(expenseSplits).values(splitValues);
      return;
    }
    const perPerson = Math.floor(newAmount / splits.length);
    const remainder = newAmount - (perPerson * splits.length);
    for (let i = 0; i < splits.length; i++) {
      await db.update(expenseSplits)
        .set({ amount: perPerson + (i === 0 ? remainder : 0) })
        .where(eq(expenseSplits.id, splits[i].id));
    }
  }

  async getTripBalances(tripId: number): Promise<{ from: string; to: string; amount: number }[]> {
    const tripExpenses = await this.getExpenses(tripId);
    const netBalances: Record<string, number> = {};

    for (const expense of tripExpenses) {
      const splits = await this.getExpenseSplits(expense.id);
      const unsettledSplits = splits.filter(s => !s.settled);
      const unsettledTotal = unsettledSplits.reduce((sum, s) => sum + s.amount, 0);
      netBalances[expense.paidByUserId] = (netBalances[expense.paidByUserId] || 0) + unsettledTotal;
      for (const split of unsettledSplits) {
        netBalances[split.userId] = (netBalances[split.userId] || 0) - split.amount;
      }
    }

    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const [userId, balance] of Object.entries(netBalances)) {
      if (balance < 0) debtors.push({ userId, amount: -balance });
      else if (balance > 0) creditors.push({ userId, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const simplifiedDebts: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const payment = Math.min(debtors[i].amount, creditors[j].amount);
      if (payment > 0) {
        simplifiedDebts.push({ from: debtors[i].userId, to: creditors[j].userId, amount: payment });
      }
      debtors[i].amount -= payment;
      creditors[j].amount -= payment;
      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    return simplifiedDebts;
  }
}

export const storage = new DatabaseStorage();
