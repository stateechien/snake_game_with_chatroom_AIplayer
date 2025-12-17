import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, GameState } from '../types';
import { generateBotChat } from '../services/geminiService';

interface ChatRoomProps {
  gameState: GameState;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ gameState }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastGenTime = useRef<number>(0);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'system-1',
        sender: 'System',
        text: 'Welcome to Snake.io 100! Survive and eat.',
        isSystem: true,
        timestamp: Date.now(),
      }
    ]);
  }, []);

  // Periodic Bot Chat Generation
  useEffect(() => {
    const fetchChat = async () => {
      const now = Date.now();
      // Rate limit: Only fetch every 5-10 seconds to avoid API spam/costs
      if (now - lastGenTime.current < 8000) return;
      lastGenTime.current = now;

      const topSnake = gameState.snakes.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      const player = gameState.snakes.find(s => s.isPlayer);
      
      let context = "General gameplay.";
      if (player?.isDead) context = "The main player just died!";
      else if (topSnake.score > 50) context = `${topSnake.name} is dominating with ${topSnake.score} points!`;

      const newMessages = await generateBotChat(context);
      if (newMessages.length > 0) {
        setMessages(prev => {
           const updated = [...prev, ...newMessages];
           return updated.slice(-50); // Keep last 50
        });
      }
    };

    const interval = setInterval(fetchChat, 2000); // Check regularly if we should fetch
    return () => clearInterval(interval);
  }, [gameState]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'You',
      text: inputValue.trim(),
      timestamp: Date.now(),
      isSystem: false
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/90 border-l border-slate-700 backdrop-blur-sm pointer-events-auto">
      <div className="p-3 border-b border-slate-700 bg-slate-900/50">
        <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Global Chat ({gameState.snakes.length} Online)
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`text-xs ${msg.isSystem ? 'text-yellow-400 italic' : 'text-slate-300'}`}>
            <span className={`font-bold ${msg.sender === 'You' ? 'text-blue-400' : 'text-slate-400'}`}>
              {msg.sender}:
            </span>{' '}
            <span className="break-words">{msg.text}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-2 border-t border-slate-700 bg-slate-900/50">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          className="w-full bg-slate-700 text-white px-3 py-2 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
          onKeyDown={(e) => e.stopPropagation()} // Prevent arrow keys from moving snake while typing
        />
      </form>
    </div>
  );
};

export default ChatRoom;