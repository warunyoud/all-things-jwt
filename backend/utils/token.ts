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

export const createJWT = async (payload: any, isJWK: boolean) => {
  const alg = isJWK ? 'PS256' : 'HS256';
  const privateJwk = privateJwks[0];
  const unsignedJWT = new jose.SignJWT(payload)
  .setProtectedHeader({ alg, kid: isJWK ? privateJwk.kid : undefined })
  .setIssuedAt()
  .setIssuer(ISSUER)
  .setAudience(AUDIENCE)
  .setExpirationTime('2h');
  
  let jwt: string;
  if (isJWK) {
    const privateKey = await jose.importJWK(privateJwk, alg);
    jwt = await unsignedJWT.sign(privateKey);
  } else {
    jwt = await unsignedJWT.sign(secret);
  } 
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
