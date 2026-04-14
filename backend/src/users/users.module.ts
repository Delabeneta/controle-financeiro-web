import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GroupsModule } from 'src/groups/groups.module';

@Module({
  imports: [PrismaModule, GroupsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
