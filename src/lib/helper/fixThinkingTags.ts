
export function fixThinkingTags(content: string): string {
    if (!content) return "";

    const firstOpening = content.indexOf("<think>");
    const firstClosing = content.indexOf("</think>");

    // Case: </think> exists, but <think> is missing or appears AFTER the closing tag
    if (firstClosing !== -1 && (firstOpening === -1 || firstOpening > firstClosing)) {
        return `<think>${content}`;
    }

    return content;
}