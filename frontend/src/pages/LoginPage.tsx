import { useState } from 'react';
import { useSubmit } from 'react-router-dom';
import styled from 'styled-components';

const LoginContainer = styled.div`
  position: relative;
  margin: 128px auto;
  width: 320px;
`;

const InputLabel = styled.div`
  font-size: 11px;

  color: rgba(177, 177, 177, 0.3);
`;

const Input = styled.input`
  border: none;
  border-bottom: solid rgb(143, 143, 143) 1px;

  margin-bottom: 30px;

  background: none;
  color: rgba(255, 255, 255, 0.555);

  height: 35px;

  width: 100%;
  font-size: 18px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.222);
    font-size: 16px;
  }
`;

const Select = styled.select`
  border: none;
  border-bottom: solid rgb(143, 143, 143) 1px;

  margin-bottom: 30px;

  background: none;
  color: rgba(255, 255, 255, 0.555);

  height: 35px;

  width: 100%;
  font-size: 18px;
`;

const LoginSubmit = styled.button`
  width: 100%;
  padding: 16px;

  cursor: pointer;

  border: none;
  border-radius: 8px;

  box-shadow: 2px 2px 7px #38d39f70;

  background: #38d39f;
  color: rgba(255, 255, 255, 0.8);

  transition: all 1s;

  &:hover {
    color: rgb(255, 255, 255);
  
    box-shadow: none;
  }
`;

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [signingType, setSigningType] = useState('symmetric');

  const submit = useSubmit();

  const submitCredentials = () => {
    submit({ username, password, signingType }, {
      method: 'post',
      action: '/login',
    });
  };

  return (
    <LoginContainer>
      <h1>Token Generator</h1>
      <InputLabel>USERNAME</InputLabel>
      <Input placeholder='Username that goes on the token' value={username} onChange={event => setUsername(event.target.value)}/>
      <InputLabel>PASSWORD</InputLabel>
      <Input placeholder='Anything cause it will be ignored anyway' type='password' value={password} onChange={event => setPassword(event.target.value)}/>
      <InputLabel>SIGNING TYPE</InputLabel>
      <Select value={signingType} onChange={event => setSigningType(event.target.value)}>
        <option value='symmetric'>symmetric</option>
        <option value='asymmetric'>asymmetric (jwk)</option>
      </Select> 
      <LoginSubmit onClick={submitCredentials}>SUBMIT</LoginSubmit>
    </LoginContainer>
  );
};