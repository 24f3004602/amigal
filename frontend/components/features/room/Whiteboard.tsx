'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRoomStore } from '@/stores/room.store';
import { Button } from '@/components/ui/Button';
import { Pencil, Eraser, Minus, Square, Circle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'circle';

const COLORS = ['#ffffff', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export function Whiteboard({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#ffffff');
  const [width, setWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const snapshotRef = useRef<ImageData | null>(null);

  const { whiteboard, addStroke, clearWhiteboard } = useRoomStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    whiteboard.forEach((stroke) => {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.beginPath();

      if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
        stroke.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (stroke.tool === 'line' && stroke.points.length === 2) {
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
        ctx.stroke();
      } else if (stroke.tool === 'rect' && stroke.points.length === 2) {
        const [p1, p2] = stroke.points;
        ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
      } else if (stroke.tool === 'circle' && stroke.points.length === 2) {
        const [p1, p2] = stroke.points;
        const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }, [whiteboard]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === 'pen' || tool === 'eraser') {
      addStroke({
        id: Math.random().toString(36).slice(2),
        points: [pos],
        color: tool === 'eraser' ? '#000000' : color,
        width: tool === 'eraser' ? width * 4 : width,
        tool,
      });
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPos(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      const lastStroke = whiteboard[whiteboard.length - 1];
      if (lastStroke) {
        addStroke({
          ...lastStroke,
          points: [...lastStroke.points, pos],
        });
      }
    } else {
      // Restore snapshot for shapes
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();

      if (tool === 'line') {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
        ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool !== 'pen' && tool !== 'eraser') {
      const pos = getPos(e as any);
      addStroke({
        id: Math.random().toString(36).slice(2),
        points: [startPos, pos],
        color,
        width,
        tool,
      });
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 bg-black/90 backdrop-blur-sm"
    >
      {/* Toolbar */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2 rounded-2xl glass p-2">
        {[
          { id: 'pen' as Tool, icon: Pencil },
          { id: 'eraser' as Tool, icon: Eraser },
          { id: 'line' as Tool, icon: Minus },
          { id: 'rect' as Tool, icon: Square },
          { id: 'circle' as Tool, icon: Circle },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={cn(
              'rounded-xl p-2.5 transition-colors',
              tool === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
            title={t.id}
          >
            <t.icon className="h-4 w-4" />
          </button>
        ))}
        <div className="h-px bg-border my-1" />
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={cn(
              'h-6 w-6 rounded-full border-2 transition-transform',
              color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'
            )}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <div className="h-px bg-border my-1" />
        <button onClick={clearWhiteboard} className="rounded-xl p-2.5 text-destructive hover:bg-destructive/10" title="Clear">
          <Trash2 className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="h-full w-full cursor-crosshair touch-none"
      />
    </motion.div>
  );
}
