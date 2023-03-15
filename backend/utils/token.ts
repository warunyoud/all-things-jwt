import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as jose from 'jose';
import { UnauthorizedError } from '../errors';

dotenv.config();

const secret = jose.base64url.decode(process.env.SECRET ?? 'zH4NRP1HMALxxCFnRZABFA7GOJtzU_gIj02alfL1lvI');

let privateJwks: jose.JWK[] = [];
let publicJwks: jose.JWK[] = [];

const ISSUER = 'urn:example:issuer';
const AUDIENCE = 'urn:example:audience';
const JWK_ALG = 'PS256';

export const generateKeys = async () => {
  const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
  const privateJwk = await jose.exportJWK(privateKey)
  const publicJwk = await jose.exportJWK(publicKey)
  const kid = uuidv4();
  privateJwk.kid = kid;
  publicJwk.kid = kid;
  privateJwks.push(privateJwk);
  publicJwks.push(publicJwk);
};

export const getJWKs = () => {
  return publicJwks;
};

export const createJWTAndSignWithJWK = async (payload: any) => {
  const privateJwk = privateJwks[0];
  const privateKey = await jose.importJWK(privateJwk, JWK_ALG);
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWK_ALG, kid: privateJwk.kid })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime('2h')
    .sign(privateKey);

  return jwt;
}

export const createJWT = async (payload: any) => {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime('2h')
    .sign(secret);

  return jwt;
};

const getTokenFromRequest = (req: Request) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7, authHeader.length);
  } else {
    throw new UnauthorizedError();
  }
};

const verifyWithJWK = async (token: string) => {
  const JWKS = jose.createLocalJWKSet({ keys: publicJwks });
  const result = await jose.jwtVerify(token, JWKS, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return result.payload;
};

export const getUserFromRequest = (req: Request) => {
  const token = getTokenFromRequest(req);
  const { signingType } = req.query;
  const isJWK = signingType === 'asymmetric';
  try {
    if (isJWK) {
      return verifyWithJWK(token);
    } else {
      return jose.jwtVerify(token, secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
    }
  } catch (error) {
    throw new UnauthorizedError('Invalid Token');
  }
};
