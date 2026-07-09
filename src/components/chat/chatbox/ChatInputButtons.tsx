
"use client";

import { useState, useRef } from "react";
import { Paperclip, ImageIcon, Loader2, ScreenShareIcon, Cpu } from "lucide-react";
import { cn, } from "@/lib/utils";
import { toggleChatPanelPadding, toggleLeftPanels } from "@/store/chatSlice";
import { AppDispatch, RootState } from "@/store";
import { useDispatch } from "react-redux";

const ChatInputButtons = () => {

  const [uploadPdfLoading, setUploadPdfLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
const dispatch = useDispatch<AppDispatch>();



  return (
    <div className="flex items-center gap-3 text-slate-500">
      {/* Hidden file input */}
      <input type="file" className="hidden" ref={fileInputRef} />


       <button onClick={()=>dispatch(toggleChatPanelPadding('computer')) }>
        <ScreenShareIcon size={15} />
      </button>

       <button onClick={()=>dispatch(toggleLeftPanels()) }>
        <Cpu size={15} />
      </button>




    </div>
  );
};

export default ChatInputButtons;
