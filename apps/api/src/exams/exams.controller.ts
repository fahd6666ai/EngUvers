import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { RequireEntitlement } from '../common/decorators/require-entitlement.decorator';
import { EntitlementsGuard } from '../common/guards/entitlements.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { ExamsService } from './exams.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

/**
 * Route order matters here: the literal `me/attempts` and
 * `attempts/:attemptId` routes must come before the wildcard `:id`
 * route below, or Nest/Express would match "me"/"attempts" as an exam id
 * instead (first-registered-route-wins routing).
 */
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Public()
  @Get()
  list(@Query('disciplineTag') disciplineTag?: string) {
    return this.examsService.listPublished(disciplineTag);
  }

  @Get('me/attempts')
  listMyAttempts(@CurrentUser() user: AuthenticatedUser) {
    return this.examsService.listMyAttempts(user.id);
  }

  @Get('attempts/:attemptId')
  getAttempt(@CurrentUser() user: AuthenticatedUser, @Param('attemptId') attemptId: string) {
    return this.examsService.getAttempt(attemptId, user.id);
  }

  @Post('attempts/:attemptId/submit')
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
  ) {
    return this.examsService.submitAttempt(attemptId, user.id, dto);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.examsService.getPublished(id);
  }

  @UseGuards(EntitlementsGuard)
  @RequireEntitlement('exams.full_bank')
  @Post(':id/start')
  start(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.examsService.startAttempt(id, user.id);
  }
}
