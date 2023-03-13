import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useLoaderData, useSubmit } from 'react-router-dom';
import * as jose from 'jose';
import { BASE_URL } from '../utils/env';

const HomePageContainer = styled.div`
  margin: 64px 128px;
  display: float;
  justify-content: space-between;
`;

const HomePagePanel = styled.div`
  width: 38vw;
`;

const HomePageText = styled.p`
  word-wrap: break-word;
`;

const IsValidText = styled.span<{ valid?: boolean }>`
  font-size: 18px;
  font-weight: bold;
  color: ${props => props.valid !== undefined ? (props.valid ? 'chartreuse' : 'orangered') : 'gray'};
`;

const LogoutButton = styled.button`
  width: 120px;
  padding: 16px;

  cursor: pointer;

  border: none;
  border-radius: 8px;


  background: gray;
  color: rgba(255, 255, 255, 0.8);

  transition: all 1s;
`;

const CheckButton = styled.button`
  width: 120px;

  cursor: pointer;

  border: none;
  border-radius: 0px 8px 8px 0px;


  background: steelblue;
  color: rgba(255, 255, 255, 0.8);

  transition: all 1s;
  height: 100%;
`;

const SecretInput = styled.input`
  padding: 0;
  padding-left: 10px;
  border-radius: 8px 0px 0px 8px;
  height: 100%;
  border-width: 0;
`;

const SecretContainer = styled.div`
  display: float;
  height: 48px;
`;


const decrypt64Url = (base64Url: string) => {
  const base64 = base64Url.replace('-', '+').replace('_', '/');
  return window.atob(base64);
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
      await jose.jwtVerify(token, decodedSecret);
      setValid(true);
    } catch (error) {
      console.error(error);
      setValid(false);
    }
  };

  return (
    <HomePageContainer>
      <HomePagePanel>
        <h1>/me</h1>
        <HomePageText>{stringifyUser}</HomePageText>
        <LogoutButton onClick={() => submit({}, {
          method: 'post',
          action: '/logout',
        })}>LOG OUT</LogoutButton>
      </HomePagePanel>
      <HomePagePanel>
        <h1>Token</h1>
        <HomePageText>{token}</HomePageText>
        <h2>Signature <IsValidText valid={valid}>({valid !== undefined ? (valid ? 'VALID' : 'INVALID') : 'CHECK PENDING...'})</IsValidText></h2>
        {
          signingType === 'symmetric' ?
          <SecretContainer>
            <SecretInput onChange={event => setSecret(event.target.value)} placeholder='Secret'/>
            <CheckButton onClick={checkAgainstSecret}>{'CHECK'}</CheckButton>
          </SecretContainer> : <a href={`${BASE_URL}/jwks`}>View JWKs</a>
        }
        <JWTInfo token={token}/>
      </HomePagePanel>
    </HomePageContainer>
  )
};