import { Bell, Menu, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export function AdminTopbar({ title, subtitle, onMenuClick }: AdminTopbarProps) {
  const { user } = useAuth();

  return (
    <header className="h-14 px-3 md:px-6 flex items-center justify-between border-b border-gray-200 bg-white flex-shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="md:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-gray-900 leading-none truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="hidden sm:inline text-sm text-gray-700 font-medium max-w-[140px] truncate">
            {user?.email ?? "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
}
