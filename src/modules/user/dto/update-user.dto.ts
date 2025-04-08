import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IUpdateUserData, UserRole } from '../interfaces/user.interface';

// Using PartialType from @nestjs/swagger automatically generates a DTO with all fields
// from CreateUserDto but makes them all optional, which aligns with our IUpdateUserData interface
export class UpdateUserDto extends PartialType(CreateUserDto) implements IUpdateUserData {}
