import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { PaginatedUsers } from '../interfaces/user.interface';

/**
 * Paginated response entity for Swagger documentation
 * Implements the PaginatedUsers interface
 */
export class PaginatedUsersEntity implements PaginatedUsers {
  @ApiProperty({ 
    type: [User],
    description: 'Array of user objects' 
  })
  data: User[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      take: 10
    }
  })
  meta: {
    total: number;
    page: number;
    take: number;
  };
}
