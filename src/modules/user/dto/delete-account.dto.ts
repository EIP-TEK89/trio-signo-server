import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'yourCurrentP@ssw0rd',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
