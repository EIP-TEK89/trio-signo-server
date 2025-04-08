/**
 * Core User interface that matches the User model from Prisma schema
 * Used throughout the application for user management
 */
export interface IUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Interface for paginated user responses
 */
export interface PaginatedUsers {
  data: IUser[];
  meta: {
    total: number;
    page: number;
    take: number;
  };
}

/**
 * Interface for user creation data
 */
export interface ICreateUserData {
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Interface for user update data (all fields optional)
 */
export interface IUpdateUserData {
  username?: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Interface for filtering and sorting users
 */
export interface IUserQueryOptions {
  skip?: number;
  take?: number;
  orderBy?: {
    field: keyof IUser;
    direction: 'asc' | 'desc';
  };
  searchTerm?: string;
}