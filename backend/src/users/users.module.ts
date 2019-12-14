import { Module } from '@nestjs/common';
import { EntityModule } from '../entity/entity.module';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { AuthController } from './auth.controller';
import { LdapService } from './services/ldap.service';
import { Config, getConfig } from '../config/config';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    EntityModule,
    JwtModule.register({
      secret: getConfig().JWT_SECRET_KEY,
      signOptions: { expiresIn: '60s' }
    })
  ],
  controllers: [UsersController, AuthController],
  providers: [UsersService, LdapService, AuthService, { provide: Config, useValue: getConfig() }]
})
export class UsersModule {}
