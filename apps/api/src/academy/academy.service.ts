import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCourseDto } from './dto/create-course.dto';
import type { UpdateCourseDto } from './dto/update-course.dto';
import type { CreateLessonDto } from './dto/create-lesson.dto';
import type { UpdateLessonDto } from './dto/update-lesson.dto';

const LESSON_SELECT = {
  id: true,
  titleAr: true,
  titleEn: true,
  contentType: true,
  videoUrl: true,
  bodyAr: true,
  bodyEn: true,
  order: true,
  durationMinutes: true,
} as const;

@Injectable()
export class AcademyService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Student-facing (public catalog + enrollment) ----

  listPublished(disciplineTag?: string) {
    return this.prisma.course.findMany({
      where: { published: true, ...(disciplineTag ? { disciplineTag } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        summaryAr: true,
        summaryEn: true,
        disciplineTag: true,
        level: true,
        _count: { select: { lessons: true } },
      },
    });
  }

  async getPublished(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { lessons: { select: LESSON_SELECT, orderBy: { order: 'asc' } } },
    });
    if (!course || !course.published) throw new NotFoundException('Course not found');
    return course;
  }

  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course || !course.published) throw new NotFoundException('Course not found');

    return this.prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });
  }

  async getMyProgress(courseId: string, userId: string) {
    const [enrollment, completions] = await Promise.all([
      this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }),
      this.prisma.lessonCompletion.findMany({
        where: { userId, lesson: { courseId } },
        select: { lessonId: true },
      }),
    ]);
    return {
      enrolled: !!enrollment,
      completedAt: enrollment?.completedAt ?? null,
      completedLessonIds: completions.map((c) => c.lessonId),
    };
  }

  listMyEnrollments(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
          select: { id: true, titleAr: true, titleEn: true, disciplineTag: true, level: true },
        },
      },
    });
  }

  /**
   * Marks one lesson complete for the user, then checks whether every
   * lesson in its course now has a completion row for them — if so, stamps
   * CourseEnrollment.completedAt. A course is "complete" purely by lesson
   * coverage; EE (exams) is a separate phase and isn't a completion
   * gate here.
   */
  async completeLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });
    if (!lesson || !lesson.course.published) throw new NotFoundException('Lesson not found');

    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
    });
    if (!enrollment) {
      throw new BadRequestException('Enroll in the course before completing its lessons');
    }

    await this.prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: {},
      create: { userId, lessonId },
    });

    const [lessonCount, completionCount] = await Promise.all([
      this.prisma.lesson.count({ where: { courseId: lesson.courseId } }),
      this.prisma.lessonCompletion.count({
        where: { userId, lesson: { courseId: lesson.courseId } },
      }),
    ]);

    if (completionCount >= lessonCount && !enrollment.completedAt) {
      await this.prisma.courseEnrollment.update({
        where: { userId_courseId: { userId, courseId: lesson.courseId } },
        data: { completedAt: new Date() },
      });
    }

    return { lessonId, completed: true };
  }

  // ---- Content-admin (role-gated in the controller) ----

  listAllForAdmin() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { lessons: true, enrollments: true } } },
    });
  }

  async getForAdmin(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { lessons: { orderBy: { order: 'asc' } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  createCourse(authorId: string, dto: CreateCourseDto) {
    return this.prisma.course.create({ data: { ...dto, authorId } });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    await this.getForAdmin(id);
    return this.prisma.course.update({ where: { id }, data: dto });
  }

  async createLesson(courseId: string, dto: CreateLessonDto) {
    await this.getForAdmin(courseId);
    return this.prisma.lesson.create({ data: { ...dto, courseId } });
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.prisma.lesson.update({ where: { id: lessonId }, data: dto });
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.prisma.lesson.delete({ where: { id: lessonId } });
  }
}
