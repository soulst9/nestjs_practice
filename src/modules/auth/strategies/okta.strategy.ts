import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import oktaConfig, { OktaConfig } from '../../../common/config/okta.config';
import { Strategy, Profile } from 'passport-openidconnect';
import { winstonLogger } from '../../../common/interceptors/winston-logger.config';
import { UsersService } from '../../users/services/user.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';

@Injectable()
export class OktaStrategy extends PassportStrategy(Strategy, 'okta') {
  private readonly logger = winstonLogger;
  
  constructor(
    @Inject(oktaConfig.KEY)
    private config: OktaConfig,
    private usersService: UsersService,
  ) {
    super({
      authorizationURL: `${config.issuer}/v1/authorize`,
      tokenURL: `${config.issuer}/v1/token`,
      userInfoURL: `${config.issuer}/v1/userinfo`,
      issuer: config.issuer,
      clientID: config.clientId,
      clientSecret: config.clientSecret,
      callbackURL: config.callbackURL,
      scope: config.scope || 'openid profile email',
      skipUserProfile: false,
      store: {
        store: (_req: any, ctx: any, _appState: any, _meta: any, cb: any) => {
          // State를 메모리에 임시 저장 (세션 대신)
          cb(null, ctx.nonce || 'default-state');
        },
        verify: (_req: any, providedState: string, cb: any) => {
          // State 검증 생략 (간단한 구현)
          cb(null, { nonce: providedState });
        }
      }
    });
  }

  private isValidString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
  }
  
  async validate(
    issuer: string,
    profile: Profile,
    context: object,
    idToken: string | object,
    accessToken: string | object,
    refreshToken: string,
    params: any,
    done: (err: any, user: any) => void
  ): Promise<void> {
    try {
      this.logger.info('Okta OIDC profile:' + JSON.stringify(profile));

      const email = profile.emails?.[0]?.value;
      const username = profile.displayName;
      if (!email || !username) {
        throw new UnauthorizedException('Invalid OIDC profile: missing required fields');
      }

      const createUserDto: CreateUserDto = {
        email,
        username,
        authProvider: 'okta',
        externalId: profile.id,
        password: '',
        employeeID: email.split('@')[0],
      };

      const user = await this.usersService.findOrCreateUser(createUserDto);

      this.logger.info(`User authenticated successfully: ${user.email}`);
      done(null, user);
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      done(error, false);
    }
  }  
}