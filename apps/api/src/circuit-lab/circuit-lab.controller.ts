import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RequireEntitlement } from '../common/decorators/require-entitlement.decorator';
import { EntitlementsGuard } from '../common/guards/entitlements.guard';
import { CircuitLabService } from './circuit-lab.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('circuit-projects')
export class CircuitLabController {
  constructor(private readonly circuitLabService: CircuitLabService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.circuitLabService.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.circuitLabService.create(user.id, dto.name);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.circuitLabService.findOneOwned(id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.circuitLabService.update(id, user.id, dto);
  }

  @Post(':id/session-token')
  issueSessionToken(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.circuitLabService.issueSessionToken(id, user.id);
  }

  @UseGuards(EntitlementsGuard)
  @RequireEntitlement('ise.analysis')
  @Post(':id/explain')
  explainProject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.circuitLabService.explainProject(id, user.id);
  }
}
