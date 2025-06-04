import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';

export default function Dashboard() {
  const [spaces, setSpaces] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/login');
    setSpaces([
      { id: '123abc', name: 'Marketing Plan Q3' },
      { id: '456def', name: 'Product Roadmap' },
    ]);
  }, []);

  const handleCreateSpace = () => {
    alert('Redirect to space creation page');
  };

  const handleJoinSpace = () => {
    if (joinCode.trim()) alert(`Joining space with code: ${joinCode}`);
  };

  return (
    <>
      <Header />
      <div className="pt-24 min-h-screen bg-[#1a1a1a] text-white px-6 py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-12">Hi, {user?.username} 👋</h1>

          {/* Create New Space */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Create a New Space</h2>
            <button onClick={handleCreateSpace} className="bg-[#00ffff] text-black text-lg font-semibold px-6 py-4 rounded-xl hover:bg-[#1ff] transition">
              + New Space
            </button>
          </div>

          {/* Previous Spaces */}
          <div className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Your Previous Spaces</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {spaces.map((space) => (
                <div key={space.id} className="bg-[#2a2a2a] p-6 rounded-xl cursor-pointer hover:bg-[#333] transition">
                  <h3 className="text-xl font-bold">{space.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">ID: {space.id}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Join Space */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Join a Space</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input type="text" placeholder="Enter space code..." value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="w-full sm:w-96 px-4 py-3 text-black rounded-lg" />
              <button onClick={handleJoinSpace} className="bg-[#00ffff] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#1ff] transition">
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
