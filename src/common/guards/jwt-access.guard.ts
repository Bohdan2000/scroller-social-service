import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<T>(err: Error | null, user: T | false): T {
    if (err || !user) {
      throw new UnauthorizedException('Token is invalid or expired');
    }
    return user;
  }
}

/**
 * A guard that does NOT throw if there is no token — it just doesn't populate
 * req.user. Used on routes where authentication is optional (e.g. GET /groups/:id).
 */
@Injectable()
export class OptionalJwtAccessGuard extends AuthGuard('jwt-access') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleRequest<T>(err: Error | null, user: T | false, _info: unknown): T {
    // Return user if present, otherwise return null without throwing
    return (user || null) as T;
  }
}
