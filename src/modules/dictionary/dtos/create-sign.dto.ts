import { OmitType } from '@nestjs/swagger';
import { Sign } from '../sign.entity';

export class CreateSignDto extends OmitType(Sign, [
  'id',
  'createdAt',
  'updatedAt',
]) {}
