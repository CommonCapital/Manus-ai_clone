import { withErrorHandler } from "@/lib/mongodb/withErrorHandler"
import { getAllThreadsByUserTool } from "@/lib/tools/threadTools"
import { UserService } from "@/services/UserService"
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: ["openid", "email", "profile"].join(" "),
        },
      },
      httpOptions: {
        timeout: 10000,
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({user, account, profile, email, credentials}: Record<string, any>) {
      const userData = {...user} as {id: string, name: string, email: string, image: string}
      const access_token = account?.access_token
      const refresh_token = account?.refresh_token
      await withErrorHandler(async () => {
        const userService = UserService.getInstance();
        await userService.createUser({...userData, access_token, refresh_token});
      })();
      return true;
    },
    async redirect({url, baseUrl}: Record<string, any>) {
      if (url.includes("/api/auth/signout") || url.includes("/auth/signin")) {
        return `${baseUrl}/auth/login`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({token, user, account, profile, isNewUser}: Record<string, any>) {
      if (account) {
        if (account.access_token) token.access_token = account?.access_token;
        if (account.refresh_token) token.refresh_token = account?.refresh_token;
      }
      if (user) {
        try {
          const userService = UserService.getInstance();
          console.log("[jwt] looking up email:", user.email);
          const dbUser = await userService.findByEmail(user.email);
          console.log("[jwt] dbUser found:", !!dbUser, "_id:", dbUser?._id);
          if (dbUser) {
            token.userId = dbUser._id.toString();
            const {redirectThreadId} = await getAllThreadsByUserTool.invoke({userId: dbUser._id.toString()});
            token.redirectThreadId = redirectThreadId;
          }
        } catch (error) {
          console.error("Failed to look up user in jwt callback:", error);
        }
      }
      console.log("[jwt] returning token.userId:", token.userId);
      return token;
    },
    async session({session, user, token}: Record<string, any>) {
      console.log("[session] token.userId at start:", token?.userId);
      if (token?.userId) {
        session.user.id = token.userId;
      }
      if (token?.redirectThreadId) {
        session.user.redirectThreadId = token.redirectThreadId;
      }
      console.log("[session] final session.user:", session.user);
      return session;
    },
  }
}
const handler = NextAuth(authOptions)
export {handler as GET, handler as POST}