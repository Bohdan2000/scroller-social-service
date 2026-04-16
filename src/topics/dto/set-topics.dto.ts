import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class TopicPreferenceItemDto {
  @ApiProperty({ description: 'Topic ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  topicId: string;

  @ApiPropertyOptional({ description: 'Preference weight (0-10)', example: 1.5, default: 1.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  weight?: number;
}

export class SetTopicsDto {
  @ApiProperty({ type: [TopicPreferenceItemDto], description: 'Replaces ALL existing topic preferences' })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TopicPreferenceItemDto)
  topics: TopicPreferenceItemDto[];
}
