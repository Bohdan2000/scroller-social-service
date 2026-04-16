import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus,
    public readonly code: string,
  ) {
    super({ message, code, statusCode }, statusCode);
  }
}

// ─── Profile exceptions ───────────────────────────────────────────────────────

export class ProfileNotFoundException extends DomainException {
  constructor() {
    super('Profile not found', HttpStatus.NOT_FOUND, 'SOCIAL_001');
  }
}

export class UsernameAlreadyTakenException extends DomainException {
  constructor() {
    super('Username is already taken', HttpStatus.CONFLICT, 'SOCIAL_002');
  }
}

export class ProfileAlreadyExistsException extends DomainException {
  constructor() {
    super('Profile already exists', HttpStatus.CONFLICT, 'SOCIAL_003');
  }
}

export class UsernameRequiredForCreationException extends DomainException {
  constructor() {
    super(
      'Username is required when creating a profile',
      HttpStatus.BAD_REQUEST,
      'SOCIAL_004',
    );
  }
}

// ─── Friend request exceptions ────────────────────────────────────────────────

export class CannotSendRequestToSelfException extends DomainException {
  constructor() {
    super(
      'Cannot send a friend request to yourself',
      HttpStatus.BAD_REQUEST,
      'SOCIAL_010',
    );
  }
}

export class AlreadyFriendsException extends DomainException {
  constructor() {
    super('You are already friends with this user', HttpStatus.CONFLICT, 'SOCIAL_011');
  }
}

export class FriendRequestAlreadyExistsException extends DomainException {
  constructor() {
    super(
      'A pending friend request already exists between these users',
      HttpStatus.CONFLICT,
      'SOCIAL_012',
    );
  }
}

export class FriendRequestNotFoundException extends DomainException {
  constructor() {
    super('Friend request not found', HttpStatus.NOT_FOUND, 'SOCIAL_013');
  }
}

export class FriendRequestNotPendingException extends DomainException {
  constructor() {
    super(
      'Friend request is not in pending status',
      HttpStatus.BAD_REQUEST,
      'SOCIAL_014',
    );
  }
}

// ─── Group exceptions ─────────────────────────────────────────────────────────

export class GroupNotFoundException extends DomainException {
  constructor() {
    super('Group not found', HttpStatus.NOT_FOUND, 'SOCIAL_020');
  }
}

export class GroupAccessDeniedException extends DomainException {
  constructor() {
    super('Access to this group is denied', HttpStatus.FORBIDDEN, 'SOCIAL_021');
  }
}

export class AlreadyGroupMemberException extends DomainException {
  constructor() {
    super('User is already a member of this group', HttpStatus.CONFLICT, 'SOCIAL_022');
  }
}

export class GroupMemberNotFoundException extends DomainException {
  constructor() {
    super('Group member not found', HttpStatus.NOT_FOUND, 'SOCIAL_023');
  }
}

export class InsufficientGroupRoleException extends DomainException {
  constructor() {
    super(
      'You do not have sufficient role to perform this action',
      HttpStatus.FORBIDDEN,
      'SOCIAL_024',
    );
  }
}

export class CannotRemoveGroupOwnerException extends DomainException {
  constructor() {
    super('The group owner cannot be removed', HttpStatus.BAD_REQUEST, 'SOCIAL_025');
  }
}
