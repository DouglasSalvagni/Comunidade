import NextAuth from 'next-auth'
import AppleProvider from 'next-auth/providers/apple'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: process.env.APPLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      const mutableToken = token as typeof token & { idToken?: string; oauthProvider?: string }
      if (account && 'id_token' in account) {
        mutableToken.idToken = account.id_token as string | undefined
      }
      if (account?.provider) {
        mutableToken.oauthProvider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      const tokenData = token as typeof token & { idToken?: string; oauthProvider?: string }
      const sessionData = session as typeof session & { idToken?: string; oauthProvider?: string }
      sessionData.idToken = tokenData.idToken
      sessionData.oauthProvider = tokenData.oauthProvider
      return session
    },
    async redirect({ url, baseUrl }) {
      const resolved = url.startsWith('/') ? `${baseUrl}${url}` : url
      if (resolved === baseUrl || resolved === `${baseUrl}/`) {
        return `${baseUrl}/auth/callback`
      }
      if (resolved.startsWith(baseUrl)) {
        return resolved
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  cookies: {
    sessionToken: {
      name: '__Secure-next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    callbackUrl: {
      name: '__Secure-next-auth.callback-url',
      options: {
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: '__Secure-next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    state: {
      name: '__Secure-next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
    nonce: {
      name: '__Secure-next-auth.nonce',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }

