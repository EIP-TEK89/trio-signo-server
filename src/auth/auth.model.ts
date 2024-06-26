import { Prisma } from '@prisma/client';

export class User implements Prisma.UserUncheckedCreateInput {
  email: string;
  password: string;
  username: string;
}
