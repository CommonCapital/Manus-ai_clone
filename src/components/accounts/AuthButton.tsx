'use client';
import {Session} from "next-auth";
import  {signOut, useSession} from "next-auth/react"
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { LogOut } from "lucide-react";


const UserAvatar = ({user, className}: {user: {image:string | null |undefined, email:string}, className:any}) => {
const [imgUrl, setImgUrl] = useState<string>('');
useEffect(() => {
if (user?.image) setImgUrl(user.image);
}, [user]);


return (
    <Avatar className={cn(className)}>
<AvatarImage alt="avatar" src={imgUrl} />
<AvatarFallback>
    {user?.email?.match(/^([^@]+)/)?.[1] ?? '(No Name)'}
</AvatarFallback>
    </Avatar>
)
}



export const AuthButton = ({session}:{session: Session | null}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <UserAvatar
user={{
    email: "",
    image: session?.user?.image
}}
className="w-8 bg-muted-foreground/20 text-primary"
                />

            </DropdownMenuTrigger>
            <DropdownMenuContent
            align="end"
            className="flex ml-4 z-1000000 flex-col gap-1 w-64 text-sm"
            >
<div className="flex items-center p-2 gap-2">
<UserAvatar
user={{
    email: "",
    image: session?.user?.image
}}
className={'w-10 h-10 bg-muted-foreground/20 text-primary'}
/>
<div className="flex flex-col gap-1">
<span className="font-bold">
{session?.user?.name}
</span>
<span className="flex items-center gap-2 text-xs"> 
{session?.user?.email}
</span>
</div>
</div>
<DropdownMenuItem
onClick={() => signOut()}
className={cn('flex items-center justify-start px-2 py-1 gap-2')}
>
    <LogOut className="w-4 h-4"/>
    Sign out
</DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}