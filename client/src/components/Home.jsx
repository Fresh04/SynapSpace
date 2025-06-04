import { Link } from 'react-router-dom';
import Header from './Header';

export default function Home() {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <>
      <Header />
      <div className="pt-24 w-full h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center px-4">
        <h1 className="text-5xl font-bold text-white mb-10 text-center">Welcome to SynapSpace</h1>

        {user ? (
          <>
            <p className="text-2xl mb-8 text-center">Hello, {user.username}!</p>
            <Link to="/dashboard">
              <button className="w-64 h-20 bg-[#00ffff] text-black text-xl font-semibold rounded-xl hover:bg-[#1ff] transition-all duration-300 shadow-lg">
                Go to Dashboard
              </button>
            </Link>
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-6">
            <Link to="/login">
              <button className="w-64 h-20 bg-[#00ffff] text-black text-xl font-semibold rounded-xl hover:bg-[#1ff] transition-all duration-300 shadow-lg">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="w-64 h-20 bg-[#00ffff] text-black text-xl font-semibold rounded-xl hover:bg-[#1ff] transition-all duration-300 shadow-lg">
                Register
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}