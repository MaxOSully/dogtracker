import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div className="bg-gray-100 h-screen flex overflow-hidden">
      {/* Sidebar for larger screens */}
      <Sidebar />
      
      {/* Mobile Header */}
      <MobileHeader 
        isNavOpen={mobileNavOpen} 
        toggleNav={toggleMobileNav} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
