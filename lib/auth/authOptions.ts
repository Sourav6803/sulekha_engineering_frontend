export const AUTH_COOKIE_NAME = 'sulekha_access_token';
export const AUTH_REFRESH_COOKIE_NAME = 'sulekha_refresh_token';

export const AUTH_PUBLIC_PATHS = ['/', '/login'];

export const AUTH_REDIRECT_PATHS = {
  login: '/login',
  dashboard: '/dashboard'
};

export const AUTH_FORM_FIELD_NAMES = {
  email: 'email',
  password: 'password'
};

export const AUTH_SESSION_STORAGE = {
  user: 'sulekha_auth_user',
  accessToken: 'sulekha_access_token',
  refreshToken: 'sulekha_refresh_token'
};
