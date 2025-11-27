import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories/base.repository';
import { UserRole, UserRoleDocument } from '../schemas/user-role.schema';

@Injectable()
export class UserRoleRepository extends BaseRepository<UserRoleDocument> {
  constructor(
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>
  ) {
    super(userRoleModel);
  }
}