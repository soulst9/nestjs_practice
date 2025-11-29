import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { SSOTokens } from '../../common/interfaces/sso-provider.interface';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';
import { OktaHttpClientService } from './clients/okta/okta-http-client.service';
import { TokenService } from './services/token.service';
import { PasswordService } from './services/password.service';
import { IUserProvider, USER_PROVIDER, AuthUser } from './interfaces/user-provider.interface';

@Injectable()
export class AuthService {
  private readonly logger = winstonLogger;

  constructor(
    @Inject(USER_PROVIDER) private readonly userProvider: IUserProvider,
    private readonly oktaHttpClientService: OktaHttpClientService,
    private readonly tokenService: TokenService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * 회원가입
   */
  async signup(createUserDto: CreateUserDto): Promise<SSOTokens> {
    if (createUserDto.password) {
      createUserDto.password = await this.passwordService.hash(createUserDto.password);
    }

    const user = await this.userProvider.createUser(createUserDto);
    return this.generateTokensForUser(user);
  }

  /**
   * 로그인
   */
  async signin(loginDto: LoginDto): Promise<SSOTokens> {
    const user = await this.userProvider.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await this.passwordService.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokensForUser(user);
  }

  /**
   * Okta SSO 로그인
   */
  async oktaLogin(code: string, user: AuthUser): Promise<SSOTokens> {
    if (!code) {
      throw new UnauthorizedException('Invalid code');
    }

    const oktaTokens = await this.oktaHttpClientService.exchangeCodeForTokens(code);
    const userInfo = await this.oktaHttpClientService.getUserInfo(oktaTokens.access_token);

    this.logger.info('Okta user info:', JSON.stringify(userInfo));

    if (!userInfo) {
      throw new UnauthorizedException('Invalid Okta user info');
    }

    const { sub, email, name } = userInfo;
    if (!sub || !email || !name) {
      throw new UnauthorizedException('Invalid Okta user info: missing required fields');
    }

    return this.generateTokensForUser(user);
  }

  /**
   * Refresh Token으로 새 토큰 발급
   */
  async refreshTokens(email: string): Promise<SSOTokens> {
    const user = await this.userProvider.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    return this.generateTokensForUser(user);
  }

  /**
   * 사용자 정보로 토큰 세트 생성
   */
  private generateTokensForUser(user: AuthUser): SSOTokens {
    return this.tokenService.generateTokens({
      userId: user.id,
      username: user.username,
      email: user.email,
      authProvider: user.authProvider || 'other',
      roles: [],
    });
  }
}
