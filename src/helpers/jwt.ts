import * as crypto from 'crypto';
import { Base64 } from './base64';

type Header = {
  typ: 'JWT';
  alg: 'HS256';
};

type Payload = {
  iss: 'auth.k3env.site';
  sub: string;
  iat: number;
};

function signJWT(payload: string, key: string): string {
  return crypto.createHmac('sha256', key).update(payload).digest('base64url');
}

export function verifyToken(token: string): boolean {
  const { APP_KEY } = process.env;
  if (APP_KEY) {
    const [hb64, pb64, sign] = token.split('.');
    const gsign = signJWT(hb64 + '.' + pb64, APP_KEY);
    return sign === gsign;
  } else {
    throw new Error('APP_KEY isnt set');
  }
}

export function decodeToken(token: string): { header: Header; payload: Payload } {
  if (verifyToken(token)) {
    const [h64, p64] = token.split('.');
    const [header, payload] = [h64, p64].map((b) => JSON.parse(Base64.decode(b)));
    return { header, payload };
  } else {
    throw new Error('JWT verification failed');
  }
}
