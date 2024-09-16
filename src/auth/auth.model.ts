import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class User implements Prisma.UserUncheckedCreateInput {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address of the user',
    uniqueItems: true,
  })
  email: string;

  @ApiProperty({
    example: 'strong_password_123',
    description: 'Hashed password for the user',
  })
  password: string;

  @ApiProperty({
    example: 'username123',
    description: 'Unique username chosen by the user',
    uniqueItems: true,
  })
  username: string;
}
