import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JoinSpace() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !code) {
      setError('Missing user or room code');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/spaces/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user._id }),
      });

      const data = await res.json();

      if (res.ok) {
        navigate(`/space/${data.spaceId}`);
      } else {
        setError(data.message || 'Failed to join');
      }
    } catch (err) {
      setError('Something went wrong');
      console.error(err);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-2">Join a Space</h2>
      <input
        type="text"
        placeholder="Enter Room Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full p-2 border mb-2 rounded"
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        onClick={handleJoin}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Join
      </button>
    </div>
  );
}
