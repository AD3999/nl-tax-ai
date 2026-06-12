import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import Footer from "./Footer";

// Routes that should NOT show a footer
const NO_FOOTER = new Set(["/chat"]);

export default function PublicLayout() {
  const { pathname } = useLocation();
  const showFooter = !NO_FOOTER.has(pathname);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <TopNav />
      <Outlet />
      {showFooter && <Footer />}
    </div>
  );
}
