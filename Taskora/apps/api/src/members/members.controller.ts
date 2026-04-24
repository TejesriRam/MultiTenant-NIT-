import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    Headers,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MembersService } from './members.service';

@Controller('members')
@UseGuards(AuthGuard('jwt'))
export class MembersController {
    constructor(
        private readonly membersService: MembersService,
    ) { }

    private getOrganizationId(
        organizationId?: string,
    ) {
        if (!organizationId) {
            throw new BadRequestException(
                'x-org-id header is required',
            );
        }

        return organizationId;
    }

    @Get()
    findAll(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
    ) {
        return this.membersService.findAll(
            req.user,
            this.getOrganizationId(orgId),
        );
    }

    // ← Must be BEFORE @Post() to avoid route conflicts
    @Post('create')
    createMember(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Body() body: any,
    ) {
        return this.membersService.createMember(
            req.user,
            this.getOrganizationId(orgId),
            body.name,
            body.email,
            body.password,
            body.role || 'MEMBER',
        );
    }

    @Post()
    addMember(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Body() body: any,
    ) {
        return this.membersService.addMember(
            req.user,
            this.getOrganizationId(orgId),
            body.email,
            body.role || 'MEMBER',
        );
    }

    @Patch(':id/role')
    updateRole(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @Body() body: any,
    ) {
        return this.membersService.updateRole(
            req.user,
            this.getOrganizationId(orgId),
            id,
            body.role,
        );
    }

    @Delete(':id')
    removeMember(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
    ) {
        return this.membersService.removeMember(
            req.user,
            this.getOrganizationId(orgId),
            id,
        );
    }
}
