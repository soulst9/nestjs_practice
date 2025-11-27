import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {

  @Prop({ required: true, unique: true })
  employeeID: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: false, default: true })
  isActive: boolean;  
  
  @Prop({ required: false })
  externalId?: string;

  @Prop()
  authProvider?: 'google' | 'okta' | 'other';

  createdAt?: Date;
  updatedAt?: Date;  
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1, isActive: 1 });

UserSchema.virtual('userRoles', {
  ref: 'UserRole',
  localField: '_id',
  foreignField: 'user'
});