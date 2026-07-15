"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

export default function SettingsTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.icon}
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
