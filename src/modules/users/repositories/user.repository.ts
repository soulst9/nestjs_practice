import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../../common/repositories';
import { User, UserDocument } from '../schemas/user.schema';


@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
    super(userModel);
  }
}