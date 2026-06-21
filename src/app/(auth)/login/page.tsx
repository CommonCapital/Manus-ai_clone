"use client"
import { signIn } from "next-auth/react"
import React from 'react'

function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className='text-center text-gray-600 mb-8'>Sign in to continue to your account</p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex items-center gap-3 w-full justify-center bg-white border border-gray-300 rounded-lg p-3 hover:bg-gray-50 transition-colors font-medium text-gray-700"
        >
          {/* Official Google SVG Icon */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"
            />
            <path
              fill="#4285F4"
              d="M16.04 15.345c-1.077.736-2.423 1.164-4.04 1.164-2.955 0-5.46-1.99-6.355-4.664L1.57 14.93C3.582 18.91 7.69 21.636 12 21.636c3.164 0 6.027-1.127 8.218-3.064l-4.178-3.227Z"
            />
            <path
              fill="#FBBC05"
              d="M5.684 11.845a7.144 7.144 0 0 1 0-2.08l-4.026-3.115a11.917 11.917 0 0 0 0 8.31l4.026-3.115Z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.275c0-.664-.063-1.309-.173-1.927H12v3.655h6.445a5.525 5.525 0 0 1-2.4 3.627l4.177 3.227c2.445-2.255 3.868-5.573 3.868-9.582Z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  )
}

export default Page
