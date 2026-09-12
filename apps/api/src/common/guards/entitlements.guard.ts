import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { EntitlementFeature } from '@enguvers/types';
import { EntitlementsService } from '../../entitlements/entitlements.service';
import { REQUIRE_ENTITLEMENT_KEY } from '../decorators/require-entitlement.decorator';

@Injectable()
export class EntitlementsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<EntitlementFeature | undefined>(
      REQUIRE_ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const { user } = context.switchToHttp().getRequest();
    const allowed = user && (await this.entitlements.can(user.id, feature));
    if (!allowed) {
      throw new ForbiddenException(`Your plan does not include ${feature}`);
    }
    return true;
  }
}
