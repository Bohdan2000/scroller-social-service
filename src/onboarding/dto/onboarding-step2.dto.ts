import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsUUID, Max, Min, ValidateNested } from 'class-validator';

class TopicWeightDto {
  @ApiProperty({ description: 'Topic ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  topicId: string;

  @ApiProperty({ description: 'Interest weight (1.0 = default)', example: 1.0, minimum: 0.1, maximum: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  weight?: number;
}

export class OnboardingStep2Dto {
  @ApiProperty({
    description: 'Selected topics (at least one required)',
    type: [TopicWeightDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TopicWeightDto)
  topics: TopicWeightDto[];
}
