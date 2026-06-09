import React from 'react';
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  icon?: LucideIcon
  isLoading?: boolean
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon: Icon,
  isLoading,
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-zinc-900"
  
  const variants = {
    primary: "bg-zinc-100 text-zinc-900 hover:bg-white focus-visible:ring-zinc-300",
    secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700 focus-visible:ring-zinc-500",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus-visible:ring-zinc-500",
    danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 focus-visible:ring-red-500"
  }

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10"
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={children ? "mr-2 h-4 w-4" : "h-4 w-4"} />
      ) : null}
      {children}
    </button>
  )
}
