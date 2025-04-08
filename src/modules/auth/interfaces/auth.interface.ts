import { AuthMethodType } from '@prisma/client';
import { IUser } from '../../user/interfaces/user.interface';

/**
 * Authentication method interface matching AuthMethod model in Prisma schema
 */
export interface IAuthMethod {
  id: string;
  userId: string;
  type: AuthMethodType;
  identifier: string;
  credential?: string | null;
  refreshToken?: string | null;
  isVerified: boolean;
  lastUsedAt?: Date | null;
  failedAttempts: number;
  lockedUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Token interface matching Token model in Prisma schema
 */
export interface IToken {
  id: string;
  authMethodId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  sub: string;      // User ID
  username: string;
  type: AuthMethodType;
  authMethodId: string;
}

/**
 * Response after successful authentication
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: IUser;
}

/**
 * Interface for login data
 */
export interface ILoginData {
  email: string;
  password: string;
}

/**
 * Interface for registration data
 */
export interface IRegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Interface for OAuth user data
 */
export interface IOAuthUser {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider: AuthMethodType;
  providerId: string;  // External ID from provider
}