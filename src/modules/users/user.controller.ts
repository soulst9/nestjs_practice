import { Controller, Post, Body, Get, Query, Param, Logger, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './services/user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserDocument } from './schemas/user.schema';
import { JwtUser } from '../auth/strategies/jwt.strategy';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@Req() req: Request) {
    const user = req.user as JwtUser;
    const projection: Record<string, 1 | 0> = {
      username: 1,
      email: 1,
      phone: 1,
      isActive: 1,
      authProvider: 1,
    };

    const result = await this.usersService.findByIdWithCache(user.id, projection);
    this.logger.log(`User ${user.id} found`); 
    return result;
  }


  // @UseGuards(JwtAuthGuard)
  // @Get(':id')
  // async getUser(@Param('id') id: string) {
  //   try {
  //     const result = await this.usersService.findById(id);
  //     this.logger.log(`User ${id} found`); 
  //     return result;
  //   } catch (error) {
  //     this.logger.error(`Error finding user ${id}`, error);
  //     throw error;
  //   }
  // }
}