import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import {redirect} from "next/navigation";

export default async function Page({children}:{children:React.ReactNode}) {
    const session = await getServerSession(authOptions);;

    if (session?.user?.redirectThreadId) {
        redirect(`/chat/${session.redirectThreadId}`);
    }
    return (
        <div>

        </div>
    )
}