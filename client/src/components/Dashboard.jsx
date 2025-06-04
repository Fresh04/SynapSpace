import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';
import { FaTrash } from 'react-icons/fa';

export default function Dashboard() {
  const [spaces, setSpaces] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSpaces = async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/myspaces/${user._id}`);
        const data = await res.json();
        setSpaces(data);
      } catch (err) {
        console.error('Failed to load spaces', err);
      }
    };

    fetchSpaces();
  }, []);

  // const handleLogout = () => {
  //   localStorage.removeItem('user');
  //   navigate('/');
  // };

  const handleCreateSpace = async () => {
    const name = prompt("Enter space name:");
    if (!name) return;
    try {
      // console.log(user);
      const res = await fetch(`${API_BASE}/spaces/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, userId: user._id }),
      });
      const data = await res.json();
      // console.log(data);
      navigate(`/space/${data.spaceId}`);
    } catch (err) {
      console.error('Error creating space', err);
    }
  };

  const handleJoinSpace = async () => {
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/spaces/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode, userId: user._id }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Joined space: ${result.joinedSpace}`);
        window.location.reload();
      } else {
        alert("Invalid code");
      }
    } catch (err) {
      console.error("Failed to join space", err);
    }
  };
  const handleDeleteSpace = async (spaceId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this space?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/spaces/${spaceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error("Failed to delete space");

      setSpaces(prev => prev.filter(space => space._id !== spaceId));
    } catch (err) {
      console.error("Error deleting space:", err);
      alert("Could not delete space.");
    }
  };


  return (
    <>
    <div className="min-h-screen bg-[#121212] text-white pt-24">
      <Header />
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Hi, {user?.username} 👋</h1>
          {/* <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button> */}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Create a New Space</h2>
          <button
            onClick={handleCreateSpace}
            className="bg-[#00ffff] text-black text-lg font-semibold px-6 py-4 rounded-xl hover:bg-[#1ff] transition"
          >
            Create New Space
          </button>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Your Previous Spaces</h2>
          {spaces.length === 0 ? (
            <p className="text-gray-400 italic">You haven't created or joined any spaces yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {spaces.map((space) => (
                <div
                  key={space._id}
                  className="bg-[#2a2a2a] p-6 rounded-xl relative hover:bg-[#333] transition cursor-pointer"
                  onClick={() => navigate(`/space/${space._id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold">{space.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">Code: {space.code}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSpace(space._id);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Delete Space"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="bg-[#1a1a1a] p-6 rounded-xl shadow-lg border border-gray-700 w-full max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-6">🔗 Join a Space</h2>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <input
                type="text"
                placeholder="Enter space code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full sm:w-96 px-4 py-3 rounded-lg bg-[#2a2a2a] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00ffff] transition"
              />
              <button
                onClick={handleJoinSpace}
                className="bg-[#00ffff] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#1ff] transition"
              >
                Join
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}