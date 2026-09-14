import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { LibraryAdminController } from './admin/library-admin.controller';

@Module({
  controllers: [LibraryController, LibraryAdminController],
  providers: [LibraryService],
})
export class LibraryModule {}
