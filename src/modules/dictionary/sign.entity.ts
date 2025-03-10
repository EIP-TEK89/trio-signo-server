import { ApiProperty } from "@nestjs/swagger";
import { Prisma } from "@prisma/client";

export class Sign {
  @ApiProperty({
    example: 'cm71tq0lr0000101vby4ebcd9',
    description: 'The unique identifier of the sign',
  })
  id: string;

  @ApiProperty({
    example: 'A',
    description: 'The name of the sign',
  })
  word: string;

  @ApiProperty({
    example: 'La lettre A',
    description: 'The definition of the sign',
    required: false,
  })
  definition?: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'The URL of the image of the sign',
    required: false,
  })
  mediaUrl?: string;

  @ApiProperty({
    example: '2025-02-12T11:24:35.343Z',
    description: 'The date and time the sign was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-02-12T11:24:35.343Z',
    description: 'The date and time the sign was last updated',
  })
  updatedAt: Date;
}
