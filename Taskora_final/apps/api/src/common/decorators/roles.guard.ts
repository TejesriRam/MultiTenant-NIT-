import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const requiredRoles =
            this.reflector.getAllAndOverride<string[]>(
                ROLES_KEY,
                [
                    context.getHandler(),
                    context.getClass(),
                ],
            );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context
            .switchToHttp()
            .getRequest();

        const user = request.user;
        const organizationId =
            request.headers['x-org-id'];

        if (!organizationId) {
            throw new BadRequestException(
                'x-org-id header is required',
            );
        }

        const membership =
            await this.prisma.membership.findUnique({
                where: {
                    userId_organizationId: {
                        userId: user.id,
                        organizationId,
                    },
                },
            });

        if (!membership) {
            throw new ForbiddenException(
                'Not a member of this organization',
            );
        }

        const allowed = requiredRoles.includes(
            membership.role,
        );

        if (!allowed) {
            throw new ForbiddenException(
                'Insufficient permissions',
            );
        }

        request.membership = membership;

        return true;
    }
}