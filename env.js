// in dotenv file
USER_CREDENTIALS_USERNAME='admin'
USER_CREDENTIALS_PASSWORD='1234'
BACKEND_API_URL='http://127.0.0.1:8000/api/'
BACKEND_AUTH_URL='http://127.0.0.1:8000/auth/login/'
BACKEND_RECONCILIATION_DATA_URL='http://127.0.0.1:8000/api/reconciliationData/'


// in vite.config.js

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default ({ mode }) => {
  // Load environment variables based on the current mode ('development' or 'production')
  const env = loadEnv(mode, process.cwd(), '');

  return defineConfig({
    plugins: [
      react(),
      viteSingleFile(),
      viteStaticCopy({
        targets: [
          {
            src: 'apps-script/*',
            dest: './',
          },
        ],
      }),
    ],
    // Optionally, define global constants
    // define: {
    //   __APP_ENV__: env.APP_ENV,
    // },
  });
};


// in ReconciliationnData.jsx

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useState, useContext } from 'react'
import {ConfigReconciliationData} from './configEltForms'
import ELTFormComponent from './ELTFormComponent'
import { AuthContext } from '../AuthContext'
import axios from 'axios'
import Loader from '../components/Loader'
import { InputChangeContext } from '../context/InputChangeContext'

function ReconciliationData() {

  const urlAuth = import.meta.env.BACKEND_AUTH_URL;
  const urlData = import.meta.env.BACKEND_RECONCILIATION_DATA_URL;

  const { fieldItems, resetFieldItems } = useContext(InputChangeContext);

  const [loading, setLoading] = useState(false);


  const [errorMessage, setErrorMessage] = useState(null); // New state for handling error messages
  const { setToken } = useContext(AuthContext);

  const navigate = useNavigate();

  const [shouldNavigate, setShouldNavigate] = useState(false);
  

  const handleAuth = async () => {
    const credentials = {
      username: import.meta.env.USER_CREDENTIALS_USERNAME,
      password: import.meta.env.USER_CREDENTIALS_PASSWORD,
    };
    try {
      const response = await axios.post(urlAuth, credentials);
      setToken(response.data.access_token);
      localStorage.setItem("token", response.data.access_token);
      console.log("Login successful", response.data);
      console.log("Token", response.data.access_token);
    } catch (error) {
      console.error("Authentication failed:", error);
      setToken(null);
      localStorage.removeItem("token");
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data); // Set the error message if present in the error response
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }
  }


  const handleData = async () => {
    const formData = fieldItems;
    console.log("Form data", formData);

    try {
      console.log("fieldItems context value before submit to backend", fieldItems);
      const response = await axios.post(urlData, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      console.log("Form submitted successfully", response.data);
      resetFieldItems();
      // console.log("fieldItems context value after reset ", fieldItems);
      // navigate("/");
      setShouldNavigate(true);
    }
    catch (error) {
      console.error("Form submission failed:", error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data); // Set the error message if present in the error response
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
      throw error; // Rethrow the error to be caught in handleSubmit
    }
  };

  useEffect(() => {
    if (shouldNavigate && Object.keys(fieldItems).length === 0) {
      // Wait for fieldItems to reset before navigating
      console.log("Navigating to home page && fieldItems has been reset", fieldItems);
      navigate('/');
    }
  }, [shouldNavigate, fieldItems, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await handleAuth();
      await handleData();
    } catch (error) {
      console.error("Form submission failed:", error);
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data); // Set the error message if present in the error response
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading ? (
        <Loader />
      ) : (
        <ELTFormComponent
          formELTConfig={ConfigReconciliationData}
          onSubmitHandler={handleSubmit}
        />
      )}
    </>
  )
}

export default ReconciliationData