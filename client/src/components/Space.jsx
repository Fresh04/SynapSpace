import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Header from '../components/Header';
import { FaPencilAlt, FaEraser, FaStickyNote, FaRobot, FaFont } from 'react-icons/fa';

const socket = io(import.meta.env.VITE_BACKEND_URL);

export default function Space() {
  const { spaceId } = useParams();
  const [space, setSpace] = useState(null);
  const [drawMode, setDrawMode] = useState(false);
  const [tool, setTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [strokeSize, setStrokeSize] = useState(2);
  const [bgColor, setBgColor] = useState('#1e1e1e');
  const [eraserSize, setEraserSize] = useState(20);
  const [textFields, setTextFields] = useState([]);
  const [showPenOptions, setShowPenOptions] = useState(false);
  const [showEraserOptions, setShowEraserOptions] = useState(false);
  const [actions, setActions] = useState([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const saveTimeout = useRef(null);
  const eraserRef = useRef();
  const penRef = useRef();

  const API_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/${spaceId}`);
        const data = await res.json();
        setSpace(data);
        if (data?.strokes) {
          setActions(data.strokes);
        }
      } catch (err) {
        console.error("Failed to fetch space data", err);
      }
    };

    fetchSpace();
    socket.emit('join-room', spaceId);

    socket.on('receive-drawing', (stroke) => {
      drawStroke(stroke);
      setActions(prev => [...prev, stroke]);
    });

    const handleClickOutside = (event) => {
      if (eraserRef.current && !eraserRef.current.contains(event.target)) {
        setShowEraserOptions(false);
      }
      if (penRef.current && !penRef.current.contains(event.target)) {
        setShowPenOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      socket.off('receive-drawing');
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [spaceId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 3000;
    canvas.height = 2000;
    const ctx = canvas.getContext('2d');
    // ctx.fillStyle = bgColor;
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
    actions.forEach(drawStroke);
  }, [bgColor, actions]);

  const drawStroke = ({ x0, y0, x1, y1, tool, size, color }) => {
    const ctx = ctxRef.current;
    ctx.save();
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = size;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.restore();
  };


  const startDrawing = (e) => {
    if (!drawMode || tool === 'text') return;
    isDrawing.current = true;
    const { offsetX, offsetY } = e.nativeEvent;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const stopDrawing = () => {
    if (!drawMode || tool === 'text') return;
    isDrawing.current = false;
    ctxRef.current.closePath();
    saveStrokes();
  };

  const draw = (e) => {
    if (!drawMode || !isDrawing.current || tool === 'text') return;
    const { offsetX, offsetY } = e.nativeEvent;
    const { lastX, lastY } = ctxRef.current;

    const stroke = {
      x0: lastX,
      y0: lastY,
      x1: offsetX,
      y1: offsetY,
      tool,
      size: tool === 'eraser' ? eraserSize : strokeSize,
      color: strokeColor,
    };

    drawStroke(stroke);
    socket.emit('drawing-data', { spaceId, data: stroke });
    setActions(prev => [...prev, stroke]);

    ctxRef.current.lastX = offsetX;
    ctxRef.current.lastY = offsetY;
  };

  const saveStrokes = async () => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/${spaceId}/save-strokes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strokes: actions }),
        });
        if (!res.ok) throw new Error('Failed to save strokes');
      } catch (err) {
        console.error('Saving strokes failed:', err);
      }
    }, 500);
  };

  const handleCanvasClick = (e) => {
    if (tool === 'text') {
      const { offsetX, offsetY } = e.nativeEvent;
      const newTextField = {
        id: Date.now(),
        x: offsetX,
        y: offsetY,
        text: '',
        editing: true
      };
      setTextFields(prev => [...prev, newTextField]);
    }
  };

  const updateTextField = (id, newText) => {
    setTextFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, text: newText } : field
      )
    );
  };

  const finalizeTextField = (id) => {
    setTextFields(prev =>
      prev.map(field =>
        field.id === id ? { ...field, editing: false } : field
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white pt-24">
      <Header />
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            {space ? `Workspace: ${space.name}` : 'Loading...'}
          </h1>
          <div className="flex items-center gap-2">
            <span>Canvas:</span>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              title="Background Color"
              className="w-8 h-8 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-4 bg-[#1a1a1a] p-4 rounded-xl border border-gray-700">
            <button onClick={() => alert('Sticky Note - coming soon')} className="hover:text-[#00ffff]">
              <FaStickyNote size={24} />
            </button>

            <div className="relative" ref={eraserRef}>
              <button
                onClick={() => {
                  setTool('eraser');
                  setDrawMode(true);
                  setShowEraserOptions(prev => !prev);
                }}
                className={`hover:text-[#00ffff] ${tool === 'eraser' ? 'text-green-400' : ''}`}
              >
                <FaEraser size={24} />
              </button>
              {showEraserOptions && (
                <div className="absolute left-10 top-0 bg-[#2a2a2a] p-3 rounded-xl border border-gray-600 shadow-xl z-10 w-40 space-y-2">
                  <label className="block text-xs mb-1">Eraser Size</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="relative" ref={penRef}>
              <button
                onClick={() => {
                  setTool('pen');
                  setDrawMode(true);
                  setShowPenOptions(prev => !prev);
                }}
                className={`hover:text-[#00ffff] ${tool === 'pen' ? 'text-green-400' : ''}`}
              >
                <FaPencilAlt size={24} />
              </button>
              {showPenOptions && (
                <div className="absolute left-10 top-0 bg-[#2a2a2a] p-3 rounded-xl border border-gray-600 shadow-xl z-10 w-40 space-y-2">
                  <label className="block text-xs mb-1">Stroke Color</label>
                  <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-full" />
                  <label className="block text-xs mt-2 mb-1">Stroke Size</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={strokeSize}
                    onChange={(e) => setStrokeSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setTool('text');
                setDrawMode(false);
              }}
              className={`hover:text-[#00ffff] ${tool === 'text' ? 'text-green-400' : ''}`}
            >
              <FaFont size={24} />
            </button>
          </div>

          <div className="w-3/4 h-[80vh] overflow-hidden bg-gray-800 rounded-xl border border-gray-700 relative">
            <div className="overflow-scroll w-full h-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <canvas
                ref={canvasRef}
                className="w-[3000px] h-[2000px]"
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onClick={handleCanvasClick}
              />
              {textFields.map((field) =>
                field.editing ? (
                  <textarea
                    key={field.id}
                    style={{ position: 'absolute', top: field.y, left: field.x, color: 'black' }}
                    className="absolute bg-white text-black p-1 rounded"
                    value={field.text}
                    onChange={(e) => updateTextField(field.id, e.target.value)}
                    onBlur={() => finalizeTextField(field.id)}
                    autoFocus
                  />
                ) : (
                  <div
                    key={field.id}
                    style={{ position: 'absolute', top: field.y, left: field.x }}
                    className="absolute text-white cursor-pointer"
                    onClick={() => setTextFields(prev => prev.map(tf => tf.id === field.id ? { ...tf, editing: true } : tf))}
                  >
                    {field.text}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="w-1/4 p-4 bg-[#1a1a1a] rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FaRobot /> AI Panel (coming soon)
            </h2>
            <p className="text-gray-400 text-sm">Smart suggestions and chat will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
