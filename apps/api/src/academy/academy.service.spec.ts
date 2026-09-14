import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AcademyService', () => {
  let service: AcademyService;
  let prisma: {
    course: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
    lesson: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock; count: jest.Mock };
    courseEnrollment: { upsert: jest.Mock; findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock };
    lessonCompletion: { upsert: jest.Mock; count: jest.Mock; findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      course: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      lesson: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      courseEnrollment: { upsert: jest.fn(), findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      lessonCompletion: { upsert: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    };
    service = new AcademyService(prisma as unknown as PrismaService);
  });

  describe('getPublished', () => {
    it('throws NotFoundException for a missing course', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(service.getPublished('c1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an unpublished course', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', published: false });
      await expect(service.getPublished('c1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('enroll', () => {
    it('throws NotFoundException for an unpublished course', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', published: false });
      await expect(service.enroll('c1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.courseEnrollment.upsert).not.toHaveBeenCalled();
    });

    it('upserts an enrollment for a published course', async () => {
      prisma.course.findUnique.mockResolvedValue({ id: 'c1', published: true });
      prisma.courseEnrollment.upsert.mockResolvedValue({ id: 'e1' });

      await service.enroll('c1', 'u1');

      expect(prisma.courseEnrollment.upsert).toHaveBeenCalledWith({
        where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
        update: {},
        create: { userId: 'u1', courseId: 'c1' },
      });
    });
  });

  describe('completeLesson', () => {
    it('throws NotFoundException for a lesson on an unpublished course', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        courseId: 'c1',
        course: { published: false },
      });
      await expect(service.completeLesson('l1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the user is not enrolled', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        courseId: 'c1',
        course: { published: true },
      });
      prisma.courseEnrollment.findUnique.mockResolvedValue(null);

      await expect(service.completeLesson('l1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.lessonCompletion.upsert).not.toHaveBeenCalled();
    });

    it('marks the lesson complete without touching the enrollment when other lessons remain', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l1',
        courseId: 'c1',
        course: { published: true },
      });
      prisma.courseEnrollment.findUnique.mockResolvedValue({
        userId: 'u1',
        courseId: 'c1',
        completedAt: null,
      });
      prisma.lesson.count.mockResolvedValue(3);
      prisma.lessonCompletion.count.mockResolvedValue(1);

      await service.completeLesson('l1', 'u1');

      expect(prisma.lessonCompletion.upsert).toHaveBeenCalledWith({
        where: { userId_lessonId: { userId: 'u1', lessonId: 'l1' } },
        update: {},
        create: { userId: 'u1', lessonId: 'l1' },
      });
      expect(prisma.courseEnrollment.update).not.toHaveBeenCalled();
    });

    it('stamps the enrollment completedAt once every lesson is completed', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l3',
        courseId: 'c1',
        course: { published: true },
      });
      prisma.courseEnrollment.findUnique.mockResolvedValue({
        userId: 'u1',
        courseId: 'c1',
        completedAt: null,
      });
      prisma.lesson.count.mockResolvedValue(3);
      prisma.lessonCompletion.count.mockResolvedValue(3);

      await service.completeLesson('l3', 'u1');

      expect(prisma.courseEnrollment.update).toHaveBeenCalledWith({
        where: { userId_courseId: { userId: 'u1', courseId: 'c1' } },
        data: { completedAt: expect.any(Date) },
      });
    });

    it('does not re-stamp an already-completed enrollment', async () => {
      prisma.lesson.findUnique.mockResolvedValue({
        id: 'l3',
        courseId: 'c1',
        course: { published: true },
      });
      prisma.courseEnrollment.findUnique.mockResolvedValue({
        userId: 'u1',
        courseId: 'c1',
        completedAt: new Date('2026-01-01'),
      });
      prisma.lesson.count.mockResolvedValue(3);
      prisma.lessonCompletion.count.mockResolvedValue(3);

      await service.completeLesson('l3', 'u1');

      expect(prisma.courseEnrollment.update).not.toHaveBeenCalled();
    });
  });

  describe('getMyProgress', () => {
    it('reports not enrolled with no completions for a stranger', async () => {
      prisma.courseEnrollment.findUnique.mockResolvedValue(null);
      prisma.lessonCompletion.findMany.mockResolvedValue([]);

      await expect(service.getMyProgress('c1', 'u1')).resolves.toEqual({
        enrolled: false,
        completedAt: null,
        completedLessonIds: [],
      });
    });

    it('reports enrolled with completed lesson ids', async () => {
      prisma.courseEnrollment.findUnique.mockResolvedValue({ completedAt: null });
      prisma.lessonCompletion.findMany.mockResolvedValue([{ lessonId: 'l1' }, { lessonId: 'l2' }]);

      await expect(service.getMyProgress('c1', 'u1')).resolves.toEqual({
        enrolled: true,
        completedAt: null,
        completedLessonIds: ['l1', 'l2'],
      });
    });
  });

  describe('admin CRUD', () => {
    it('createCourse attaches the given authorId', async () => {
      prisma.course.create.mockResolvedValue({ id: 'c1' });
      const dto = {
        titleAr: 'أ',
        titleEn: 'a',
        summaryAr: 'ا',
        summaryEn: 'b',
        disciplineTag: 'electrical',
        level: 'beginner' as const,
      };

      await service.createCourse('author1', dto);

      expect(prisma.course.create).toHaveBeenCalledWith({ data: { ...dto, authorId: 'author1' } });
    });

    it('updateCourse throws NotFoundException for a missing course', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(service.updateCourse('missing', { published: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('createLesson throws NotFoundException for a missing course', async () => {
      prisma.course.findUnique.mockResolvedValue(null);
      await expect(
        service.createLesson('missing', {
          titleAr: 'أ',
          titleEn: 'a',
          contentType: 'article',
          order: 1,
        } as never),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deleteLesson throws NotFoundException for a missing lesson', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);
      await expect(service.deleteLesson('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.lesson.delete).not.toHaveBeenCalled();
    });
  });
});
