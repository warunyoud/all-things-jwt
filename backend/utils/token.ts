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
const AUDIENCE ='urn:example:audience';

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

export const createJWE = async (payload: any, isJWK: boolean) => {
  const alg = isJWK ? 'RSA-OAEP' : 'dir';
  const enc = isJWK ? 'A128GCM' : 'A128CBC-HS256';
  const publicJwk = publicJwks[0];
  const unsignedJWT = new jose.EncryptJWT(payload)
  .setProtectedHeader({ alg, enc, kid: isJWK ? publicJwk.kid : undefined })
  .setIssuedAt()
  .setIssuer(ISSUER)
  .setAudience(AUDIENCE)
  .setExpirationTime('2h');
  let jwt: string;
  if (isJWK) {
    // this doesn't make much sense to do since anybody can create the encrypted token with the public key
    const publicKey = await jose.importJWK(publicJwk, alg);
    jwt = await unsignedJWT.encrypt(publicKey);
  } else {
    jwt = await unsignedJWT.encrypt(secret);
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

const decryptWithJWK = async (token: string) => {
  // again this doesn't make much sense to do since anybody can create the encrypted token with the public key
  const headers = jose.decodeProtectedHeader(token);
  const privateJwk = privateJwks.find(jwk => jwk.kid === headers.kid)
  if (!privateJwk) {
    throw new UnauthorizedError('Invalid kid');
  }
  const privateKey = await jose.importJWK(privateJwk, 'PS256');
  const payload = await jose.jwtDecrypt(token, privateKey, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload;
};

export const getUserFromRequest = async (req: Request) => {
  const token = getTokenFromRequest(req);
  const { encryptPayload, signingType } = req.query;
  const isJWK = signingType === 'asymmetric';
  try {
    if (encryptPayload === 'true') {
      const payload = isJWK ? await decryptWithJWK(token) : await jose.jwtDecrypt(token, secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      return payload;
    } else {
      const payload = isJWK ? await verifyWithJWK(token) : await jose.jwtVerify(token, secret, {
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      return payload;
    }
  } catch (error) {
    throw new UnauthorizedError('Invalid Token');
  }
};
