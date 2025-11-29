import { Module } from '@nestjs/common';
import { UsersController } from './user.controller';
import { UsersService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRole, UserRoleSchema } from './schemas/user-role.schema';
import { UserRepository } from './repositories/user.repository';
import { UserRoleRepository } from './repositories/user-role.repository';
import { USER_PROVIDER } from '../auth/interfaces/user-provider.interface';

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
    {
      provide: USER_PROVIDER,
      useExisting: UsersService,
    },
  ],
  exports: [UsersService, USER_PROVIDER],
})
export class UsersModule {}