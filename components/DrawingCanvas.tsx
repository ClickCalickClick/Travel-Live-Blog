import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Trash2, Check, Palette } from 'lucide-react';
import { Button } from './ui/button';

interface DrawingCanvasProps {
  onSave: (imageBlob: Blob) => void;
  onCancel: () => void;
}

const COLORS = [
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Black', value: '#000000' },
];

export function DrawingCanvas({ onSave, onCancel }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Fill with white background
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob);
      }
    }, 'image/png');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Color Picker */}
      <div className="flex items-center gap-2 p-4 bg-slate-100 border-b border-slate-200 overflow-x-auto">
        <Palette className="w-5 h-5 text-slate-600 flex-shrink-0" />
        {COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setCurrentColor(color.value)}
            className={`w-10 h-10 rounded-full flex-shrink-0 transition-transform ${
              currentColor === color.value ? 'ring-4 ring-slate-400 scale-110' : 'hover:scale-105'
            }`}
            style={{ backgroundColor: color.value }}
            aria-label={`Select ${color.name}`}
          />
        ))}
      </div>

      {/* Brush Size */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 border-b border-slate-200">
        <span className="text-sm text-slate-600">Brush Size:</span>
        <input
          type="range"
          min="2"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="flex-1"
        />
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center"
          style={{ backgroundColor: currentColor }}
        >
          <div
            className="rounded-full bg-white"
            style={{ width: `${brushSize}px`, height: `${brushSize}px` }}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-white touch-none">
        <canvas
          ref={canvasRef}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 p-4 bg-slate-100 border-t border-slate-200">
        <Button
          onClick={clearCanvas}
          variant="outline"
          className="flex-1"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={saveDrawing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="w-4 h-4 mr-2" />
          Send to Dad
        </Button>
      </div>
    </div>
  );
}
