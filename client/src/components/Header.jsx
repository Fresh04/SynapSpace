import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    setUser(u);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="bg-[#1a1a1a] text-white w-full shadow-md fixed top-0 left-0 z-50 px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-[#00ffff] hover:text-[#1ff] transition">
        SynapSpace
      </Link>

      {user && (
        <nav className="flex gap-4">
          <Link to="/" className="px-4 py-2 hover:bg-[#333] rounded-lg transition">
            Home
          </Link>
          <Link to="/dashboard" className="px-4 py-2 hover:bg-[#333] rounded-lg transition"> 
            Dashboard 
          </Link>
          <Link to="/changepassword" className="px-4 py-2 hover:bg-[#333] rounded-lg transition">
            Change Password
          </Link>
          <button onClick={handleLogout} className="px-4 py-2 text-red-400 hover:bg-[#333] rounded-lg transition">
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
