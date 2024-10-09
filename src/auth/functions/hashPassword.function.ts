import * as bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const saltRound = 10;
  return await bcrypt.hash(password, saltRound);
}
