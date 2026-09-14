import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { RequireEntitlement } from '../common/decorators/require-entitlement.decorator';
import { EntitlementsGuard } from '../common/guards/entitlements.guard';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AcademyService } from './academy.service';

@Controller('academy')
export class AcademyController {
  constructor(private readonly academyService: AcademyService) {}

  @Public()
  @Get('courses')
  listCourses(@Query('disciplineTag') disciplineTag?: string) {
    return this.academyService.listPublished(disciplineTag);
  }

  @Public()
  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.academyService.getPublished(id);
  }

  @UseGuards(EntitlementsGuard)
  @RequireEntitlement('academy.courses')
  @Post('courses/:id/enroll')
  enroll(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academyService.enroll(id, user.id);
  }

  @Get('me/enrollments')
  listMyEnrollments(@CurrentUser() user: AuthenticatedUser) {
    return this.academyService.listMyEnrollments(user.id);
  }

  @Get('courses/:id/my-progress')
  getMyProgress(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academyService.getMyProgress(id, user.id);
  }

  @UseGuards(EntitlementsGuard)
  @RequireEntitlement('academy.courses')
  @Post('lessons/:id/complete')
  completeLesson(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academyService.completeLesson(id, user.id);
  }
}
