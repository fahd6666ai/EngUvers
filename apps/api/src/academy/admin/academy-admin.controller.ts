import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AcademyService } from '../academy.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { UpdateLessonDto } from '../dto/update-lesson.dto';

/**
 * Content-admin panel backend. Every route here is restricted to
 * admin/instructor roles — the same RolesGuard + @Roles() mechanism
 * CLAUDE.md's Auth decision describes, applied for the first time. No
 * per-course ownership check yet (any admin/instructor can edit any
 * course) — narrower "own courses only" access for instructors is a
 * later refinement, not a Phase 3 blocker.
 */
@UseGuards(RolesGuard)
@Roles('admin', 'instructor')
@Controller('admin/academy')
export class AcademyAdminController {
  constructor(private readonly academyService: AcademyService) {}

  @Get('courses')
  listCourses() {
    return this.academyService.listAllForAdmin();
  }

  @Get('courses/:id')
  getCourse(@Param('id') id: string) {
    return this.academyService.getForAdmin(id);
  }

  @Post('courses')
  createCourse(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto) {
    return this.academyService.createCourse(user.id, dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.academyService.updateCourse(id, dto);
  }

  @Post('courses/:id/lessons')
  createLesson(@Param('id') courseId: string, @Body() dto: CreateLessonDto) {
    return this.academyService.createLesson(courseId, dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.academyService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.academyService.deleteLesson(id);
  }
}
