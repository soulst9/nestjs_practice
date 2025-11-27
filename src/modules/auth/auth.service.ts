import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SSOTokens, UserRoleInfo } from '../../common/interfaces/sso-provider.interface';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/services/user.service';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';
import * as bcrypt from 'bcrypt';
import { MembersService } from '../members/services/member.service';
import { RoleChecker } from '../../utils/role-checker.util';

import { OktaHttpClientService } from './clients/okta/okta-http-client.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly membersService: MembersService,
    private readonly oktaHttpClientService: OktaHttpClientService,
  ) {}

  // private readonly logger = new Logger(AuthService.name);
  private readonly logger = winstonLogger;

  /**
   * 토큰 발급
   * @param user 사용자
   * @param roles 사용자 역할 목록
   * @returns 토큰
   */
  async generateToken(user: UserDocument, roles?: UserRoleInfo[]): Promise<SSOTokens> {
    const { _id, username, email, authProvider } = user;
    this.logger.info('generateToken user', user);
    const sub = _id;
    const tokenPayload = {
      sub,
      username,
      email,
      authProvider,
      roles: roles || [],
    };
    const token = this.jwtService.sign(tokenPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN')
    });

    const refreshTokenPayload = {
      sub,
      username,
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')
    });

    const idTokenPayload = {
      sub,
      email,
      username,
      authProvider,
    };
    const idToken = this.jwtService.sign(idTokenPayload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ID_TOKEN_EXPIRES_IN')
    });

    return {
      accessToken: token,
      refreshToken: refreshToken,
      idToken: idToken,
    } as SSOTokens;
  }

  /**
   * 리프레시 토큰 발급
   * @param user 사용자
   * @returns 리프레시 토큰
   */
  async generateRefreshToken(email: string): Promise<string> {
    const userDoc = await this.usersService.findByEmail({ email });
    if (!userDoc) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const refreshTokenPayload = {
      sub: userDoc.id,
      username: userDoc.username,
    };

    return this.jwtService.sign(refreshTokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN')
    });
  }
  
  /**
   * 회원가입
   * @param createUserDto 사용자 생성 정보
   * @returns SSO 토큰
   */
  async signup(createUserDto: CreateUserDto): Promise<SSOTokens> {
      // 비밀번호 해싱
      if (createUserDto.password) {
        createUserDto.password = await bcrypt.hash(createUserDto.password, 10);
      }

      const user = await this.usersService.createUserWithCache(createUserDto);
      // 회원가입 시에는 역할이 없으므로 빈 배열 전달
      const tokens = await this.generateToken(user, []);
      return tokens;
  }

  /**
   * SSO 로그인
   * @param email 이메일
   * @param password 비밀번호
   * @returns SSO 토큰
   */
  async signin(LoginDto: LoginDto): Promise<SSOTokens> {
    const user = await this.usersService.findByEmail({ email: LoginDto.email });

    this.logger.info('user', user);
    // this.logger.info('authData.id', authData?.id);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    if (!await bcrypt.compare(LoginDto.password, user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // _id를 문자열로 변환
    const employeeID = user.employeeID;
    this.logger.info('employeeID for role lookup', employeeID);

    // employeeID로 Member 조회
    const memberRoleInfo = await this.membersService.findMemberByEmployeeID(employeeID);

    if (Array.isArray(memberRoleInfo) || memberRoleInfo.roles.length === 0) {
      throw new UnauthorizedException('Member not found');
    }
    // 토큰 생성
    const tokens = await this.generateToken(user);
    return tokens;
  }

  async oktaLogin(code: string, user: UserDocument): Promise<SSOTokens> {

    if (!code) {
      throw new UnauthorizedException('Invalid code');
    }

    const oktaTokens = await this.oktaHttpClientService.exchangeCodeForTokens(code);

    const { access_token } = oktaTokens;
    const userInfo = await this.oktaHttpClientService.getUserInfo(access_token);
    this.logger.info('Okta user info:', JSON.stringify(userInfo));

    if (!userInfo) {
      throw new UnauthorizedException('Invalid Okta user info');
    }

    const { sub, email, name } = userInfo;
    if (!sub || !email || !name) {
      throw new UnauthorizedException('Invalid Okta user info: missing required fields');
    }
    // 토큰 생성
    const tokens = await this.generateToken(user);
    return tokens;
  }
}
