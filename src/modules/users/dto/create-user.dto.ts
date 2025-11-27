import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: '사용자 이름' })
  @IsString()
  username: string;

  @ApiProperty({ description: '이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호', minLength: 8 })
  @IsString()
  password: string;

  @ApiProperty({ description: '인증 제공자' })
  @IsOptional()
  @IsString()
  authProvider?: 'google' | 'okta' | 'other';

  @ApiProperty({ description: '외부 ID' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ description: '사용자 id' })
  @IsString()
  employeeID: string;
}