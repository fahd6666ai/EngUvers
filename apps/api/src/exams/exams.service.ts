import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateExamDto } from './dto/create-exam.dto';
import type { UpdateExamDto } from './dto/update-exam.dto';
import type { CreateQuestionDto } from './dto/create-question.dto';
import type { UpdateQuestionDto } from './dto/update-question.dto';
import type { SubmitAttemptDto } from './dto/submit-attempt.dto';

const CATALOG_SELECT = {
  id: true,
  titleAr: true,
  titleEn: true,
  descriptionAr: true,
  descriptionEn: true,
  disciplineTag: true,
  _count: { select: { questions: true } },
} as const;

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public catalog ----

  listPublished(disciplineTag?: string) {
    return this.prisma.exam.findMany({
      where: { published: true, ...(disciplineTag ? { disciplineTag } : {}) },
      orderBy: { createdAt: 'desc' },
      select: CATALOG_SELECT,
    });
  }

  async getPublished(id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, published: true },
      select: CATALOG_SELECT,
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  // ---- Taking an exam (entitlement-gated at the controller) ----

  /**
   * `totalPoints` is snapshotted here from the exam's questions at this
   * moment — see the model comment in schema.prisma for why. The
   * question/option payload returned never includes `isCorrect`.
   */
  async startAttempt(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    });
    if (!exam || !exam.published) throw new NotFoundException('Exam not found');
    if (exam.questions.length === 0) {
      throw new BadRequestException('This exam has no questions yet');
    }

    const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0);
    const attempt = await this.prisma.examAttempt.create({ data: { examId, userId, totalPoints } });

    return {
      attemptId: attempt.id,
      exam: { id: exam.id, titleAr: exam.titleAr, titleEn: exam.titleEn },
      questions: exam.questions.map((q) => ({
        id: q.id,
        textAr: q.textAr,
        textEn: q.textEn,
        order: q.order,
        points: q.points,
        options: [...q.options]
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ id: o.id, textAr: o.textAr, textEn: o.textEn, order: o.order })),
      })),
    };
  }

  /**
   * Grades against the question's own option set only — a selectedOptionId
   * belonging to a different question is silently treated as "no answer"
   * for that question, not credited. One submit per attempt: a second
   * call on an already-submitted attempt is rejected outright.
   */
  async submitAttempt(attemptId: string, userId: string, dto: SubmitAttemptDto) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { include: { questions: { include: { options: true } } } } },
    });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt not found');
    if (attempt.submittedAt) throw new BadRequestException('This attempt was already submitted');

    const selectedByQuestion = new Map(dto.answers.map((a) => [a.questionId, a.selectedOptionId]));

    let score = 0;
    const answerRows = attempt.exam.questions.map((question) => {
      const selectedOptionId = selectedByQuestion.get(question.id);
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);
      const isCorrect = !!selectedOption?.isCorrect;
      if (isCorrect) score += question.points;
      return {
        attemptId,
        questionId: question.id,
        selectedOptionId: selectedOption?.id ?? null,
        isCorrect,
      };
    });

    await this.prisma.$transaction([
      this.prisma.attemptAnswer.createMany({ data: answerRows }),
      this.prisma.examAttempt.update({
        where: { id: attemptId },
        data: { submittedAt: new Date(), score },
      }),
    ]);

    return {
      score,
      totalPoints: attempt.totalPoints,
      correctCount: answerRows.filter((r) => r.isCorrect).length,
      questionCount: attempt.exam.questions.length,
    };
  }

  listMyAttempts(userId: string) {
    return this.prisma.examAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      include: { exam: { select: { id: true, titleAr: true, titleEn: true } } },
    });
  }

  async getAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: { select: { id: true, titleAr: true, titleEn: true } },
        answers: { include: { question: true, selectedOption: true } },
      },
    });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Attempt not found');
    return attempt;
  }

  // ---- Content-admin (role-gated in the controller) ----

  listAllForAdmin() {
    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true, attempts: true } } },
    });
  }

  async getForAdmin(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    return exam;
  }

  createExam(authorId: string, dto: CreateExamDto) {
    return this.prisma.exam.create({ data: { ...dto, authorId } });
  }

  async updateExam(id: string, dto: UpdateExamDto) {
    await this.getForAdmin(id);
    return this.prisma.exam.update({ where: { id }, data: dto });
  }

  async createQuestion(examId: string, dto: CreateQuestionDto) {
    await this.getForAdmin(examId);
    const correctCount = dto.options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      throw new BadRequestException('Exactly one option must be marked correct');
    }

    return this.prisma.question.create({
      data: {
        examId,
        textAr: dto.textAr,
        textEn: dto.textEn,
        order: dto.order,
        points: dto.points ?? 1,
        options: { create: dto.options },
      },
      include: { options: true },
    });
  }

  async updateQuestion(questionId: string, dto: UpdateQuestionDto) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');
    return this.prisma.question.update({ where: { id: questionId }, data: dto });
  }

  async deleteQuestion(questionId: string) {
    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException('Question not found');
    await this.prisma.question.delete({ where: { id: questionId } });
  }
}
