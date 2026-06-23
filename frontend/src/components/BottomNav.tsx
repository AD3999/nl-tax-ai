import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, FolderOpen, CheckSquare, MessageSquare, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function BottomNav() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language;
  const hasAccountant = !!user?.has_accountant;

  const L = (nl: string, en: string, fa: string) =>
    lang === "nl" ? nl : lang === "fa" ? fa : en;

  const profileItem = { to: "/client/profile", icon: <User size={20} />, label: L("Profiel", "Profile", "پروفایل") };

  const items = hasAccountant
    ? [
        { to: "/dashboard",        icon: <LayoutDashboard size={20} />, label: L("Home",       "Home",       "خانه") },
        { to: "/client/tasks",     icon: <CheckSquare size={20} />,     label: L("Taken",      "Tasks",      "کارها") },
        { to: "/client/documents", icon: <FolderOpen size={20} />,      label: L("Documenten", "Documents",  "اسناد") },
        profileItem,
        { to: "/chat",             icon: <MessageSquare size={20} />,   label: L("AI",         "AI",         "هوش مصنوعی") },
      ]
    : [
        { to: "/dashboard",        icon: <LayoutDashboard size={20} />, label: L("Home",       "Home",       "خانه") },
        profileItem,
        { to: "/chat",             icon: <MessageSquare size={20} />,   label: L("AI",         "AI",         "هوش مصنوعی") },
      ];

  return (
    <nav
      aria-label="Bottom navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: "var(--z-sidebar)" as unknown as number,
        background: "var(--bg-2)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "stretch",
        height: 60,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          style={({ isActive }) => ({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            textDecoration: "none",
            color: isActive ? "var(--blue)" : "var(--text-3)",
            fontWeight: isActive ? 700 : 500,
            fontSize: "var(--text-xs)",
            letterSpacing: "0.02em",
            transition: "color 120ms",
            paddingBottom: 4,
          })}
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
