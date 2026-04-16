import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
        signUpVerificationMethod: 'code',
        loginWith: {
          oauth: {
            domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,
            scopes: ['openid', 'email', 'profile', 'aws.cognito.signin.user.admin'],
            redirectSignIn: [
              typeof window !== 'undefined'
                ? `${window.location.origin}/auth/callback`
                : 'http://localhost:3001/auth/callback'
            ],
            redirectSignOut: [
              typeof window !== 'undefined'
                ? window.location.origin
                : 'http://localhost:3001'
            ],
            responseType: 'code',
            providers: ['Google'],
          },
        },
      },
    },
  });
}