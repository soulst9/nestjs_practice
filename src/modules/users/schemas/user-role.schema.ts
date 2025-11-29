import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Role, RoleType } from 'src/common/enums/role.enum';
import { User } from './user.schema';

export type UserRoleDocument = UserRole & Document;

@Schema({ collection: 'user_roles', timestamps: true })
export class UserRole {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ type: Number, enum: Object.values(Role), required: true })
  role: RoleType;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);

