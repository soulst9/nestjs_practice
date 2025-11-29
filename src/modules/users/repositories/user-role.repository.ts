import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseRepository } from '../../../common/repositories/mongoose.repository';
import { UserRole, UserRoleDocument } from '../schemas/user-role.schema';

@Injectable()
export class UserRoleRepository extends MongooseRepository<UserRoleDocument> {
  constructor(
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRoleDocument>
  ) {
    super(userRoleModel);
  }
}