import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SSOIdentityDocument = SSOIdentity & Document;

@Schema({ collection: 'sso_identities', timestamps: true })
export class SSOIdentity {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  provider: 'local' | 'google' | 'other';

  @Prop({ required: true })
  externalId: string;

  // 캐싱된 프로필 정보
  // @Prop({ type: Object })
  // cachedProfile: {
  //   email: string;
  //   name: string;
  //   avatar?: string;
  //   lastSync: Date;
  // };

  @Prop({ default: Date.now })
  lastLoginAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}