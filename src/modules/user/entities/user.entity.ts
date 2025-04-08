import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '../interfaces/user.interface';

/**
 * User entity for Swagger documentation that mirrors the IUser interface
 * Used only for documentation purposes
 */
export class User implements IUser {
  @ApiProperty({ 
    description: 'Unique identifier for the user', 
    example: 'clvbw1j3t0000bttlqn2qp2s9' 
  })
  id: string;

  @ApiProperty({ 
    description: 'Unique username', 
    example: 'johndoe' 
  })
  username: string;

  @ApiProperty({ 
    description: 'User email address', 
    example: 'john.doe@example.com' 
  })
  email: string;

  @ApiProperty({ 
    description: 'When the user record was created', 
    example: '2025-04-08T12:00:00Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'When the user record was last updated', 
    example: '2025-04-08T12:00:00Z' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    description: 'User first name', 
    example: 'John', 
    required: false,
    nullable: true 
  })
  firstName?: string | null;

  @ApiProperty({ 
    description: 'User last name', 
    example: 'Doe', 
    required: false,
    nullable: true 
  })
  lastName?: string | null;

  @ApiProperty({ 
    description: 'URL to user avatar image', 
    example: 'https://example.com/avatars/john-doe.jpg', 
    required: false,
    nullable: true 
  })
  avatarUrl?: string | null;
}