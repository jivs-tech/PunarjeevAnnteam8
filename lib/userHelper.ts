import { prisma } from '@/lib/prisma';

/**
 * Finds an existing database User by clerkUserId, or creates a new one if it does not exist.
 * Guaranteed to return a valid database User record with `id` (cuid).
 */
export async function getOrCreateDbUser(clerkUserId: string) {
  if (!clerkUserId) {
    throw new Error('clerkUserId is required to fetch or create a database user.');
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId }
  });

  if (!user) {
    user = await prisma.user.create({
      data: { clerkUserId }
    });
  }

  return user;
}
