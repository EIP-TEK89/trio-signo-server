import * as bcrypt from 'bcryptjs';

/**
 * Hashes a plain text password
 * @param password Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compares a plain text password with a hashed password
 * @param plainPassword Plain text password
 * @param hashedPassword Hashed password
 * @returns True if passwords match, false otherwise
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}