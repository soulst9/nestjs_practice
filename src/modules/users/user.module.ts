import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRole, UserRoleSchema } from './schemas/user-role.schema';
import { UserRepository } from './repositories/user.repository';
import { UserRoleRepository } from './repositories/user-role.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ])
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    UserRoleRepository,
  ],
  exports: [UsersService],
})
export class UsersModule {}