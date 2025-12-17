import React, { useRef, useEffect } from 'react';
import { GameState, Point } from '../types';
import { WORLD_SIZE, VIEWPORT_WIDTH } from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  className?: string;
}

const CELL_SIZE = 20; // Pixel size of one grid cell on canvas (virtual zoom level)

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing logic
    // We render a viewport of VIEWPORT_WIDTH x VIEWPORT_WIDTH
    // But we want it to fill the screen or container.
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }

    // Clear
    ctx.fillStyle = '#0f172a'; // Match bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate scaling to fit the viewport into the canvas
    // We want to show 'VIEWPORT_WIDTH' cells horizontally
    const scale = canvas.width / (VIEWPORT_WIDTH * CELL_SIZE);
    
    ctx.save();
    
    // Camera Transform
    // Center the camera on the canvas
    const camX = gameState.camera.x * CELL_SIZE;
    const camY = gameState.camera.y * CELL_SIZE;
    
    // We want the camera position to be at the center of the canvas?
    // Actually, usually camera is top-left of visible area.
    // Let's assume gameState.camera is top-left of viewport in grid coords.
    
    // Scale everything
    ctx.scale(scale, scale);
    
    // Translate "world" so that camera (top-left) is at 0,0
    ctx.translate(-camX, -camY);

    // Draw Grid (Optional, for visual reference)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Only draw grid in visible area to save perf
    const startX = Math.floor(gameState.camera.x);
    const endX = startX + VIEWPORT_WIDTH + 1;
    const startY = Math.floor(gameState.camera.y);
    // Aspect ratio correction for height
    const visibleHeightCells = (canvas.height / scale) / CELL_SIZE;
    const endY = startY + visibleHeightCells + 1;

    for (let x = startX; x <= endX; x++) {
      ctx.moveTo(x * CELL_SIZE, startY * CELL_SIZE);
      ctx.lineTo(x * CELL_SIZE, endY * CELL_SIZE);
    }
    for (let y = startY; y <= endY; y++) {
      ctx.moveTo(startX * CELL_SIZE, y * CELL_SIZE);
      ctx.lineTo(endX * CELL_SIZE, y * CELL_SIZE);
    }
    ctx.stroke();

    // Draw World Borders
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, WORLD_SIZE * CELL_SIZE, WORLD_SIZE * CELL_SIZE);

    // Draw Food
    gameState.foods.forEach(food => {
      // Culling
      if (food.position.x < startX || food.position.x > endX || food.position.y < startY || food.position.y > endY) return;

      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(
        food.position.x * CELL_SIZE + CELL_SIZE / 2, 
        food.position.y * CELL_SIZE + CELL_SIZE / 2, 
        CELL_SIZE / 3, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      
      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = food.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Snakes
    gameState.snakes.forEach(snake => {
      if (snake.isDead && !snake.isPlayer) return; // Don't draw dead bots? Or maybe render them as gray.

      // Optimization: Only draw if any part is visible? 
      // Checking bounding box of snake is complex, let's just draw all for now (N=100 is fine on canvas).
      // Actually, minimal culling: check head.
      // if (Math.abs(snake.body[0].x - (startX + VIEWPORT_WIDTH/2)) > VIEWPORT_WIDTH && ... ) 
      
      ctx.fillStyle = snake.isDead ? '#475569' : snake.color;
      ctx.strokeStyle = '#0f172a'; // outline
      ctx.lineWidth = 1;

      snake.body.forEach((segment, i) => {
         // Culling per segment
         if (segment.x < startX - 2 || segment.x > endX + 2 || segment.y < startY - 2 || segment.y > endY + 2) return;

         const x = segment.x * CELL_SIZE;
         const y = segment.y * CELL_SIZE;

         // Draw rect slightly smaller for segment effect
         ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
         ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
         
         // Eyes for Head
         if (i === 0 && !snake.isDead) {
            ctx.fillStyle = 'white';
            // Simple logic for eyes based on velocity would be cool, but just fixed eyes for now
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE * 0.3, y + CELL_SIZE * 0.3, 3, 0, Math.PI * 2);
            ctx.arc(x + CELL_SIZE * 0.7, y + CELL_SIZE * 0.3, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = snake.isPlayer ? '#ffffff' : snake.color; // Reset
         }
      });
      
      // Name tag above head
      if (!snake.isDead && snake.body[0]) {
        const head = snake.body[0];
        if (head.x >= startX && head.x <= endX && head.y >= startY && head.y <= endY) {
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(snake.name, head.x * CELL_SIZE + CELL_SIZE/2, head.y * CELL_SIZE - 5);
        }
      }

    });

    ctx.restore();

  }, [gameState]);

  return <canvas ref={canvasRef} className={className} />;
};

export default GameCanvas;