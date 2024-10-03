import React, { useEffect } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await Auth.currentAuthenticatedUser();
        // User is signed in, redirect to home page or dashboard
        navigate('/');
      } catch (error) {
        console.error('Error during authentication', error);
        // Handle error, maybe redirect to login page
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Completing sign in...</div>;
};

export default AuthCallback;