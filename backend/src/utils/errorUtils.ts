import { type Prisma } from '@/generated/prisma';

/**
 * Check if the error is a Prisma not found error.
 *
 * @param error - The error to check.
 * @returns {boolean}
 */
export function isNotFoundError(error: unknown): boolean {
  return (error as Prisma.PrismaClientKnownRequestError)?.code === 'P2025';
}

/**
 * Check if the error is a Prisma already exists error.
 *
 * @param error - The error to check.
 * @returns {boolean}
 */
export function isAlreadyExistsError(error: unknown): boolean {
  return (error as Prisma.PrismaClientKnownRequestError)?.code === 'P2002';
}

/**
 * Check if the error is a Prisma foreign key violation error.
 *
 * @param error - The error to check.
 * @returns {boolean}
 */
export function isForeignKeyViolationError(error: unknown): boolean {
  return (error as Prisma.PrismaClientKnownRequestError)?.code === 'P2003';
}
