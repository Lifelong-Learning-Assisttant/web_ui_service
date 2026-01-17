import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { NetrunnerDeck } from './NetrunnerDeck';
import { UnifiedChat } from './UnifiedChat';

export const ChatInterface: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = useAppStore();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative font-mono h-full">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 cyber-scroll bg-background-dark/30">
        <UnifiedChat />
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Netrunner Deck (Bottom Hub) */}
      <NetrunnerDeck mode="chat" />
    </div>
  );
};