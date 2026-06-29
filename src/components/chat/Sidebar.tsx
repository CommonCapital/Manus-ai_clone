'use client';

import { createThread } from '@/lib/api/threads';
import { cn } from '@/lib/utils';
import { AppDispatch, RootState } from '@/store';
import { fetchThreads } from '@/store/threadSlice';

import { FileText, MessageSquare, PanelLeftClose, PanelRightClose, Plus } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import AccountButton from '../accounts/AccountButton';

export default function Sidebar ()  {

    const [menuOpen, setMenuOpen] = useState(true);
    
     const {data: session} = useSession()
     
    const dispatch = useDispatch<AppDispatch>();
    const {threads} = useSelector((state: RootState) => state.thread);
    const router = useRouter();
const userId = session?.user?.id;

const params = useParams();
const acitveThreadId = params?.threadId as string;

const selectThread = (threadId:string) => {
    router.push(`/chat/${threadId}`)
}


    const createNewThread = async () => {
        if (!userId) return;
        const newThread = await createThread(userId);
        dispatch(fetchThreads(userId));
        router.push(`/chat/${newThread.threadId}`);
    }

   
   
useEffect(() => {
    if (userId) {
        dispatch(fetchThreads(userId))
    }
}, [dispatch, userId])


  return (
    <div className='relative flex h-full'>
<aside
className={cn(
"flex flex-col border-r bg-slate-50 transition-all",
menuOpen ? "w-65 translate-x-0" : "w-0 -translate-x-full opacity-0"
)}
>
<div className="flex h-full flex-col p-3">
 
 
<div className='mb-4 mt-2'>
<button
onClick={createNewThread}
className="flex items-center gap-3 rounded-full bg-slate-200 px-4 py-3"
>
    <Plus size={18} />
    <span className='truncate'>New Chat</span>
    
</button>
</div>

<div className='mb-2 px-2 text-xs font-semibold text-slate-500'>
    Recent
</div>
<nav className='flex-1 space-y-1 overflow-y-auto'>
{Array.isArray(threads) && threads.length === 0 ? (
<div className='flex flex-col items-center justify-center pt-10 text-slate-300'>
<MessageSquare size={40} className='mb-2 opacity-20'/>
<span className='text-xs'>No thread yet</span>
</div>
):(
threads?.map((thread) => (
    <MenuItem
    onClick={() => selectThread(thread.threadId)}

    active={acitveThreadId === thread.threadId}
    key={thread.threadId}
    icon={<FileText size={16} />}
    label={thread.title}
    />
))
)}
</nav>
<div className='mt-auto pt-4'>
<AccountButton />
</div>
</div>
</aside>

<div className='pt-7 cursoir-pointer pl-3'>
    <button
    onClick={() => setMenuOpen(!menuOpen)}
    className='rounded-md text-slate-500 hover:bg-slate-200 cursor-pointer'
    title={menuOpen ? "Close Sidebar":"Open Sidebar"}
    >
{menuOpen ? (<PanelLeftClose size={24}/>):(<PanelRightClose size={24} />)}
    </button>
</div>
    </div>
  )
}


function MenuItem({
icon,
label,
active,
onClick

}:{
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}) {
return (
    <button
    onClick={onClick}
    className={cn(
"flex w-full items-center gap-2 rounded-md px-3 py-2 cursor-pointer",
active ? "bg-slate-200 font-medium": "hover:bg-slate-200"
    )}
    >
{icon}
{label}
    </button>
)
}

