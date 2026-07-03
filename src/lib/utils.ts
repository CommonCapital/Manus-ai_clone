import { clsx, type ClassValue } from "clsx"

import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function truncateTitle(title:string, maxLength =26):string {
  if (!title) return "";
  return title.length > maxLength
  ? title.substring(0, maxLength) + "..."
  : title;
}