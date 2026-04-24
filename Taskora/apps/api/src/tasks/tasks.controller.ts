import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Req,
    UseGuards,
    Query,
    Param,
    Headers,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiHeader,
    ApiQuery,
} from '@nestjs/swagger';

import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/decorators/roles.guard';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    private getOrganizationId(organizationId?: string): string {
        if (!organizationId) {
            throw new BadRequestException('x-org-id header is required');
        }
        return organizationId;
    }

    // ─── CREATE ──────────────────────────────────────────────────────────────

    @Post()
    @ApiOperation({ summary: 'Create new task' })
    @ApiHeader({ name: 'x-org-id', required: true })
    create(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Body() body: CreateTaskDto,
    ) {
        return this.tasksService.create(
            req.user,
            this.getOrganizationId(orgId),
            body,
        );
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────
    // IMPORTANT: Static routes (/trash) MUST be declared before dynamic routes
    // (/:id) so NestJS does not treat "trash" as an :id param.

    @Get()
    @ApiOperation({
        summary: 'Get tasks with pagination, search, filter and sorting',
    })
    @ApiHeader({ name: 'x-org-id', required: true })
    @ApiQuery({ name: 'cursor', required: false, example: 'task-id' })
    @ApiQuery({ name: 'limit', required: false, example: 5 })
    @ApiQuery({ name: 'search', required: false, example: 'report' })
    @ApiQuery({ name: 'status', required: false, example: 'TODO' })
    @ApiQuery({ name: 'sort', required: false, example: 'newest' })
    findAll(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Query('cursor') cursor?: string,
        @Query('limit') limit?: string,
        @Query('search') search?: string,
        @Query('status') status?: string,
        @Query('sort') sort?: string,
    ) {
        return this.tasksService.findAll(
            req.user,
            this.getOrganizationId(orgId),
            cursor,
            Number(limit) || 5,
            status,
            search,
            sort,
        );
    }

    // ─── TRASH LIST ───────────────────────────────────────────────────────────
    // Static path — MUST come before @Get(':id')

    @Get('trash')
    @ApiOperation({ summary: 'Get soft-deleted tasks' })
    @ApiHeader({ name: 'x-org-id', required: true })
    trash(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
    ) {
        return this.tasksService.trash(
            req.user,
            this.getOrganizationId(orgId),
        );
    }

    // ─── SINGLE TASK ──────────────────────────────────────────────────────────
    // Dynamic path — MUST come after all static @Get paths

    @Get(':id')
    @ApiOperation({ summary: 'Get task by id' })
    @ApiHeader({ name: 'x-org-id', required: true })
    findOne(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
    ) {
        return this.tasksService.findOne(
            req.user,
            this.getOrganizationId(orgId),
            id,
        );
    }

    // ─── RESTORE ──────────────────────────────────────────────────────────────
    // Sub-resource path (:id/restore) — MUST come before generic @Patch(':id')

    @Patch(':id/restore')
    @ApiOperation({ summary: 'Restore a soft-deleted task' })
    @ApiHeader({ name: 'x-org-id', required: true })
    restore(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
    ) {
        return this.tasksService.restore(
            req.user,
            this.getOrganizationId(orgId),
            id,
        );
    }

    // ─── UPDATE ───────────────────────────────────────────────────────────────

    @Patch(':id')
    @ApiOperation({ summary: 'Update task' })
    @ApiHeader({ name: 'x-org-id', required: true })
    update(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
        @Body() body: UpdateTaskDto,
    ) {
        return this.tasksService.update(
            req.user,
            this.getOrganizationId(orgId),
            id,
            body,
        );
    }

    // ─── PURGE (hard delete) ──────────────────────────────────────────────────
    // Sub-resource path (:id/purge) — MUST come before generic @Delete(':id')

    @Delete(':id/purge')
    @Roles('OWNER', 'ADMIN')
    @ApiOperation({ summary: 'Permanently delete task (Admin / Owner)' })
    @ApiHeader({ name: 'x-org-id', required: true })
    purge(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
    ) {
        return this.tasksService.purge(
            req.user,
            this.getOrganizationId(orgId),
            id,
        );
    }

    // ─── SOFT DELETE ─────────────────────────────────────────────────────────

    @Delete(':id')
    @ApiOperation({ summary: 'Soft delete task (moves to Trash)' })
    @ApiHeader({ name: 'x-org-id', required: true })
    remove(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Param('id') id: string,
    ) {
        return this.tasksService.remove(
            id,
            this.getOrganizationId(orgId),
            req.user,
        );
    }
}
