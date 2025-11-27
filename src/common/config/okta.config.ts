import { registerAs } from '@nestjs/config';

export interface OktaConfig {
  clientId: string;
  audience: string;
  issuer: string;
  clientSecret: string;
  callbackURL: string;
  frontendUrl: string;
  scope: string;
}

export default registerAs('okta', () => ({
  clientId: process.env.OKTA_CLIENT_ID,
  audience: process.env.OKTA_AUDIENCE,
  issuer: `${process.env.OKTA_DOMAIN}/oauth2`,
  clientSecret: process.env.OKTA_CLIENT_SECRET,
  callbackURL: process.env.OKTA_CALLBACK_URL,
  frontendUrl: process.env.FRONTEND_URL,
  scope: process.env.OKTA_SCOPE,
}));