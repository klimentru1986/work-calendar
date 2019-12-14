import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { getConfig } from '../config/config';
import { AuthMiddleware } from './middleware/auth.middleware';

const config = getConfig();
const jwtModule = JwtModule.register({
  secret: config.JWT_SECRET_KEY,
  signOptions: { expiresIn: config.JWT_EXPIRES }
});

@Module({
  imports: [jwtModule],
  providers: [AuthMiddleware],
  exports: [jwtModule, AuthMiddleware]
})
export class SharedModule {}
