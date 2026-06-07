'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';

export default function Home() {
  // 1. Destructure the updated v5 properties
  const { messages, sendMessage, status } = useChat();
  
  // 2. Manage the input state natively using React state
  const [input, setInput] = useState('');

  // 3. Custom form submit handler utilizing v5's sendMessage object parameters
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    sendMessage({ text: input });
    setInput(''); // Clear input box after transmission
  };

  return (
    <main className="flex flex-col items-center justify-between min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
      {/* Header Banner */}
      <div className="w-full max-w-2xl text-center pt-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center justify-center gap-2">
          🎈 Boston Balloon Factory
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          AI Platform Concierge — Live Sandbox Blueprint
        </p>
      </div>

      {/* Chat Conversation Box */}
      <div className="flex-1 w-full max-w-2xl overflow-y-auto my-6 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 min-h-[400px] max-h-[60vh]">
        {messages.length === 0 && (
          <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
            <p className="font-medium">No messages yet.</p>
            <p className="text-xs mt-1">Try asking about delivery to Quincy or pricing for a 12ft arch!</p>
          </div>
        )}

        {messages.map((message) => {
          // Check if this message ONLY contains tool calls (and no conversational text yet)
          const hasText = message.parts?.some(part => part.type === 'text');
          if (message.role === 'assistant' && !hasText) return null;

          return (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mb-1 px-1">
                {message.role === 'user' ? 'Customer' : 'AI Assistant'}
              </span>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 rounded-tr-none'
                    : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
                }`}
              >
                {/* Parts-based array processor mapping conversational strings natively */}
                {message.parts?.map((part, index) => {
                  if (part.type === 'text') {
                    return <span key={index}>{part.text}</span>;
                  }
                  return null;
                })}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {status === 'streaming' && (
          <div className="flex flex-col items-start animate-pulse">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-1">AI Assistant Typing...</span>
            <div className="bg-zinc-100 dark:bg-zinc-800 w-12 h-6 rounded-2xl rounded-tl-none"></div>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <div className="w-full max-w-2xl pb-8">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            className="w-full pl-4 pr-16 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50 dark:text-zinc-50"
            value={input}
            placeholder="Type a message to book or ask a question..."
            onChange={(e) => setInput(e.target.value)}
            disabled={status === 'submitted' || status === 'streaming'}
          />
          <button
            type="submit"
            className="absolute right-2 px-4 py-2 bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 font-medium text-xs rounded-xl shadow hover:opacity-90 transition disabled:opacity-50"
            disabled={!input.trim() || status === 'submitted' || status === 'streaming'}
          >
            Send
          </button>
        </form>
      </div>
    </main>
  );
}