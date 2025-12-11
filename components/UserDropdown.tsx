"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { signOut } from "@/app/actions";
import { motion, AnimatePresence } from "framer-motion";
import { User as UserIcon, LogOut, KeyRound, ChevronDown } from "lucide-react";

export default function UserDropdown({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group p-1 pr-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
            {user.email?.[0].toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col items-start">
            <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{user.email?.split('@')[0]}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-1 z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Conectado como</p>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{user.email}</p>
            </div>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Cambiar Contraseña
            </Link>

            <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

            <form action={signOut}>
                <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors text-left"
                >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
                </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
