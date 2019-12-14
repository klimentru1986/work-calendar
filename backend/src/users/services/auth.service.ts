import { Injectable, HttpStatus } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { UsersService } from './users.service';
import { Config } from '../../config/config';
import { LoginRequestModel } from '../models/login.request.model';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly ldapService: LdapService,
    private readonly usersService: UsersService,
    private config: Config
  ) {}

  async auth(credentials: LoginRequestModel) {
    let user;

    if (this.config.FEATURE_AUTH_TYPE !== 'LDAP') {
      user = await this.authLocal(credentials);
    } else {
      user = await this.authLdap(credentials);
    }

    return user;
  }

  private async authLocal(credentials: LoginRequestModel) {
    const user = await this.usersService.getUserByLogin(credentials.username);

    if (user[0] && user[0].hashPswd === crypto.createHmac('sha256', credentials.password).digest('hex')) {
      return Promise.resolve(user[0]);
    }

    return Promise.reject('USER NOT FOUND');
  }

  private async authLdap(credentials: LoginRequestModel) {
    const user = await this.usersService.getUserByLogin(credentials.username);
    const ldapResult = await this.ldapService.auth(credentials);

    if (!ldapResult) {
      return Promise.reject('USER NOT FOUND');
    }

    if (user.length) {
      Promise.resolve(user[0]);
    } else {
      const newUser = await this.usersService.addUser(ldapResult);
      Promise.resolve(newUser);
    }
  }
}
