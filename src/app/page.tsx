'use client'
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    const threadId = (session?.user as any)?.redirectThreadId;
    if (threadId) {
      router.replace(`/chat/${threadId}`);
    }
  }, [status, session, router]);

  return null;
}
