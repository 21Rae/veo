import React from 'react';
import { Message } from '../types';
import { BotIcon, UserIcon, DownloadIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAgent = message.role === 'agent';

  return (
    <div className={`flex w-full ${isAgent ? 'justify-start' : 'justify-end'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isAgent ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isAgent ? 'bg-gray-800' : 'bg-primary-900/30'}`}>
          {isAgent ? <BotIcon /> : <UserIcon />}
        </div>

        {/* Content Bubble */}
        <div className={`flex flex-col space-y-2 p-4 rounded-2xl ${
          isAgent 
            ? 'bg-gray-800 rounded-tl-none border border-gray-700' 
            : 'bg-primary-600 rounded-tr-none text-white'
        }`}>
          
          {/* Text Content */}
          {message.text && (
            <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {message.text}
            </p>
          )}

          {/* User Uploaded Image Preview */}
          {message.image && (
            <div className="mt-2 rounded-lg overflow-hidden border border-white/10 max-w-[200px]">
              <img 
                src={`data:image/jpeg;base64,${message.image}`} 
                alt="Uploaded reference" 
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Status Indicators for Agent */}
          {message.status === 'generating' && (
            <div className="flex items-center space-x-2 text-primary-400 mt-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
              <span className="text-xs font-medium animate-pulse">Generating video (this may take a minute)...</span>
            </div>
          )}

          {/* Error Message */}
          {message.status === 'error' && message.error && (
            <div className="mt-2 p-3 bg-red-900/20 border border-red-500/50 rounded text-red-200 text-sm">
              <strong className="block font-bold mb-1">Error</strong>
              {message.error}
            </div>
          )}

          {/* Generated Video */}
          {message.videoUrl && message.status === 'complete' && (
            <div className="mt-3 flex flex-col space-y-2">
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-2xl ring-1 ring-white/10">
                <video 
                  src={message.videoUrl} 
                  controls 
                  autoPlay 
                  loop 
                  className="w-full h-full object-contain" 
                />
              </div>
              <a 
                href={message.videoUrl} 
                download={`veo-generation-${message.timestamp}.mp4`}
                className="flex items-center justify-center space-x-2 w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-medium transition-colors"
              >
                <DownloadIcon />
                <span>Download MP4</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;