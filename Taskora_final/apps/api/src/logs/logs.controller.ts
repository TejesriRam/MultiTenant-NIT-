import {
    Controller,
    Get,
    Headers,
    Query,
    Req,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogsService } from './logs.service';
import {
    ApiBearerAuth,
    ApiTags,
    ApiHeader,
    ApiQuery,
    ApiOperation,
} from '@nestjs/swagger';

@ApiTags('Logs')
@ApiBearerAuth()
@Controller('logs')
@UseGuards(AuthGuard('jwt'))
export class LogsController {
    constructor(private readonly logsService: LogsService) { }

    private getOrganizationId(orgId?: string): string {
        if (!orgId) {
            throw new BadRequestException('x-org-id header is required');
        }
        return orgId;
    }

    @Get()
    @ApiOperation({ summary: 'Get paginated activity logs for the organization' })
    @ApiHeader({ name: 'x-org-id', required: true })
    @ApiQuery({ name: 'page', required: false, example: 1 })
    @ApiQuery({ name: 'limit', required: false, example: 50 })
    findAll(
        @Req() req: any,
        @Headers('x-org-id') orgId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.logsService.findAll(
            req.user,
            this.getOrganizationId(orgId),
            Number(page) || 1,
            Number(limit) || 50,
        );
    }
}
