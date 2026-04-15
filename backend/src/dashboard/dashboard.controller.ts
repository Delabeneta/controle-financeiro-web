// src/dashboard/dashboard.controller.ts

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '@prisma/client';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('dashboard')
@UseGuards(AuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboard(@Req() req: RequestWithUser) {
    return this.dashboardService.getDashboard(req.user);
  }
}
