import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import * as dotenv from 'dotenv';

dotenv.config();

import { createJWE, createJWT, generateKeys, getJWKs, getUserFromRequest } from './utils/token';
import { isMyError } from './errors';

const app = express();
const port = 3001;

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authParser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserFromRequest(req);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

generateKeys().then(() => {
  return generateKeys();
}).then(() => {
  app.use(morgan('tiny'));
  app.use(cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  }));
  
  app.use(express.json());
  
  app.post('/login', async (req, res, next) => {
    const { encryptPayload, signingType } = req.query;
    const { username, password } = req.body;
    const isJWK = signingType === 'asymmetric';
    try {
      if (encryptPayload === 'true') {
        res.json({ access_token: await createJWE({ username }, isJWK) });
      } else {
        res.json({ access_token: await createJWT({ username }, isJWK) });
      }
    } catch (error) {
      next(error);
    }
  });
  
  app.get('/me', authParser, async (req, res, next) => {
    try {
      const user = req.user;
      res.json({ user });
    } catch (error) {
      next(error);
    }
  });

  app.get('/jwks', async (req, res) => {
    res.json({ keys: getJWKs() });
  });

  app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
    if (isMyError(err)) {
      res.status(err.status).send(err.message);
    } else {
      console.error(err.stack)
      res.status(500).send('Something broke!');
    }
  });

  app.listen(port, () => {
    console.log(`JWT demo server listening on port ${port}`);
  });

});
