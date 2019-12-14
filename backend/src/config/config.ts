import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class Config {
  DATABASE_URL: string;
  MAIL_HOST: string;
  APP_PORT: number;
  MAIL_SENDER_NAME: string;
  MAIL_SENDER_ADDRESS: string;
  LDAP_FILTER: string;
  MAIL_POSTFIX: string;
  READER_DOMAIN_NAME: string;
  READER_PASSWORD: string;
  LDAP_SERVER_URL: string;
  LDAP_SUFFIX: string;
  FEATURE_AVATAR_SOURCE: 'CONFLUENCE'|'NO';
  FEATURE_AUTH_TYPE: 'PASSWORD'|'LDAP';
  FEATURE_SEND_MAIL: 'YES' | 'NO';
  CONFLUENCE_BASE_URL: string;
  CONFLUENCE_LOGIN: string;
  CONFLUENCE_PASSWORD: string;
}

let config;

export function getConfig(): Config {
  const configPath = `./environments/${process.env.NODE_ENV || 'dev'}.env`;
  if (!config) {
    config = dotenv.parse(fs.readFileSync(configPath));
  }
  return config;
}
