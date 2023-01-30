import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import axios from 'axios';
import { BASE_URL } from './utils/env';

const ACCESS_TOKEN_KEY = 'access_token';
const ENCRYPT_PAYLOAD_KEY = 'encrypt_payload';
const SIGNING_TYPE_KEY = 'signing_type';

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage/>,
    loader: async () => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      const encryptPayload = localStorage.getItem(ENCRYPT_PAYLOAD_KEY);
      const signingType = localStorage.getItem(SIGNING_TYPE_KEY);
      if (!token) {
        return redirect('/login');
      }
      try {
        const response = await axios.get<{ user: any }>(`${BASE_URL}/me`, { 
          headers: { Authorization: `Bearer ${token}` },
          params: { encryptPayload, signingType },
        });
        const { user } = response.data;
        return { token, encryptPayload: encryptPayload === 'true', user, signingType };
      } catch (error) {
        console.error(error);
        localStorage.clear();
        return redirect('/login');
      }
    },
  },
  {
    path: '/logout',
    action: () => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      return redirect('/login');
    },
  },
  {
    path: '/login',
    element: <LoginPage/>,
    action: async ({ request }) => {
      let formData = await request.formData();
      const username = formData.get('username');
      const password = formData.get('password');
      const encryptPayload = formData.get('encryptPayload');
      const signingType = formData.get('signingType');
      try {
        const response = await axios.post<{ access_token: string }>(`${BASE_URL}/login`, { username, password }, {
          params: { encryptPayload, signingType },
        });
        localStorage.setItem(ACCESS_TOKEN_KEY, response.data.access_token);
        localStorage.setItem(ENCRYPT_PAYLOAD_KEY, encryptPayload!.toString());
        localStorage.setItem(SIGNING_TYPE_KEY, signingType!.toString());
        return redirect('/');
      } catch (error) {
        return { error };
      }
    },
  },
]);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
