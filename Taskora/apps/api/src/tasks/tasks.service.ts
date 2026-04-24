import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

type LogAction =
    | 'TASK_CREATED'
    | 'TASK_UPDATED'
    | 'TASK_DELETED'
    | 'TASK_RESTORED';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: PrismaService) { }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private async log(
        actorId: string,
        orgId: string,
        action: LogAction,
        entityId: string,
        metadata?: Record<string, unknown>,
    ) {
        try {
            await this.prisma.activityLog.create({
                data: {
                    // FIX: 'actorId' is not a direct field — the relation is
                    // stored via 'userId' (the FK that Prisma generates from
                    // the User relation on ActivityLog). Use 'userId' here.
                    userId: actorId,
                    organizationId: orgId,
                    action,
                    entityType: 'TASK',
                    entityId,
                    // FIX: cast to 'any' — avoids Prisma.InputJsonValue which
                    // is not exported by this version of the Prisma client.
                    metadata: (metadata ?? {}) as any,
                },
            });
        } catch (err) {
            console.error('[TasksService] Failed to write activity log', err);
        }
    }

    private async resolveMembership(user: any, orgId: string) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: user.id, organizationId: orgId },
        });
        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this organization',
            );
        }
        return membership;
    }

    private async resolveTask(id: string, orgId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId, deletedAt: null },
            include: { createdBy: { select: { id: true, name: true } } },
        });
        if (!task) throw new NotFoundException(`Task ${id} not found`);
        return task;
    }

    private async resolveDeletedTask(id: string, orgId: string) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId, deletedAt: { not: null } },
            include: { createdBy: { select: { id: true, name: true } } },
        });
        if (!task) {
            throw new NotFoundException(
                `Deleted task ${id} not found in trash`,
            );
        }
        return task;
    }

    // ─── CREATE ─────────────────────────────────────────────────────────────

    async create(user: any, orgId: string, dto: CreateTaskDto) {
        await this.resolveMembership(user, orgId);

        const task = await this.prisma.task.create({
            data: { ...dto, organizationId: orgId, createdById: user.id },
            include: { createdBy: { select: { id: true, name: true } } },
        });

        await this.log(user.id, orgId, 'TASK_CREATED', task.id, {
            title: task.title,
        });

        return task;
    }

    // ─── LIST ───────────────────────────────────────────────────────────────

    async findAll(
        user: any,
        orgId: string,
        cursor?: string,
        limit = 5,
        status?: string,
        search?: string,
        sort?: string,
    ) {
        await this.resolveMembership(user, orgId);

        // FIX: type the where clause as 'any' — avoids Prisma.TaskWhereInput
        // which is not exported in this version of the Prisma client.
        const where: any = {
            organizationId: orgId,
            deletedAt: null,
        };

        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // FIX: type orderBy as 'any' — avoids Prisma.TaskOrderByWithRelationInput
        // which is not exported in this version of the Prisma client.
        const orderBy: any =
            sort === 'oldest'
                ? { createdAt: 'asc' }
                : { createdAt: 'desc' };

        const tasks = await this.prisma.task.findMany({
            where,
            orderBy,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: { createdBy: { select: { id: true, name: true } } },
        });

        const hasMore = tasks.length > limit;
        const data = hasMore ? tasks.slice(0, limit) : tasks;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        return { data, nextCursor, hasMore };
    }

    // ─── TRASH LIST ─────────────────────────────────────────────────────────

    async trash(user: any, orgId: string) {
        await this.resolveMembership(user, orgId);

        const tasks = await this.prisma.task.findMany({
            where: { organizationId: orgId, deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' },
            include: { createdBy: { select: { id: true, name: true } } },
        });

        return { data: tasks, total: tasks.length };
    }

    // ─── FIND ONE ───────────────────────────────────────────────────────────

    async findOne(user: any, orgId: string, id: string) {
        await this.resolveMembership(user, orgId);
        return this.resolveTask(id, orgId);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────────────

    async update(user: any, orgId: string, id: string, dto: UpdateTaskDto) {
        await this.resolveMembership(user, orgId);
        await this.resolveTask(id, orgId);

        const task = await this.prisma.task.update({
            where: { id },
            data: dto,
            include: { createdBy: { select: { id: true, name: true } } },
        });

        await this.log(user.id, orgId, 'TASK_UPDATED', task.id, {
            title: task.title,
            changes: Object.keys(dto),
        });

        return task;
    }

    // ─── SOFT DELETE ────────────────────────────────────────────────────────

    async remove(id: string, orgId: string, user: any) {
        await this.resolveMembership(user, orgId);
        const existing = await this.resolveTask(id, orgId);

        const task = await this.prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        await this.log(user.id, orgId, 'TASK_DELETED', task.id, {
            title: existing.title,
        });

        return { success: true, id: task.id };
    }

    // ─── RESTORE ────────────────────────────────────────────────────────────

    async restore(user: any, orgId: string, id: string) {
        await this.resolveMembership(user, orgId);
        const existing = await this.resolveDeletedTask(id, orgId);

        const task = await this.prisma.task.update({
            where: { id },
            data: { deletedAt: null },
            include: { createdBy: { select: { id: true, name: true } } },
        });

        await this.log(user.id, orgId, 'TASK_RESTORED', task.id, {
            title: existing.title,
        });

        return task;
    }

    // ─── PURGE (hard delete) ─────────────────────────────────────────────────

    async purge(user: any, orgId: string, id: string) {
        await this.resolveMembership(user, orgId);

        const task = await this.prisma.task.findFirst({
            where: { id, organizationId: orgId },
        });
        if (!task) throw new NotFoundException(`Task ${id} not found`);

        await this.prisma.task.delete({ where: { id } });

        await this.log(user.id, orgId, 'TASK_DELETED', id, {
            title: task.title,
            purged: true,
        });

        return { success: true, id };
    }
}
