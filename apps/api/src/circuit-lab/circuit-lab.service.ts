import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildStarterVlxContent } from './starter-project';
import type { UpdateProjectDto } from './dto/update-project.dto';
import {
  ISE_ANALYSIS_PROVIDER,
  type IseAnalysisProvider,
  type IseAnalysisResult,
} from './ise-analysis/ise-analysis-provider.interface';

const SESSION_TOKEN_TTL = '1h';

@Injectable()
export class CircuitLabService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(ISE_ANALYSIS_PROVIDER) private readonly iseAnalysis: IseAnalysisProvider,
  ) {}

  listMine(ownerId: string) {
    return this.prisma.circuitProject.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, thumbnailUrl: true, updatedAt: true },
    });
  }

  async create(ownerId: string, name?: string) {
    const projectName = name?.trim() || 'مشروع دائرة جديد';
    return this.prisma.circuitProject.create({
      data: { ownerId, name: projectName, vlxContent: buildStarterVlxContent(projectName) },
    });
  }

  async findOneOwned(id: string, ownerId: string) {
    const project = await this.prisma.circuitProject.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Circuit project not found');
    if (project.ownerId !== ownerId) throw new ForbiddenException();
    return project;
  }

  async update(id: string, ownerId: string, dto: UpdateProjectDto) {
    await this.findOneOwned(id, ownerId);
    return this.prisma.circuitProject.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.vlxContent !== undefined
          ? { vlxContent: dto.vlxContent as Prisma.InputJsonValue }
          : {}),
        version: { increment: 1 },
      },
    });
  }

  /**
   * Short-lived token the Lab page appends to the simulator iframe's URL
   * (`?enguvers_token=`). The simulator's backend overlay
   * (bridge-overlay/backend/pro) decodes it — same secret as the app's
   * own JwtModule — to attribute compiles to this user. Deliberately NOT
   * the user's regular (7-day) session token: scoped narrowly and short
   * so a leaked iframe URL doesn't hand out a long-lived credential.
   */
  async issueSessionToken(projectId: string, ownerId: string) {
    await this.findOneOwned(projectId, ownerId);
    return {
      token: this.jwt.sign(
        { sub: ownerId, projectId, scope: 'simulator' },
        { expiresIn: SESSION_TOKEN_TTL },
      ),
    };
  }

  /**
   * Gated behind the `ise.analysis` entitlement at the controller — see
   * ise-analysis/ise-analysis-provider.interface.ts. Delegates entirely to
   * the injected provider, which is UnavailableIseAnalysisProvider until
   * Phase 4 wires up a real one.
   */
  async explainProject(id: string, ownerId: string): Promise<IseAnalysisResult> {
    const project = await this.findOneOwned(id, ownerId);
    return this.iseAnalysis.explainProject(project.vlxContent);
  }
}
