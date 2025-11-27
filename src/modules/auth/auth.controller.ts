import { Controller, Get, Post, Req, Res, UseGuards, Body, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { RefreshJwtGuard } from './guards/refresh-jwt.guard';
import { winstonLogger } from '../../common/interceptors/winston-logger.config';
// import { ConfigService } from '@nestjs/config';
import { OktaAuthGuard } from './guards/okta-auth.guard';
import oktaConfig, { OktaConfig } from '../../common/config/okta.config';

const isSecure = process.env.NODE_ENV === 'production';
const sameSite = process.env.NODE_ENV === 'production' ? 'lax' : 'none';

/**
 * Auth 컨트롤러
 */
@Controller('auth')
export class AuthController {
  private readonly logger = winstonLogger;

  constructor(
    private authService: AuthService, 
    // private configService: ConfigService, 
    @Inject(oktaConfig.KEY) private oktaConfig: OktaConfig) {}

  @Public()
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    try {
      return this.authService.signup(createUserDto);
    } catch (error) {
      this.logger.error(`Error signing up user ${createUserDto.email}`, error);
      throw error;
    }
  }


  @Public()
  @Post('signin')
  async signin(@Body() loginDto: LoginDto, @Res() res: Response) {

    try {
      this.logger.info(`Signin request received for email: ${loginDto.email}`);
      const tokens = await this.authService.signin(loginDto);

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isSecure,
        maxAge: 15 * 60 * 1000
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 30 * 1000
      });
      res.cookie('idToken', tokens.idToken, {
        httpOnly: true,
        secure: isSecure,
        maxAge: 60 * 60 * 24 * 30 * 1000
      });

      return res.json({
        message: 'Login successful',
      });
    } catch (error) {
      this.logger.error(`Error signing in user ${loginDto.email}`, error);
      throw error;
    }
  }

  @UseGuards(RefreshJwtGuard)
  @Get('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const user = req.user as UserDocument;
    const refreshToken = await this.authService.generateRefreshToken(user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isSecure,
      maxAge: 15 * 60 * 1000
    });
    return res.json({
      message: 'Refresh token successful',
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('idToken');
    return res.json({
      message: 'Logout successful',
    });
  }

  @Public()
  @Get('okta')
  @UseGuards(OktaAuthGuard)
  async oktaLogin() {
    // Guard가 자동으로 Okta 로그인 페이지로 리다이렉트
  }

  @Public()
  @Get('okta/callback')
  // @UseGuards(OktaAuthGuard)
  async oktaCallback(@Req() req: Request, @Res() res: Response) {
    try {
      // Okta 에러 체크
      if (req.query.error) {
        this.logger.error('Okta callback error:', {
          error: req.query.error,
          error_description: req.query.error_description
        });
        return res.redirect(`${this.oktaConfig.frontendUrl}/login?error=${req.query.error}`);
      }

      this.logger.info('Okta callback success - generating tokens');
      // const tokens = await this.authService.oktaLogin(req.user as UserDocument);
      const code = req.query.code as string;
      this.logger.info('Okta callback code:' + code);

      const tokens = await this.authService.oktaLogin(code, req.user as UserDocument);
      this.logger.info('OktaLogin tokens generated successfully');

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: sameSite,
        maxAge: 15 * 60 * 1000
      });
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: sameSite,
        maxAge: 60 * 60 * 24 * 30 * 1000
      });
      res.cookie('idToken', tokens.idToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: sameSite,
        maxAge: 60 * 60 * 24 * 30 * 1000
      });

      return res.redirect(`${this.oktaConfig.frontendUrl}/dashboard`);
    } catch (error) {
      this.logger.error('OktaLogin error in controller', error);
      throw error;
    }
  }
}