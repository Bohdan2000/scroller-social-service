import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GroupMemberResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890' })
  profileId: string;

  @ApiProperty({ enum: ['owner', 'admin', 'member'], example: 'member' })
  role: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  joinedAt: Date;
}

export class GroupResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890' })
  ownerProfileId: string;

  @ApiProperty({ example: 'TypeScript Enthusiasts' })
  name: string;

  @ApiPropertyOptional({ example: 'A group for TS lovers' })
  description: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/group-images/abc.jpg' })
  imageUrl: string | null;

  @ApiProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty({ example: 5, description: 'Total member count' })
  memberCount: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
