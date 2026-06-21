'use client';

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ConvertMarkdownToText = memo(function MarkdownBubble({text}: {text: string}) {
    return (
        <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
            a: ({node, ...props}) => (
                <a
{...props}
className="underline underline-offset-2 mr-1"
target="_blank"
rel="noreferrer"

                />

            ),
            ul: ({node, ...props}) => (
                <ul className="list-disc list-inside space-y-2 mb-5" {...props} />
            ),
            ol: ({node, ...props}) => (
                <ol className="list-decimal " {...props} />
            ),
            li: ({node, ...props}) => (
               <li className="ml-4" {...props} />
            )


        }}

        >
            {text}
        </ReactMarkdown>
    )
})