"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    if (!email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    
    // Mock saving the user session so the Chat page can access it
    localStorage.setItem("chat_username", email.split("@")[0]);
    localStorage.setItem("chat_email", email);
    setAuthError("");
    
    // Redirect to the main chat interface
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-stone-950 text-stone-100 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🏗️</div>
          <h1 className="text-3xl font-bold text-amber-400">BIM Chatbot</h1>
          <p className="text-stone-400 text-sm">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          {authError && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {authError}
            </p>
          )}
          
          <div className="space-y-1">
            <label className="text-xs text-stone-400">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} 
              placeholder="you@example.com" 
              className="w-full bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-stone-400">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} 
              placeholder="••••••••" 
              className="w-full bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <button 
            onClick={handleLogin} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-stone-500">
          Don't have an account?{" "}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}