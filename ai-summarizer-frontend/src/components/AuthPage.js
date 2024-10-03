import { Amplify } from 'aws-amplify';
import { Auth } from '@aws-amplify/auth';

// Configure Amplify
Amplify.configure({
  Auth: {
    region: 'YOUR_COGNITO_REGION',
    userPoolId: 'YOUR_COGNITO_USER_POOL_ID',
    userPoolWebClientId: 'YOUR_COGNITO_APP_CLIENT_ID',
    oauth: {
      domain: 'YOUR_COGNITO_DOMAIN',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'https://yourdomain.com/auth/callback',
      redirectSignOut: 'https://yourdomain.com/',
      responseType: 'code'
    }
  }
});

const AuthPage = () => {
  const handleGoogleSignIn = async () => {
    try {
      await Auth.federatedSignIn({ provider: 'Google' });
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

  return (
    <div>
      <h2>Welcome to AI Summarizer</h2>
      <button onClick={handleGoogleSignIn}>Sign in with Google</button>
    </div>
  );
};

export default AuthPage;