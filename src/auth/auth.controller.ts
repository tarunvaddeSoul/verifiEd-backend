import { Controller, Get, Query, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('github/login')
  initiateLogin(@Res() res: Response) {
    const authUrl = this.authService.getAuthorizationUrl();
    res.redirect(authUrl);
  }

  @Get('github/callback')
  async handleCallback(@Query('code') code: string, @Res() res: Response) {
    try {
      const result = await this.authService.handleCallback(code);
      
      res.redirect(`${process.env.REACT_URL}/phc?authResult=${encodeURIComponent(JSON.stringify(result))}`);
    } catch (error) {
      console.error('GitHub auth error:', error);
      res.redirect(`${process.env.REACT_URL}/phc?error=${encodeURIComponent('Authentication failed')}`);
    }
  }
}