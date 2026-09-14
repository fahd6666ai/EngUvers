import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { LibraryService } from '../library.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

/**
 * Content-admin panel backend for the book catalog — same role-gated
 * shape as academy/admin/academy-admin.controller.ts. No per-book
 * ownership check yet, same known gap as the academy admin panel.
 */
@UseGuards(RolesGuard)
@Roles('admin', 'instructor')
@Controller('admin/library')
export class LibraryAdminController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  listBooks() {
    return this.libraryService.listAllForAdmin();
  }

  @Get('books/:id')
  getBook(@Param('id') id: string) {
    return this.libraryService.getForAdmin(id);
  }

  @Post('books')
  createBook(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBookDto) {
    return this.libraryService.createBook(user.id, dto);
  }

  @Patch('books/:id')
  updateBook(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.libraryService.updateBook(id, dto);
  }

  @Delete('books/:id')
  deleteBook(@Param('id') id: string) {
    return this.libraryService.deleteBook(id);
  }
}
