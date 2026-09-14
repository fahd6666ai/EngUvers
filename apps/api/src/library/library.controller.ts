import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { RequireEntitlement } from '../common/decorators/require-entitlement.decorator';
import { EntitlementsGuard } from '../common/guards/entitlements.guard';
import { LibraryService } from './library.service';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Public()
  @Get('books')
  listBooks(@Query('disciplineTag') disciplineTag?: string) {
    return this.libraryService.listPublished(disciplineTag);
  }

  @Public()
  @Get('books/:id')
  getBook(@Param('id') id: string) {
    return this.libraryService.getPublished(id);
  }

  @UseGuards(EntitlementsGuard)
  @RequireEntitlement('library.books')
  @Get('books/:id/access')
  getAccess(@Param('id') id: string) {
    return this.libraryService.getAccess(id);
  }
}
