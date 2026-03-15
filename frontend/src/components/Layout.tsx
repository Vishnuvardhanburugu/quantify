import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = () => {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 page-enter" key={location.pathname}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
