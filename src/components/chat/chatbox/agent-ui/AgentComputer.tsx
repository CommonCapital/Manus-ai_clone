'use client';

import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
import {useSelector} from "react-redux";

import {Prism as SyntaxHighlighter} from "react-syntax-highlighter";
import {oneLight} from "react-syntax-highlighter/dist/esm/styles/prism"


export default function AgentComputer() {
    const [menuOpen, setMenuOpen] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    const [media, setMedia] = useState<any[]>([]);
    const [displayedContent, setDisplayedContent] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState<number | null>(null)
    const queueRef = useRef<string[]>([]);
    const taskQueueRef = useRef<any[]>([]);
    const isProcessingQueue = useRef(false);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    

}