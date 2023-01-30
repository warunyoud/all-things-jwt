import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLoaderData, useSubmit } from 'react-router-dom';
import * as jose from 'jose';
import { BASE_URL } from '../utils/env';

const HomePageContainer = styled.div`
  margin: 32px;
  display: float;
  justify-content: space-between;
`;

const HomePagePanel = styled.div`
  width: 40vw;
`;

const HomePageText = styled.p`
  word-wrap: break-word;
`;

const IsValidText = styled.span<{ valid?: boolean }>`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.valid !== undefined ? (props.valid ? 'green' : 'red') : 'gray'};
`;

const SecretContainer = styled.div`
  display:float;
`;


const decrypt64Url = (base64Url: string) => {
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return window.atob(base64);
};

interface JWEInfoProps {
  token: string;
  decryptedPayload?: string;
};

const JWEInfo: React.FC<JWEInfoProps>= (props) => {
  const { token, decryptedPayload } = props;
  const [tokenHeader, encryptedCipherText] = useMemo(() => {
    const [encodedHeaders, _encodedEncryptionKey, _encryptedIV, encryptedCipherText] = token.split('.');
    const tokenHeader = decrypt64Url(encodedHeaders);
    return [tokenHeader, encryptedCipherText];
  }, [token]);
  return (
    <>
      <h2>Decoded</h2>
      <h3>Header</h3>
      <HomePageText>{tokenHeader}</HomePageText>
      {
        decryptedPayload ?
        <>
          <h3>Payload</h3>
          <HomePageText>{decryptedPayload}</HomePageText>
        </> : null
      }
      <h3>Cipher Text</h3>
      <HomePageText>{encryptedCipherText}</HomePageText>
    </>
  );
};

interface JWTInfoProps {
  token: string;
};

const JWTInfo: React.FC<JWTInfoProps>= (props) => {
  const { token } = props;
  const [tokenHeader, tokenPayload, signature] = useMemo(() => {
    const [encodedHeaders, encodedPayload, signature] = token.split('.');
    const tokenHeader = decrypt64Url(encodedHeaders);
    const tokenPayload = decrypt64Url(encodedPayload);
    return [tokenHeader, tokenPayload, signature];
  }, [token]);

  return (
    <>
      <h2>Decoded</h2>
      <h3>Header</h3>
      <HomePageText>{tokenHeader}</HomePageText>
      <h3>Payload</h3>
      <HomePageText>{tokenPayload}</HomePageText>
      <h3>Signature</h3>
      <HomePageText>{signature}</HomePageText>
    </>
  );
};

export const HomePage = () => {
  const { token, encryptPayload, signingType, user } = useLoaderData() as { 
    token: string;
    encryptPayload: boolean;
    signingType: string;
    user: any;
  };

  const [valid, setValid] = useState<boolean>();
  const [secret, setSecret] = useState('');
  const [decryptedPayload, setDecryptedPayload] = useState<string>();

  const submit = useSubmit();

  const stringifyUser = useMemo(() => JSON.stringify(user, null, 2), [user]);

  useEffect(() => {
    setValid(undefined);
    if (signingType === 'asymmetric' && !encryptPayload) {
      const JWKS = jose.createRemoteJWKSet(new URL(`${BASE_URL}/jwks`))
      jose.jwtVerify(token, JWKS).then(() => {
        setValid(true);
      }).catch(() => {
        setValid(false);
      });
    }
  }, [encryptPayload, token, signingType, secret]);

  const checkAgainstSecret = async () => {
    try {
      const decodedSecret = jose.base64url.decode(secret);
      if (encryptPayload) {
        const result = await jose.jwtDecrypt(token, decodedSecret);
        setDecryptedPayload(JSON.stringify(result.payload));
        setValid(true);
      } else {
        await jose.jwtVerify(token, decodedSecret);
        setValid(true);
      }
    } catch (error) {
      console.error(error);
      setValid(false);
      setDecryptedPayload(undefined);
    }
  };

  return (
    <HomePageContainer>
      <HomePagePanel>
        <h1>/me</h1>
        <HomePageText>{stringifyUser}</HomePageText>
        <button onClick={() => submit({}, {
          method: 'post',
          action: '/logout',
        })}>log out</button>
      </HomePagePanel>
      <HomePagePanel>
        <h1>Token</h1>
        <HomePageText>{token}</HomePageText>
        <h2>Signature <IsValidText valid={valid}>({valid !== undefined ? (valid ? 'VALID' : 'INVALID') : 'CHECK PENDING...'})</IsValidText></h2>
        {
          signingType === 'symmetric' ?
          <SecretContainer>
            <input onChange={event => setSecret(event.target.value)} placeholder='secret'/>
            <button onClick={checkAgainstSecret}>{encryptPayload ? 'decrypt' : 'check'}</button>
          </SecretContainer> : <a href={`${BASE_URL}/jwks`}>View JWKs</a>
        }
        {
          encryptPayload ?
          <JWEInfo token={token} decryptedPayload={decryptedPayload}/>
          : <JWTInfo token={token}/>
        }
      </HomePagePanel>
    </HomePageContainer>
  )
};