"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-zinc-50 dark:bg-black selection:bg-blue-500/30">
      
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 dark:bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Back button */}
      <Link href="/" className="absolute top-8 left-8 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors group z-10">
        <ArrowLeft className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 p-4"
      >
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-3xl shadow-2xl overflow-hidden">
          
          <div className="px-8 pt-10 pb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              {title}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {subtitle}
            </p>
          </div>

          <div className="px-8 pb-10">
            {children}
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
