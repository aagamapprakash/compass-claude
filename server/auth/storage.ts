import { users, trips, tripMembers, joinRequests, follows, tripLikes, expenses, expenseSplits, type User, type UpsertUser } from "@shared/schema";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";

export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (err: any) {
      // Email already exists under a different ID (old Replit auth row).
      // Migrate all references from the old ID to the new Supabase UUID.
      if (err.code === "23505" && err.constraint === "users_email_unique" && userData.email && userData.id) {
        return this.migrateUserId(userData.email, userData.id, userData);
      }
      throw err;
    }
  }

  // Rewrites all old-ID references across every table to the new Supabase UUID,
  // then updates the users row itself.
  private async migrateUserId(email: string, newId: string, userData: UpsertUser): Promise<User> {
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (!existing) throw new Error(`User with email ${email} not found during migration`);

    const oldId = existing.id;
    if (oldId === newId) {
      // Already using the correct ID — just update profile fields.
      const [user] = await db.update(users)
        .set({ firstName: userData.firstName, lastName: userData.lastName, profileImageUrl: userData.profileImageUrl, updatedAt: new Date() })
        .where(eq(users.id, oldId))
        .returning();
      return user;
    }

    // Rewrite all foreign references in a single transaction.
    await db.transaction(async (tx) => {
      await tx.execute(sql`UPDATE trips SET user_id = ${newId} WHERE user_id = ${oldId}`);
      await tx.execute(sql`UPDATE trip_members SET user_id = ${newId} WHERE user_id = ${oldId}`);
      await tx.execute(sql`UPDATE join_requests SET user_id = ${newId} WHERE user_id = ${oldId}`);
      await tx.execute(sql`UPDATE follows SET follower_id = ${newId} WHERE follower_id = ${oldId}`);
      await tx.execute(sql`UPDATE follows SET following_id = ${newId} WHERE following_id = ${oldId}`);
      await tx.execute(sql`UPDATE trip_likes SET user_id = ${newId} WHERE user_id = ${oldId}`);
      await tx.execute(sql`UPDATE expenses SET paid_by_user_id = ${newId} WHERE paid_by_user_id = ${oldId}`);
      await tx.execute(sql`UPDATE expenses SET assigned_to_user_id = ${newId} WHERE assigned_to_user_id = ${oldId}`);
      await tx.execute(sql`UPDATE expense_splits SET user_id = ${newId} WHERE user_id = ${oldId}`);
      await tx.execute(sql`UPDATE users SET id = ${newId}, first_name = ${userData.firstName ?? existing.firstName}, last_name = ${userData.lastName ?? existing.lastName}, profile_image_url = ${userData.profileImageUrl ?? existing.profileImageUrl}, updated_at = NOW() WHERE id = ${oldId}`);
    });

    const [migrated] = await db.select().from(users).where(eq(users.id, newId));
    return migrated;
  }
}

export const authStorage = new AuthStorage();
