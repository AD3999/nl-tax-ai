import { Bell, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 px-6 flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-gray-900 leading-none">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-gray-700 font-medium max-w-[140px] truncate">
            {user?.email ?? "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
