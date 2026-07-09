"use client";

import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/lib/utils";
import {
  FileText,
  ExternalLink,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  Computer,
  Eye
  
} from "lucide-react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight,oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
// Import the themes
import { AppDispatch, RootState } from "@/store";
import { modifyReportModalContent, toggleChatPanelPadding, toggleViewReportModal } from "@/store/chatSlice";


export default function AgentComputer() {


   const dispatch = useDispatch<AppDispatch>();
 const [menuOpen,setMenuOpen] = useState(false);

  // runAgentSimulation
    const {  chatPanelPadding,} = useSelector(
      (state: RootState) => state.chat
    )

 
  useEffect(()=>{
    if(chatPanelPadding==="chat"){
       setMenuOpen(false)
    }else{
      setMenuOpen(true)
    }
   
  },[chatPanelPadding])

  

  const [activeIndex, setActiveIndex] = useState(0);

  const [media, setMedia] = useState<any[]>([]);
  const [displayedContent, setDisplayedContent] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const [currentlyTypingIndex, setCurrentlyTypingIndex] = useState<number | null>(null);

  const queueRef = useRef<string[]>([]);
  const taskQueueRef = useRef<any[]>([]);
  const isProcessingQueue = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastFileIndexRef = useRef(0);
  const lastImageIndexRef = useRef(0);

  const MAX_TYPING_TIME = 3800;

  const agentFiles = useSelector((state: any) => state.chat.agent_files);
  const agentImages = useSelector((state: any) => state.chat.agent_images);

  const stopTyping = () => {
    setIsTyping(false);
    setCurrentlyTypingIndex(null);
    queueRef.current = [];

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const goToPrev = () => {
    stopTyping();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    stopTyping();
    setActiveIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const typeNext = () => {
    if (queueRef.current.length === 0) {

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      setIsTyping(false);
      setCurrentlyTypingIndex(null);

      setTimeout(() => {
        processTaskQueue();
      }, 100);

      return;
    }

    const chunk = queueRef.current.splice(0, 3).join("");
    setDisplayedContent((prev) => prev + chunk);

    setTimeout(typeNext, 4);
  };

  const startTypingEffect = (content: string, index: number) => {
    setCurrentlyTypingIndex(index);
    setDisplayedContent("");
    setIsTyping(true);

    queueRef.current = content.split("");

    typingTimeoutRef.current = setTimeout(() => {
      queueRef.current = [];

      setDisplayedContent(content);
      setIsTyping(false);
      setCurrentlyTypingIndex(null);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      setTimeout(() => {
        processTaskQueue();
      }, 100);

    }, MAX_TYPING_TIME);

    typeNext();
  };

  const processTaskQueue = () => {
    if (isProcessingQueue.current) return;

    if (taskQueueRef.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    isProcessingQueue.current = true;

    const task = taskQueueRef.current.shift();

    if (task.type === "image") {
      setMedia((prev) => {
        const newMedia = [...prev, task.image];
        setActiveIndex(newMedia.length - 1);
        return newMedia;
      });

      isProcessingQueue.current = false;

      setTimeout(() => {
        processTaskQueue();
      }, 400);

      return;
    }

    if (task.type === "file") {
      setMedia((prev) => {
        const newMedia = [...prev, task.file];
        const index = newMedia.length - 1;

        setActiveIndex(index);

        startTypingEffect(task.file.content, index);

        return newMedia;
      });

      isProcessingQueue.current = false;
    }
  };

  useEffect(() => {
    if (!agentFiles) return;

    const newFiles = agentFiles.slice(lastFileIndexRef.current);

    newFiles.forEach((file: any) => {
      taskQueueRef.current.push({
        type: "file",
        file: {
          type: "file",
          name: file.filename,
          language: "javascript",
          content: file.content
        }
      });
    });

    lastFileIndexRef.current = agentFiles.length;

    processTaskQueue();

  }, [agentFiles]);

  useEffect(() => {
    if (!agentImages) return;

    const newImages = agentImages.slice(lastImageIndexRef.current);

    newImages.forEach((img: any) => {
      taskQueueRef.current.push({
        type: "image",
        image: {
          type: "image",
          src: img.src
        }
      });
    });

    lastImageIndexRef.current = agentImages.length;

    processTaskQueue();

  }, [agentImages]);


  function displayReport(item:{content:string,name:string}){
    if(item.name.includes('.md')){
        dispatch(toggleViewReportModal())
    dispatch(modifyReportModalContent(item?.content))
    }
  
  }

  const isDarkMode = document.documentElement.classList.contains("dark");

  const renderContent = (item: any, index: number) => {
    if (!item)
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center border border-dashed border-gray-300">
            <FileText className="text-gray-300" />
          </div>
          <p className="text-sm font-medium">Waiting for AI actions...</p>
        </div>
      );

    if (item.type === "image") {
      return (
        <div className="relative w-full h-full rounded-xl overflow-hidden border border-gray-200">
          <img
            src={item.src}
            alt="AI Vision"
            className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-500"
          />
        </div>
      );
    }

    if (item.type === "file") {
      const contentToShow =
        index === currentlyTypingIndex && isTyping
          ? displayedContent
          : item.content;

      return (
        <div className="flex flex-col h-full w-full animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <FileText size={14} className="text-blue-600" />
              </div>
      <span className="text-foreground text-sm font-bold">
  {item.name}
</span>

            </div>

            {index === currentlyTypingIndex && isTyping && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                Writing...
              </span>
            )}
            {
              (isTyping ? "":(

                <span onClick={()=>displayReport(item)}  className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase">
                <Eye size={15}></Eye> View
              </span>
              ))
               
            }
          
          </div>
{/* <div className="flex-1 overflow-auto rounded-xl border border-border bg-background">
  <SyntaxHighlighter
    language={item.language}
    style={isDarkMode ? oneDark : oneLight} // dynamically switch based on theme
    className="p-5 m-0 text-sm"
  >
    {contentToShow}
  </SyntaxHighlighter>
</div> */}
<div className="flex-1 overflow-auto rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20">
  <SyntaxHighlighter
    language={item.language}
    style={isDarkMode ? oneDark : oneLight} // optional dark/light switching
    className="p-5 m-0 text-sm"
  >
    {contentToShow}
  </SyntaxHighlighter>
</div>
        </div>
      );
    }

    return null;
  };

  return (
  <div className="relative flex h-screen p-3 bg-muted/50">
    <aside
      className={cn(
        "flex flex-col bg-background transition-all duration-500 shadow-sm overflow-hidden rounded-xl border border-border",
        menuOpen ? "w-[600px] mx-auto" : "w-0 opacity-0 invisible"
      )}
    >
      {/* HEADER */}
      <div className="px-6 py-4 flex justify-between items-center border-b border-border">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <div className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>

        <button
          onClick={() => dispatch(toggleChatPanelPadding("chat"))}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={15} />
        </button>
      </div>

      {/* NAV BAR */}
      <div className="bg-muted/50 px-6 py-3 flex items-center gap-3">
        <div className="flex items-center gap-1 mr-2">
          <button
            onClick={goToPrev}
            disabled={media.length <= 1}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={goToNext}
            disabled={media.length <= 1}
            className="p-1.5 hover:bg-accent rounded-md disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* URL BAR */}
        <div className="flex items-center gap-3 flex-1 bg-background px-4 py-2 rounded-xl border border-border">
          <Globe size={14} className="text-muted-foreground" />

          <span className="text-[11px] text-muted-foreground font-mono truncate">
            {media[activeIndex]
              ? media[activeIndex].type === "image"
                ? "manus.ai/vision/output"
                : `manus.ai/workspace/${media[activeIndex].name}`
              : "Awaiting AI instruction..."}
          </span>
        </div>

        <ExternalLink
          size={16}
          className="text-muted-foreground opacity-60"
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        {renderContent(media[activeIndex], activeIndex)}
      </div>

      {/* FOOTER */}
      {media.length > 0 && (
        <div className="px-8 py-3 bg-muted border-t border-border flex justify-between text-[10px] text-muted-foreground font-bold uppercase">
          <span>
            Entry {activeIndex + 1} of {media.length}
          </span>
          <span>Agent Computer</span>
        </div>
      )}
    </aside>
  </div>
);
}