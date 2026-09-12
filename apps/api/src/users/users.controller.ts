import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { OnboardingDto } from './dto/onboarding.dto';

@Controller('me')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  @Get('entitlements')
  async getEntitlements(@CurrentUser() user: AuthenticatedUser) {
    const active = await this.entitlementsService.listActive(user.id);
    return active.map((e) => ({ planCode: e.plan.code, source: e.source, endsAt: e.endsAt }));
  }

  @Patch('profile')
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('onboarding')
  completeOnboarding(@CurrentUser() user: AuthenticatedUser, @Body() dto: OnboardingDto) {
    return this.usersService.completeOnboarding(user.id, dto);
  }
}
