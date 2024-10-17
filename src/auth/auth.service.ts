import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly clientId = process.env.GITHUB_CLIENT_ID;
  private readonly clientSecret = process.env.GITHUB_CLIENT_SECRET;
  private readonly redirectUri = process.env.REDIRECT_URI;

  getAuthorizationUrl(): string {
    return `https://github.com/login/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}`;
  }

  async handleCallback(code: string) {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        redirect_uri: this.redirectUri,
      }, {
        headers: {
          Accept: 'application/json',
        },
      });

      const accessToken = tokenResponse.data.access_token;

      // Use access token to get user information
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return {
        success: true,
        user: {
          id: userResponse.data.id,
          name: userResponse.data.name,
          login: userResponse.data.login,
          email: userResponse.data.email,
        },
      };
    } catch (error) {
      console.error('GitHub authentication error:', error);
      return {
        success: false,
        error: 'Failed to authenticate with GitHub',
      };
    }
  }
}