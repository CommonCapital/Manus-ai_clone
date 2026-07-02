import Sidebar from "@/components/chat/Sidebar";
import ChatPanel from "@/components/chat/ChatPanel";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import AIWorkspace from "@/components/chat/chatbox/agent-ui/AIWorkspace";

export default async function Page({params}: {params: Promise<{threadId: string}>}) {
  const {threadId} = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-950">
      <AIWorkspace/>
      <main className="flex flex-1 overflow-hidden">
        <ChatPanel threadId={threadId} userId={session.user.id} />
      </main>
    </div>
  );
}
