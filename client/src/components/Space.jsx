import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Header from '../components/Header';
import { Rnd } from "react-rnd";
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
  const [remoteCursors, setRemoteCursors] = useState({});
  const [actions, setActions] = useState([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const saveTimeout = useRef(null);
  const eraserRef = useRef();
  const penRef = useRef();
  const userColors = useRef({});
  const API_BASE = import.meta.env.VITE_BACKEND_URL;
  const CURSOR_COLORS = ['#FFB6C1','#ADD8E6','#90EE90','#FFDAB9','#E6E6FA','#FFE4E1','#FFFACD','#D3FFCE','#F0E68C','#E0FFFF'];


  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const res = await fetch(`${API_BASE}/spaces/${spaceId}`);
        const data = await res.json();
        setSpace(data);
        if (data?.strokes) {
          setActions(data.strokes);
        }
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user._id && !data.members.includes(user._id)) {
          await fetch(`${API_BASE}/spaces/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: data.code, userId: user._id })
          });
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctxRef.current = ctx;
    actions.forEach(drawStroke);
  }, [bgColor, actions]);
  
  useEffect(() => {
    socket.on('receive-cursor', ({ userId, username, x, y }) => {
    if (!userColors.current[userId]) {
      const usedColors = Object.values(userColors.current);
      const availableColors = CURSOR_COLORS.filter(c => !usedColors.includes(c));
      const randomColor = availableColors.length > 0
        ? availableColors[Math.floor(Math.random() * availableColors.length)]
        : CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];

      userColors.current[userId] = randomColor;
    }

    setRemoteCursors(prev => ({
      ...prev,
      [userId]: { x, y, username }
    }));

    setTimeout(() => {
      setRemoteCursors(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }, 5000);
  });
  }, []);

  const drawStroke = (stroke) => {
    const ctx = ctxRef.current;
    ctx.save();

    if (stroke.type === 'text') {
      ctx.font = `${stroke.fontSize || 20}px ${stroke.font || 'Comic Sans MS'}`;
      ctx.fillStyle = stroke.color || '#ffffff';
      ctx.textBaseline = 'top'; 
      ctx.fillText(stroke.text, stroke.x, stroke.y);
    } else {
      const { x0, y0, x1, y1, tool, size, color } = stroke;
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = size;
      ctx.strokeStyle = tool === 'pen' ? color : bgColor;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

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
    const user = JSON.parse(localStorage.getItem('user'));
    socket.emit('cursor-move', {
      spaceId,
      userId: user._id,
      username: user.username,
      x: offsetX,
      y: offsetY,
    });
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
        width: 200,
        height: 50,
        text: 'Text here',
        editing: true,
        font: 'Comic Sans MS',
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

    const finalizedField = textFields.find(f => f.id === id);
    if (finalizedField) {
      const textAction = {
        type: 'text',
        x: finalizedField.x,
        y: finalizedField.y,
        text: finalizedField.text,
        font: finalizedField.font || 'Comic Sans MS',
        fontSize: 20,
        color: '#ffffff',
      };
      setActions(prev => [...prev, textAction]);
    }
  };


  return (
    <div className="min-h-screen bg-[#121212] text-white pt-24">
      <Header />
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            {space ? `Workspace: ${space.name}  |  Code: ${space.code}` : 'Loading...'}
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
                style={{
                  cursor: drawMode ? 'crosshair' : 'default'
                }}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                onClick={handleCanvasClick}
              />
              {Object.entries(remoteCursors).map(([id, cursor]) => (
                <div
                  key={id}
                  className="absolute text-xs text-white pointer-events-none"
                  style={{
                    top: cursor.y,
                    left: cursor.x,
                    transform: 'translate(-50%, -50%)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full mb-1"
                    style={{ backgroundColor: userColors.current[id] || '#ccc' }}
                  ></div>
                  <span className = "bg-red">{cursor.username}</span>
                </div>
              ))}

              {textFields.map((field) => (
                <Rnd
                  key={field.id}
                  size={{ width: field.width, height: field.height }}
                  position={{ x: field.x, y: field.y }}
                  onDragStop={(e, d) => {
                    setTextFields(prev =>
                      prev.map(f => f.id === field.id ? { ...f, x: d.x, y: d.y } : f)
                    );
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setTextFields(prev =>
                      prev.map(f =>
                        f.id === field.id
                          ? {
                              ...f,
                              width: parseInt(ref.style.width),
                              height: parseInt(ref.style.height),
                              x: position.x,
                              y: position.y,
                            }
                          : f
                      )
                    );
                  }}
                  bounds="parent"
                >
                  {field.editing ? (
                    <textarea
                      value={field.text}
                      autoFocus
                      onChange={(e) =>
                        updateTextField(field.id, e.target.value)
                      }
                      onBlur={() => finalizeTextField(field.id)}
                      className="w-full h-full resize-none p-1 rounded bg-white text-black font-[Comic_Sans_MS] outline-none"
                      style={{
                        fontFamily: 'Comic Sans MS',
                        fontSize: '20px',
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full p-1 cursor-move text-white rounded"
                      onDoubleClick={() =>
                        setTextFields(prev =>
                          prev.map(f => f.id === field.id ? { ...f, editing: true } : f)
                        )
                      }
                      style={{
                        fontFamily: 'Comic Sans MS',
                        fontSize: '20px',
                        overflow: 'hidden',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {field.text}
                    </div>
                  )}
                </Rnd>
              ))}
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
