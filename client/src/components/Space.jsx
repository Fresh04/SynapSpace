import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Space() {
  const { spaceId } = useParams();
  const [space, setSpace] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [tool, setTool] = useState('pen');
  const [eraserSize, setEraserSize] = useState(20);
  const [notes, setNotes] = useState([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const drawingPath = useRef([]);
  const saveTimeout = useRef(null);

  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/${spaceId}`);
        const data = await res.json();
        setSpace(data);

        if (data?.drawing?.length) {
          setTimeout(() => restoreDrawing(data.drawing), 500);
        }
      } catch (err) {
        console.error("Failed to fetch space data", err);
      }
    };

    fetchSpace();

    socket.emit('join-room', spaceId);

    socket.on('receive-drawing', ({ x0, y0, x1, y1, tool: incomingTool, size }) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.save();
      if (incomingTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = size || 20;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
      }
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.restore();
    });

    return () => {
      socket.off('receive-drawing');
    };
  }, [spaceId]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
  }, []);

  const startDrawing = (e) => {
    if (!drawMode) return;
    isDrawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const stopDrawing = () => {
    if (!drawMode) return;
    isDrawing.current = false;
    ctxRef.current.closePath();
    saveDrawing(drawingPath.current);
  };

  const draw = (e) => {
    if (!drawMode || !isDrawing.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const { lastX, lastY } = ctxRef.current;

    if (tool === 'eraser') {
      ctxRef.current.globalCompositeOperation = 'destination-out';
      ctxRef.current.lineWidth = eraserSize;
    } else {
      ctxRef.current.globalCompositeOperation = 'source-over';
      ctxRef.current.lineWidth = 2;
      ctxRef.current.strokeStyle = 'white';
    }

    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();

    socket.emit('drawing-data', {
      spaceId,
      data: {
        x0: lastX,
        y0: lastY,
        x1: offsetX,
        y1: offsetY,
        tool,
        size: tool === 'eraser' ? eraserSize : undefined,
      },
    });

    drawingPath.current.push({
      x0: lastX,
      y0: lastY,
      x1: offsetX,
      y1: offsetY,
      tool,
      size: tool === 'eraser' ? eraserSize : 2,
    });


    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const saveDrawing = async (drawingData) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/${spaceId}/save-drawing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drawing: drawingData }),
        });
        if (!res.ok) throw new Error('Failed to save drawing');
      } catch (err) {
        console.error('Saving drawing failed:', err);
      }
    }, 500);
  };

  const restoreDrawing = (drawingData) => {
    const ctx = ctxRef.current;
    if (!ctx || !Array.isArray(drawingData)) return;
    for (const { x0, y0, x1, y1, tool, size } of drawingData) {
    ctx.save();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size || 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'white';
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  }

    drawingPath.current = drawingData;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4">
      <h1 className="text-3xl font-bold mb-4">
        {space ? `Workspace: ${space.name}` : 'Loading...'}
      </h1>

      <div className="flex gap-4">
        <div className="w-3/4 h-[80vh] bg-[#1e1e1e] rounded-xl border border-gray-700 relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
          />
        </div>

        <div className="w-1/4 p-4 bg-[#1a1a1a] rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Tools</h2>
          <ul className="space-y-3">
            <li>
              <button
                className="w-full bg-yellow-300 text-black px-4 py-2 rounded"
                onClick={() => alert('Sticky Note - coming soon')}
              >
                Sticky Note
              </button>
            </li>
            <li className="relative">
              <button
                className={`w-full px-4 py-2 rounded ${tool === 'eraser' ? 'bg-green-400 text-black' : 'bg-[#00ffff] text-black'}`}
                onClick={() => {
                  setTool('eraser');
                  setDrawMode(true);
                }}
              >
                Eraser
              </button>
              {tool === 'eraser' && (
                <select
                  value={eraserSize}
                  onChange={(e) => setEraserSize(parseInt(e.target.value))}
                  className="absolute left-0 mt-2 bg-white text-black border border-gray-500 rounded px-2 py-1 text-sm shadow"
                >
                  <option value={10}>10px</option>
                  <option value={20}>20px</option>
                  <option value={30}>30px</option>
                  <option value={40}>40px</option>
                  <option value={50}>50px</option>
                </select>
              )}
            </li>
            <li>
              <button
                className={`w-full px-4 py-2 rounded ${drawMode && tool === 'pen' ? 'bg-green-400 text-black' : 'bg-[#00ffff] text-black'}`}
                onClick={() => {
                  setTool('pen');
                  setDrawMode(true);
                }}
              >
                {drawMode && tool === 'pen' ? 'Drawing Mode On' : 'Draw'}
              </button>
            </li>
            <li>
              <button
                className="w-full bg-gray-600 text-white px-4 py-2 rounded cursor-not-allowed"
                disabled
              >
                Ask AI (disabled)
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}