import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Space() {
  const { spaceId } = useParams();
  const [space, setSpace] = useState(null);
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  useEffect(() => {
    const fetchSpace = async () => {
      try {
        console.log(spaceId);
        const res = await fetch(`${API_BASE}/spaces/${spaceId}`);
        const data = await res.json();
        setSpace(data);
        console.log(data);
      } catch (err) {
        console.error("Failed to fetch space data", err);
      }
    };
    fetchSpace();
  }, [spaceId]);

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      <h1 className="text-3xl font-bold mb-4">
        {space ? `Workspace: ${space.name}` : 'Loading...'}
      </h1>

      <div className="flex gap-4">
        <div className="w-3/4 h-[80vh] bg-[#1e1e1e] rounded-xl border border-gray-700">
          <p className="text-center text-gray-400 pt-10">Canvas Area (Coming Soon)</p>
        </div>
        <div className="w-1/4 p-4 bg-[#1a1a1a] rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Tools</h2>
          <ul className="space-y-3">
            <li><button className="w-full bg-[#00ffff] text-black px-4 py-2 rounded">Sticky Note</button></li>
            <li><button className="w-full bg-[#00ffff] text-black px-4 py-2 rounded">Draw</button></li>
            <li><button className="w-full bg-[#00ffff] text-black px-4 py-2 rounded">Ask AI (disabled)</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
