import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(
        user: any,
        orgId: string,
        page = 1,
        limit = 50,
    ) {
        const membership = await this.prisma.membership.findFirst({
            where: { userId: user.id, organizationId: orgId },
        });
        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this organization',
            );
        }

        const skip = (page - 1) * limit;

        const [logs, total] = await this.prisma.$transaction([
            this.prisma.activityLog.findMany({
                where: { organizationId: orgId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                // FIX: use 'user' — the actual Prisma relation name derived
                // from the User model, not 'actor' which is the @relation alias
                include: {
                    user: {
                        select: { id: true, name: true, email: true },
                    },
                },
            }),
            this.prisma.activityLog.count({
                where: { organizationId: orgId },
            }),
        ]);

        const data = logs.map((log) => ({
            ...log,
            actorName:
                log.user?.name ??
                log.user?.email ??
                'Unknown',
        }));

        return { data, total, page, limit };
    }
}
