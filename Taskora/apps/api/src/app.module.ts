import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { MembersModule } from './members/members.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [AuthModule, TasksModule, MembersModule, LogsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }