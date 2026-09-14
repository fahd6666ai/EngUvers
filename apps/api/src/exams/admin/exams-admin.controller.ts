import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ExamsService } from '../exams.service';
import { CreateExamDto } from '../dto/create-exam.dto';
import { UpdateExamDto } from '../dto/update-exam.dto';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';

/**
 * Content-admin panel backend for exams — same role-gated shape as
 * academy/admin and library/admin. No per-exam ownership check yet,
 * same known gap as the other two content-admin panels.
 */
@UseGuards(RolesGuard)
@Roles('admin', 'instructor')
@Controller('admin/exams')
export class ExamsAdminController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  listExams() {
    return this.examsService.listAllForAdmin();
  }

  @Get(':id')
  getExam(@Param('id') id: string) {
    return this.examsService.getForAdmin(id);
  }

  @Post()
  createExam(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.examsService.createExam(user.id, dto);
  }

  @Patch(':id')
  updateExam(@Param('id') id: string, @Body() dto: UpdateExamDto) {
    return this.examsService.updateExam(id, dto);
  }

  @Post(':id/questions')
  createQuestion(@Param('id') examId: string, @Body() dto: CreateQuestionDto) {
    return this.examsService.createQuestion(examId, dto);
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.examsService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.examsService.deleteQuestion(id);
  }
}
