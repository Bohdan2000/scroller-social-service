import { ApiProperty } from '@nestjs/swagger';

export class TopicResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'typescript' })
  slug: string;

  @ApiProperty({ example: 'TypeScript' })
  title: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class TopicPreferenceResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ type: TopicResponseDto })
  topic: TopicResponseDto;

  @ApiProperty({ example: 1.5 })
  weight: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedTopicsResponseDto {
  @ApiProperty({ type: [TopicResponseDto] })
  data: TopicResponseDto[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
