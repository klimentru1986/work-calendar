import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Config, getConfig } from './config/config';
import { DictionaryModule } from './dictionary/dictionary.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { SharedModule } from './shared/shared.module';
import { AuthMiddleware } from './shared/middleware/auth.middleware';
const config = getConfig();

const url = `${config.DATABASE_URL}`;

@Module({
  imports: [
    UsersModule,
    MongooseModule.forRoot(url, {
      useNewUrlParser: true,
    }),
    DictionaryModule,
    SettingsModule,
    SharedModule
  ],
  providers: [{ provide: Config, useValue: config }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
