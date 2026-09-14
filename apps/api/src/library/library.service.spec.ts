import { NotFoundException } from '@nestjs/common';
import { LibraryService } from './library.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LibraryService', () => {
  let service: LibraryService;
  let prisma: {
    book: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      book: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new LibraryService(prisma as unknown as PrismaService);
  });

  describe('getPublished', () => {
    it('throws NotFoundException when no published book matches', async () => {
      prisma.book.findFirst.mockResolvedValue(null);
      await expect(service.getPublished('b1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('never selects fileUrl', async () => {
      prisma.book.findFirst.mockResolvedValue({ id: 'b1', titleAr: 'ك' });
      await service.getPublished('b1');
      const call = prisma.book.findFirst.mock.calls[0][0];
      expect(call.select.fileUrl).toBeUndefined();
      expect(call.where).toEqual({ id: 'b1', published: true });
    });
  });

  describe('getAccess', () => {
    it('throws NotFoundException for a missing book', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.getAccess('b1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFoundException for an unpublished book', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 'b1', published: false, fileUrl: 'x' });
      await expect(service.getAccess('b1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns only the fileUrl for a published book', async () => {
      prisma.book.findUnique.mockResolvedValue({
        id: 'b1',
        published: true,
        fileUrl: 'https://example.com/book.pdf',
      });
      await expect(service.getAccess('b1')).resolves.toEqual({
        fileUrl: 'https://example.com/book.pdf',
      });
    });
  });

  describe('admin CRUD', () => {
    it('createBook attaches the given addedById', async () => {
      prisma.book.create.mockResolvedValue({ id: 'b1' });
      const dto = {
        titleAr: 'ك',
        titleEn: 'b',
        authorName: 'a',
        descriptionAr: 'وصف',
        descriptionEn: 'desc',
        disciplineTag: 'electrical',
        fileUrl: 'https://example.com/book.pdf',
      };

      await service.createBook('admin1', dto);

      expect(prisma.book.create).toHaveBeenCalledWith({ data: { ...dto, addedById: 'admin1' } });
    });

    it('updateBook throws NotFoundException for a missing book', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.updateBook('missing', { published: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.book.update).not.toHaveBeenCalled();
    });

    it('deleteBook throws NotFoundException for a missing book', async () => {
      prisma.book.findUnique.mockResolvedValue(null);
      await expect(service.deleteBook('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.book.delete).not.toHaveBeenCalled();
    });

    it('deleteBook removes an existing book', async () => {
      prisma.book.findUnique.mockResolvedValue({ id: 'b1' });
      prisma.book.delete.mockResolvedValue({ id: 'b1' });

      await service.deleteBook('b1');

      expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });
  });
});
