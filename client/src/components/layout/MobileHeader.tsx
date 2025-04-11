import { Menu } from "lucide-react";
import { useLocation, Link } from "wouter";

type MobileHeaderProps = {
  isNavOpen: boolean;
  toggleNav: () => void;
};

const MobileHeader = ({ isNavOpen, toggleNav }: MobileHeaderProps) => {
  const [location] = useLocation();

  const closeMobileNav = () => {
    if (isNavOpen) toggleNav();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800 text-white w-full p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">PawTracker</h1>
        <button onClick={toggleNav} className="text-gray-300 hover:text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      {/* Mobile Menu */}
      <div className={`md:hidden fixed inset-0 z-10 bg-gray-800 text-white transform ${isNavOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`} style={{ top: '64px' }}>
        <nav className="p-2">
          <ul>
            <li>
              <Link href="/">
                <a 
                  onClick={closeMobileNav}
                  className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/") ? "bg-gray-700" : ""}`}
                >
                  Dashboard
                </a>
              </Link>
            </li>
            <li>
              <Link href="/clients">
                <a 
                  onClick={closeMobileNav}
                  className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/clients") ? "bg-gray-700" : ""}`}
                >
                  Clients
                </a>
              </Link>
            </li>
            <li>
              <Link href="/appointments">
                <a 
                  onClick={closeMobileNav}
                  className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/appointments") ? "bg-gray-700" : ""}`}
                >
                  Appointments
                </a>
              </Link>
            </li>
            <li>
              <Link href="/financials">
                <a 
                  onClick={closeMobileNav}
                  className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 ${isActive("/financials") ? "bg-gray-700" : ""}`}
                >
                  Financials
                </a>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default MobileHeader;
