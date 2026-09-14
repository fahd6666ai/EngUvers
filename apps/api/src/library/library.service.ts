import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateBookDto } from './dto/create-book.dto';
import type { UpdateBookDto } from './dto/update-book.dto';

const CATALOG_SELECT = {
  id: true,
  titleAr: true,
  titleEn: true,
  authorName: true,
  descriptionAr: true,
  descriptionEn: true,
  disciplineTag: true,
  coverImageUrl: true,
} as const;

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Public catalog (fileUrl is never included here — see getAccess) ----

  listPublished(disciplineTag?: string) {
    return this.prisma.book.findMany({
      where: { published: true, ...(disciplineTag ? { disciplineTag } : {}) },
      orderBy: { createdAt: 'desc' },
      select: CATALOG_SELECT,
    });
  }

  async getPublished(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, published: true },
      select: CATALOG_SELECT,
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  /**
   * The entitlement-gated seam: the only place `fileUrl` is ever returned.
   * Mirrors CircuitLabService.issueSessionToken's "gate the resource behind
   * its own endpoint" shape.
   */
  async getAccess(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book || !book.published) throw new NotFoundException('Book not found');
    return { fileUrl: book.fileUrl };
  }

  // ---- Content-admin (role-gated in the controller) ----

  listAllForAdmin() {
    return this.prisma.book.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getForAdmin(id: string) {
    const book = await this.prisma.book.findUnique({ where: { id } });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  createBook(addedById: string, dto: CreateBookDto) {
    return this.prisma.book.create({ data: { ...dto, addedById } });
  }

  async updateBook(id: string, dto: UpdateBookDto) {
    await this.getForAdmin(id);
    return this.prisma.book.update({ where: { id }, data: dto });
  }

  async deleteBook(id: string) {
    await this.getForAdmin(id);
    await this.prisma.book.delete({ where: { id } });
  }
}
