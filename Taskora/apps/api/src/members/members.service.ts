import {
    Injectable,
    ForbiddenException,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@task-management/db';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MembersService {
    constructor(private prisma: PrismaService) { }

    private async getMyMembership(
        userId: string,
        organizationId: string,
    ) {
        const membership =
            await this.prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId,
                        organizationId,
                    },
                },
            });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this organization',
            );
        }

        return membership;
    }

    private ensureAdminOrOwner(role: string) {
        if (
            role !== 'OWNER' &&
            role !== 'ADMIN'
        ) {
            throw new ForbiddenException(
                'Only admin or owner allowed',
            );
        }
    }

    async findAll(
        user: any,
        organizationId: string,
    ) {
        const me = await this.getMyMembership(
            user.id,
            organizationId,
        );

        this.ensureAdminOrOwner(me.role);

        return this.prisma.membership.findMany({
            where: { organizationId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    async addMember(
        user: any,
        organizationId: string,
        email: string,
        role: Role = Role.MEMBER,
    ) {
        const me = await this.getMyMembership(
            user.id,
            organizationId,
        );

        this.ensureAdminOrOwner(me.role);

        if (
            role === 'OWNER' &&
            me.role !== 'OWNER'
        ) {
            throw new ForbiddenException(
                'Only owner can assign owner role',
            );
        }

        const targetUser =
            await this.prisma.user.findUnique({
                where: { email },
            });

        if (!targetUser) {
            throw new NotFoundException(
                'User not found',
            );
        }

        const existing =
            await this.prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: targetUser.id,
                        organizationId,
                    },
                },
            });

        if (existing) {
            throw new ConflictException(
                'User already belongs to this organization',
            );
        }

        return this.prisma.membership.create({
            data: {
                userId: targetUser.id,
                organizationId,
                role,
            },
        });
    }

    async updateRole(
        user: any,
        organizationId: string,
        membershipId: string,
        role: Role,
    ) {
        const me = await this.getMyMembership(
            user.id,
            organizationId,
        );

        const target =
            await this.prisma.membership.findFirst({
                where: {
                    id: membershipId,
                    organizationId,
                },
            });

        if (!target) {
            throw new NotFoundException(
                'Membership not found',
            );
        }

        if (me.role === 'MEMBER') {
            throw new ForbiddenException(
                'Insufficient permissions',
            );
        }

        if (
            me.role === 'ADMIN' &&
            (role === 'OWNER' ||
                target.role === 'OWNER' ||
                target.role === 'ADMIN')
        ) {
            throw new ForbiddenException(
                'Admin cannot manage owner/admin roles',
            );
        }

        if (
            me.role === 'OWNER' &&
            target.userId === user.id &&
            role !== 'OWNER'
        ) {
            throw new ForbiddenException(
                'Owner cannot demote self',
            );
        }

        return this.prisma.membership.update({
            where: { id: membershipId },
            data: { role },
        });
    }

    async removeMember(
        user: any,
        organizationId: string,
        membershipId: string,
    ) {
        const me = await this.getMyMembership(
            user.id,
            organizationId,
        );

        const target =
            await this.prisma.membership.findFirst({
                where: {
                    id: membershipId,
                    organizationId,
                },
            });

        if (!target) {
            throw new NotFoundException(
                'Membership not found',
            );
        }

        if (me.role === 'MEMBER') {
            throw new ForbiddenException(
                'Insufficient permissions',
            );
        }

        if (
            me.role === 'ADMIN' &&
            (target.role === 'OWNER' ||
                target.role === 'ADMIN')
        ) {
            throw new ForbiddenException(
                'Admin cannot remove owner/admin',
            );
        }

        if (
            me.role === 'OWNER' &&
            target.userId === user.id
        ) {
            throw new ForbiddenException(
                'Owner cannot remove self',
            );
        }

        return this.prisma.membership.delete({
            where: { id: membershipId },
        });
    }

    async createMember(
        caller: any,
        organizationId: string,
        name: string,
        email: string,
        password: string,
        role: 'ADMIN' | 'MEMBER' = 'MEMBER',
    ) {
        // 1. Caller must belong to org and be OWNER or ADMIN
        const me = await this.getMyMembership(caller.id, organizationId);
        this.ensureAdminOrOwner(me.role);

        // 2. Only OWNER can promote someone straight to ADMIN
        if (role === 'ADMIN' && me.role !== 'OWNER') {
            throw new ForbiddenException('Only the owner can assign the ADMIN role');
        }

        // 3. Email must be globally unique (user table)
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new ConflictException('A user with this email already exists');
        }

        // 4. Hash password using the same cost factor as AuthService
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Atomically create User + Membership
        return this.prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { name, email, password: hashedPassword },
            });

            const membership = await tx.membership.create({
                data: { userId: user.id, organizationId, role },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            });

            return membership;
        });
    }
}