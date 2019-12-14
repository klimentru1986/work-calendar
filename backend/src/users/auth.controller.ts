import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { LoginRequestModel } from './models/login.request.model';
import { LdapService } from './services/ldap.service';
import { ApiUseTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@ApiUseTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly ldapService: LdapService,
    private readonly usersService: UsersService,
    private authService: AuthService,
    private jwtService: JwtService
  ) {}
  @Post()
  async auth(@Res() res: Response, @Body() credentials: LoginRequestModel) {
    try {
      const user = await this.authService.auth(credentials);
      res.cookie('JWT', this.jwtService.sign({ login: user.mailNickname, password: user.hashPswd }), {
        httpOnly: true
      });
      res.status(HttpStatus.OK).send(user);
    } catch (e) {
      res.status(HttpStatus.NOT_ACCEPTABLE).send('USER NOT FOUND');
    }
  }

  @Post('/add')
  async authAndAdd(@Res() res, @Body() credentials: LoginRequestModel) {
    try {
      const ldapResult = await this.ldapService.auth(credentials, true);
      const result = await this.usersService.getUserByLogin(ldapResult.mailNickname);
      if (result) {
        res.status(HttpStatus.NOT_ACCEPTABLE).send('USER ALREADY EXIST');
      } else {
        const newUser = await this.usersService.addUser(ldapResult);
        res.status(HttpStatus.OK).send(newUser);
      }
    } catch (e) {
      res.status(HttpStatus.NOT_ACCEPTABLE).send('USER NOT FOUND');
    }
  }

  @Post('/registration')
  async registration(@Res() res, @Body() credentials: LoginRequestModel) {
    try {
      const result = await this.usersService.getUserByLogin(credentials.username);
      if (result) {
        res.status(HttpStatus.NOT_ACCEPTABLE).send('USER ALREADY EXIST');
        return;
      }
      const newUser = await this.usersService.registration(credentials);
      res.status(HttpStatus.OK).send(newUser);
    } catch (e) {
      res.status(HttpStatus.NOT_ACCEPTABLE).send('USER NOT FOUND');
    }
  }
}
