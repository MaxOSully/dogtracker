import { useLocation, Link } from "wouter";
import { 
  Home, 
  Users, 
  Calendar, 
  DollarSign 
} from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <aside className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-semibold">PawTracker</h1>
        <p className="text-sm text-gray-400">Dog Grooming Management</p>
      </div>
      <nav className="p-2">
        <ul>
          <li>
            <Link href="/">
              <a className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/") ? "bg-gray-700" : ""}`}>
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </Link>
          </li>
          <li>
            <Link href="/clients">
              <a className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/clients") ? "bg-gray-700" : ""}`}>
                <Users className="h-5 w-5 mr-3" />
                Clients
              </a>
            </Link>
          </li>
          <li>
            <Link href="/appointments">
              <a className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 mb-1 ${isActive("/appointments") ? "bg-gray-700" : ""}`}>
                <Calendar className="h-5 w-5 mr-3" />
                Appointments
              </a>
            </Link>
          </li>
          <li>
            <Link href="/financials">
              <a className={`flex items-center p-3 text-gray-300 rounded hover:bg-gray-700 ${isActive("/financials") ? "bg-gray-700" : ""}`}>
                <DollarSign className="h-5 w-5 mr-3" />
                Financials
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
