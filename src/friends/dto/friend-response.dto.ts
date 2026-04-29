import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from '../../profiles/dto/profile-response.dto';

export class FriendRequestResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890' })
  requesterProfileId: string;

  @ApiProperty({ example: 'c1d2e3f4-a5b6-7890-abcd-ef1234567890' })
  targetProfileId: string;

  @ApiProperty({ enum: ['pending', 'accepted', 'rejected'], example: 'pending' })
  status: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class FriendshipResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ type: ProfileResponseDto })
  friend: ProfileResponseDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class IncomingFriendRequestDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: ProfileResponseDto })
  requester: ProfileResponseDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;
}

export class PaginatedFriendsResponseDto {
  @ApiProperty({ type: [FriendshipResponseDto] })
  data: FriendshipResponseDto[];

  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
