import { IsOptional, IsString, IsEnum } from 'class-validator';
import { TaskStatus } from './create-task.dto';

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;
}