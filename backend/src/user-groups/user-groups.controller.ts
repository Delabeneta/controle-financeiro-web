import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserGroupsService } from './user-groups.service';
import { CreateUserGroupDto } from './dto/create-user-group.dto';
import { User } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('user-groups')
@UseGuards(AuthGuard)
export class UserGroupsController {
  constructor(private readonly userGroupsService: UserGroupsService) {}

  @Post()
  create(@Body() body: CreateUserGroupDto, @Req() req: RequestWithUser) {
    return this.userGroupsService.create(body, req.user.id);
  }

  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.userGroupsService.findByGroup(groupId);
  }

  @Delete(':userId/:groupId')
  remove(@Param('userId') userId: string, @Param('groupId') groupId: string) {
    return this.userGroupsService.remove(userId, groupId);
  }
}
