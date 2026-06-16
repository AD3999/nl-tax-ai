import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScrollText,
  Calculator,
  Search,
  Settings,
  ChevronLeft,
  Shield,
  Users,
  MessageSquare,
  Building2,
  ClipboardList,
  Activity,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin",                   icon: LayoutDashboard, label: "Overview",            exact: true  },
  { to: "/admin/users",             icon: Users,           label: "Users",               exact: false },
  { to: "/admin/firms",             icon: Building2,       label: "Firms",               exact: false },
  { to: "/admin/chat-logs",         icon: MessageSquare,   label: "Chat Logs",           exact: false },
  { to: "/admin/rules",             icon: ScrollText,      label: "Tax Rules",           exact: false },
  { to: "/admin/audit-logs",        icon: ClipboardList,   label: "Audit Logs",          exact: false },
  { to: "/admin/ai-monitoring",     icon: Activity,        label: "AI Monitor",          exact: false },
  { to: "/admin/calculator-preview",icon: Calculator,      label: "Calculator Preview",  exact: false },
  { to: "/admin/rag-preview",       icon: Search,          label: "RAG Preview",         exact: false },
  { to: "/admin/settings",          icon: Settings,        label: "Settings",            exact: false },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  return (
    <>
      {/* Mobile backdrop — desktop never renders this (sidebar is static there) */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/55 transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      <aside
        className={cn(
          "w-60 flex-shrink-0 bg-slate-900 flex flex-col h-screen admin-scrollbar overflow-y-auto",
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 ease-out",
          "md:sticky md:top-0 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">TaxWijs</p>
              <p className="text-slate-400 text-xs mt-0.5">Admin Dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-blue-600 text-white font-medium"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Back to app */}
        <div className="px-3 py-4 border-t border-slate-700">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-slate-100 text-xs rounded-md hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to App
          </NavLink>
        </div>
      </aside>
    </>
  );
}
