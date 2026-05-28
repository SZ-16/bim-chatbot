"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const router = useRouter();

  const handleRegister = () => {
    if (!username || !email || !password || !confirmPassword) {
      setAuthError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    
    // Mock saving the user session so the Chat page can access it
    localStorage.setItem("chat_username", username);
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
          <p className="text-stone-400 text-sm">Create a new account</p>
        </div>

        {/* Register Form */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 space-y-4">
          {authError && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {authError}
            </p>
          )}
          
          <div className="space-y-1">
            <label className="text-xs text-stone-400">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="yourname" 
              className="w-full bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-stone-400">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
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
              placeholder="••••••••" 
              className="w-full bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-stone-400">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && handleRegister()} 
              placeholder="••••••••" 
              className="w-full bg-stone-800 text-stone-100 rounded-xl px-3 py-2 text-sm outline-none placeholder-stone-500 border border-stone-700 focus:border-amber-500/50 transition-colors" 
            />
          </div>
          
          <button 
            onClick={handleRegister} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            Create Account
          </button>
        </div>

        {/* Footer Link */}
        <p className="text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}