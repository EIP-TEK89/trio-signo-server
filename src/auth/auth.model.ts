import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';

export class User implements Prisma.UserUncheckedCreateInput {
  @ApiProperty({
    example: 'ckp1z7z9d0000z3l7z9d0000z',
    description: 'Unique identifier for the user',
    uniqueItems: true,
  })
  id?: string;

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
  password?: string;

  @ApiProperty({
    example: 'username123',
    description: 'Unique username chosen by the user',
    uniqueItems: true,
  })
  username: string;

  @ApiProperty({
    example: 'google',
    description: 'OAuth provider used to sign in',
  })
  accessToken?: string;

  @ApiProperty({
    example: 'google',
    description: 'OAuth provider used to sign in',
  })
  refreshToken?: string;
}
