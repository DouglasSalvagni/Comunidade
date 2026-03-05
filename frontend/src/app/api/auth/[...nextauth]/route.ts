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
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }

