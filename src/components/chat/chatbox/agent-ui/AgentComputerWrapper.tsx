'use client'
import dynamic from 'next/dynamic'
import React, { useEffect, useState } from 'react'
const AgentComputer = dynamic(
() => import("@/components/chat/chatbox/agent-ui/AgentComputer"),
{ssr:false}
)
export default function AgentComputerWrapper() {
    const [ready, setReady] = useState(false);

    useEffect(() => {
setReady(true);

    }, [])
    if (!ready) return null;

  return (
    <AgentComputer />
  )
}
