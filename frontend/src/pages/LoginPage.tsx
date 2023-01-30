import { useState } from 'react';
import { useSubmit } from 'react-router-dom';
import styled from 'styled-components';

const LoginContainer = styled.div`
  position: relative;
  margin: 128px auto;
  width: 320px;
`;

const InputLabel = styled.div`
`;

const Input = styled.input`
  width: 100%;
  font-size: 22px;
  margin-bottom: 16px;
`;

const Select = styled.select`
  width: 100%;
  font-size: 22px;
  margin-bottom: 16px;
`;

const LoginSubmit = styled.button`
  width: 100%;
  padding: 8px;
  font-size: 22px;
`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [encryptPayload, setEncryptPayload] = useState('false');
  const [signingType, setSigningType] = useState('symmetric');

  const submit = useSubmit();

  const submitCredentials = () => {
    submit({ username, password, encryptPayload, signingType }, {
      method: 'post',
      action: '/login',
    });
  };

  return (
    <LoginContainer>
      <h1>Token Generator</h1>
      <InputLabel>Username</InputLabel>
      <Input value={username} onChange={event => setUsername(event.target.value)}/>
      <InputLabel>Password</InputLabel>
      <Input type='password' value={password} onChange={event => setPassword(event.target.value)}/>
      <InputLabel>Encrypt Payload</InputLabel>
      <Select value={encryptPayload} onChange={event => setEncryptPayload(event.target.value)}>
        <option value='false'>no</option>
        <option value='true'>yes</option>
      </Select>
      <InputLabel>Signing Type</InputLabel>
      <Select value={signingType} onChange={event => setSigningType(event.target.value)}>
        <option value='symmetric'>symmetric</option>
        <option value='asymmetric'>asymmetric (jwk)</option>
      </Select> 
      <LoginSubmit onClick={submitCredentials}>Login</LoginSubmit>
    </LoginContainer>
  );
};