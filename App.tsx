import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { Message, GenerationConfig } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'agent',
      text: "Hello! I'm your Veo video director. I can turn your text descriptions and images into stunning videos.\n\nTry describing a scene like \"A futuristic cyberpunk city with neon lights raining\" or upload an image to animate it!",
      timestamp: Date.now(),
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for API Key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        if (window.aistudio && window.aistudio.hasSelectedApiKey) {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setApiKeySet(hasKey);
        } else if (process.env.API_KEY) {
           // If env var is present (e.g. .env file or local dev), we can proceed
           setApiKeySet(true);
        }
      } catch (e) {
        console.error("Error checking API key", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race condition as per guidelines
      setApiKeySet(true);
    }
  };

  const handleSendMessage = async (
    text: string, 
    imageBase64: string | null, 
    mimeType: string | null,
    config: GenerationConfig
  ) => {
    if (!apiKeySet) {
      return;
    }

    const userMessageId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMessageId,
      role: 'user',
      text: text,
      image: imageBase64 || undefined,
      timestamp: Date.now(),
    };

    const agentMessageId = (Date.now() + 1).toString();
    const newAgentMessage: Message = {
      id: agentMessageId,
      role: 'agent',
      status: 'generating',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, newUserMessage, newAgentMessage]);
    setIsProcessing(true);

    try {
      const videoUrl = await geminiService.generateVideo({
        prompt: text,
        image: imageBase64 ? { data: imageBase64, mimeType: mimeType! } : undefined,
        config: config
      });

      setMessages(prev => prev.map(msg => {
        if (msg.id === agentMessageId) {
          return {
            ...msg,
            status: 'complete',
            text: 'Here is your generated video!',
            videoUrl: videoUrl
          };
        }
        return msg;
      }));

    } catch (error: any) {
      console.error(error);
      
      // If error is related to API key, prompt again
      if (error.message && (error.message.includes("Requested entity was not found") || error.message.includes("API key not valid"))) {
         setApiKeySet(false);
      }

      setMessages(prev => prev.map(msg => {
        if (msg.id === agentMessageId) {
          return {
            ...msg,
            status: 'error',
            error: error.message || "Something went wrong while generating the video."
          };
        }
        return msg;
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!apiKeySet) {
    const isAIStudioAvailable = typeof window !== 'undefined' && window.aistudio && window.aistudio.openSelectKey;

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary-600/20">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Veo Video Agent</h1>
          <p className="text-gray-400 leading-relaxed">
            To generate high-quality videos with Google Veo, you need to connect your paid Google Cloud API key.
          </p>
          
          <div className="pt-4 space-y-6">
            {isAIStudioAvailable ? (
              <button
                onClick={handleSelectKey}
                className="w-full py-3.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-all transform hover:scale-[1.02] shadow-xl"
              >
                Select API Key via Google
              </button>
            ) : (
                <div className="text-sm text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-900">
                    API Key configuration is missing. Please run in an environment with Google AI Studio integration or configure `process.env.API_KEY`.
                </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 pt-4">
            Need help? <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-primary-400 hover:underline">View Billing Documentation</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans selection:bg-primary-500/30">
      {/* Header */}
      <header className="flex-none h-16 bg-gray-900/50 backdrop-blur-md border-b border-gray-800 flex items-center px-6 justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">Veo <span className="text-primary-400">Agent</span></span>
        </div>
        {window.aistudio && (
          <button 
            onClick={handleSelectKey}
            className="text-xs text-gray-500 hover:text-white transition-colors border border-gray-800 rounded-full px-3 py-1"
          >
            Change API Key
          </button>
        )}
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto space-y-2 pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="flex-none bg-gray-950 pt-2 pb-6 px-4 z-10">
        <ChatInput onSendMessage={handleSendMessage} disabled={isProcessing} />
      </footer>
    </div>
  );
};

export default App;