import { Injectable } from '@nestjs/common';
import { LdapService } from './ldap.service';
import { UsersService } from './users.service';
import { Config } from '../../config/config';
import { LoginRequestModel } from '../models/login.request.model';
import * as crypto from 'crypto';
import { UserEntity } from 'src/entity/entities/login.entity.model';

@Injectable()
export class AuthService {
  constructor(
    private readonly ldapService: LdapService,
    private readonly usersService: UsersService,
    private config: Config
  ) {}

  async auth(credentials: LoginRequestModel) {
    let user: UserEntity;

    if (this.config.FEATURE_AUTH_TYPE !== 'LDAP') {
      user = await this.authLocal(credentials);
    } else {
      user = await this.authLdap(credentials);
    }

    return user;
  }

  private async authLocal(credentials: LoginRequestModel): Promise<UserEntity> {
    const user = await this.usersService.getUserByLogin(credentials.username);

    if (user && user.hashPswd === crypto.createHmac('sha256', credentials.password).digest('hex')) {
      return Promise.resolve(user);
    }

    return Promise.reject('USER NOT FOUND');
  }

  private async authLdap(credentials: LoginRequestModel): Promise<UserEntity> {
    const user = await this.usersService.getUserByLogin(credentials.username);
    const ldapResult = await this.ldapService.auth(credentials);

    if (!ldapResult) {
      return Promise.reject('USER NOT FOUND');
    }

    if (user) {
      Promise.resolve(user);
    } else {
      const newUser = await this.usersService.addUser(ldapResult);
      Promise.resolve(newUser);
    }
  }
}
