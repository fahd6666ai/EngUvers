import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamsService', () => {
  let service: ExamsService;
  let prisma: {
    exam: { findFirst: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock };
    question: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
    examAttempt: { create: jest.Mock; findUnique: jest.Mock; findMany: jest.Mock; update: jest.Mock };
    attemptAnswer: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      exam: { findFirst: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      question: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
      examAttempt: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
      attemptAnswer: { createMany: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    service = new ExamsService(prisma as unknown as PrismaService);
  });

  describe('getPublished', () => {
    it('throws NotFoundException when no published exam matches', async () => {
      prisma.exam.findFirst.mockResolvedValue(null);
      await expect(service.getPublished('e1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('startAttempt', () => {
    it('throws NotFoundException for an unpublished exam', async () => {
      prisma.exam.findUnique.mockResolvedValue({ id: 'e1', published: false, questions: [] });
      await expect(service.startAttempt('e1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException for a published exam with no questions', async () => {
      prisma.exam.findUnique.mockResolvedValue({ id: 'e1', published: true, questions: [] });
      await expect(service.startAttempt('e1', 'u1')).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.examAttempt.create).not.toHaveBeenCalled();
    });

    it('snapshots totalPoints and strips isCorrect from the returned options', async () => {
      prisma.exam.findUnique.mockResolvedValue({
        id: 'e1',
        titleAr: 'أ',
        titleEn: 'e',
        published: true,
        questions: [
          {
            id: 'q1',
            textAr: 'س',
            textEn: 'q',
            order: 1,
            points: 2,
            options: [
              { id: 'o1', textAr: 'أ', textEn: 'a', order: 1, isCorrect: true },
              { id: 'o2', textAr: 'ب', textEn: 'b', order: 2, isCorrect: false },
            ],
          },
          {
            id: 'q2',
            textAr: 'س٢',
            textEn: 'q2',
            order: 2,
            points: 3,
            options: [{ id: 'o3', textAr: 'ج', textEn: 'c', order: 1, isCorrect: true }],
          },
        ],
      });
      prisma.examAttempt.create.mockResolvedValue({ id: 'attempt1' });

      const result = await service.startAttempt('e1', 'u1');

      expect(prisma.examAttempt.create).toHaveBeenCalledWith({
        data: { examId: 'e1', userId: 'u1', totalPoints: 5 },
      });
      expect(result.attemptId).toBe('attempt1');
      expect(result.questions[0]?.options[0]).not.toHaveProperty('isCorrect');
    });
  });

  describe('submitAttempt', () => {
    const baseAttempt = {
      id: 'attempt1',
      userId: 'u1',
      submittedAt: null,
      totalPoints: 3,
      exam: {
        questions: [
          {
            id: 'q1',
            points: 2,
            options: [
              { id: 'o1', isCorrect: true },
              { id: 'o2', isCorrect: false },
            ],
          },
          {
            id: 'q2',
            points: 1,
            options: [
              { id: 'o3', isCorrect: false },
              { id: 'o4', isCorrect: true },
            ],
          },
        ],
      },
    };

    it('throws NotFoundException when the attempt does not belong to the caller', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({ ...baseAttempt, userId: 'someone-else' });
      await expect(
        service.submitAttempt('attempt1', 'u1', { answers: [] }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException when the attempt was already submitted', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue({ ...baseAttempt, submittedAt: new Date() });
      await expect(
        service.submitAttempt('attempt1', 'u1', { answers: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.attemptAnswer.createMany).not.toHaveBeenCalled();
    });

    it('scores only correct answers and ignores missing ones', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue(baseAttempt);

      const result = await service.submitAttempt('attempt1', 'u1', {
        answers: [{ questionId: 'q1', selectedOptionId: 'o1' }],
        // q2 left unanswered
      } as never);

      expect(result).toEqual({ score: 2, totalPoints: 3, correctCount: 1, questionCount: 2 });
      expect(prisma.attemptAnswer.createMany).toHaveBeenCalledWith({
        data: [
          { attemptId: 'attempt1', questionId: 'q1', selectedOptionId: 'o1', isCorrect: true },
          { attemptId: 'attempt1', questionId: 'q2', selectedOptionId: null, isCorrect: false },
        ],
      });
    });

    it('does not credit an option id that belongs to a different question', async () => {
      prisma.examAttempt.findUnique.mockResolvedValue(baseAttempt);

      // o4 is the correct option for q2, submitted against q1 instead.
      const result = await service.submitAttempt('attempt1', 'u1', {
        answers: [{ questionId: 'q1', selectedOptionId: 'o4' }],
      } as never);

      expect(result.score).toBe(0);
      expect(result.correctCount).toBe(0);
    });
  });

  describe('createQuestion', () => {
    it('throws BadRequestException when zero options are marked correct', async () => {
      prisma.exam.findUnique.mockResolvedValue({ id: 'e1', questions: [] });
      await expect(
        service.createQuestion('e1', {
          textAr: 'س',
          textEn: 'q',
          order: 1,
          options: [
            { textAr: 'أ', textEn: 'a', isCorrect: false, order: 1 },
            { textAr: 'ب', textEn: 'b', isCorrect: false, order: 2 },
          ],
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when more than one option is marked correct', async () => {
      prisma.exam.findUnique.mockResolvedValue({ id: 'e1', questions: [] });
      await expect(
        service.createQuestion('e1', {
          textAr: 'س',
          textEn: 'q',
          order: 1,
          options: [
            { textAr: 'أ', textEn: 'a', isCorrect: true, order: 1 },
            { textAr: 'ب', textEn: 'b', isCorrect: true, order: 2 },
          ],
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates the question with nested options when exactly one is correct', async () => {
      prisma.exam.findUnique.mockResolvedValue({ id: 'e1', questions: [] });
      prisma.question.create.mockResolvedValue({ id: 'q1' });
      const options = [
        { textAr: 'أ', textEn: 'a', isCorrect: true, order: 1 },
        { textAr: 'ب', textEn: 'b', isCorrect: false, order: 2 },
      ];

      await service.createQuestion('e1', { textAr: 'س', textEn: 'q', order: 1, options } as never);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: {
          examId: 'e1',
          textAr: 'س',
          textEn: 'q',
          order: 1,
          points: 1,
          options: { create: options },
        },
        include: { options: true },
      });
    });
  });

  describe('deleteQuestion', () => {
    it('throws NotFoundException for a missing question', async () => {
      prisma.question.findUnique.mockResolvedValue(null);
      await expect(service.deleteQuestion('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.question.delete).not.toHaveBeenCalled();
    });
  });
});
