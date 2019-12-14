import { Module, HttpModule, HttpService, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { EntityModule } from '../entity/entity.module';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';
import { AuthController } from './auth.controller';
import { LdapService } from './services/ldap.service';
import { Config, getConfig } from '../config/config';
import { AuthService } from './services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TasksController } from './tasks.controller';
import { TaskService } from './services/task.service';
import { AvatarsController } from './avatars.controller';
import { AvatarsService } from './services/avatars/avatars.service';
import { ConfluenceAvatarService } from './services/avatars/confluence-avatars.service';
import { DefaultAvatarsService } from './services/avatars/default-avatars.service';
import { SendMailService } from './services/send-mail.service';
import { MailController } from './mail.controller';
import { SharedModule } from '../shared/shared.module';

const avatarServiceProvider = {
  provide: AvatarsService,
  useFactory: (http: HttpService, config: Config) => {
    if (config.FEATURE_AVATAR_SOURCE === 'CONFLUENCE') {
      return new ConfluenceAvatarService(http, config);
    } else {
      return new DefaultAvatarsService(http);
    }
  },
  inject: [HttpService, Config]
};

@Module({
  imports: [
    HttpModule,
    EntityModule,
    JwtModule.register({
      secret: getConfig().JWT_SECRET_KEY,
      signOptions: { expiresIn: '60s' }
    }),
    SharedModule
  ],
  controllers: [UsersController, AuthController, TasksController, AvatarsController, MailController],
  providers: [
    avatarServiceProvider,
    UsersService,
    LdapService,
    AuthService,
    TaskService,
    SendMailService,
    { provide: Config, useValue: getConfig() }
  ]
})
export class UsersModule {}
