import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: Function) {
    if (req.originalUrl === '/auth') {
      next();
      return;
    }

    const cookies = req.signedCookies;

    console.log(cookies);

    if (!cookies || !cookies.JWT) {
      throw new UnauthorizedException();
    }

    try {
      this.jwtService.verify(cookies.JWT);
    } catch (e) {
      throw new UnauthorizedException();
    }

    next();
  }
}
