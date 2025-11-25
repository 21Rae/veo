import React, { useRef, useState } from 'react';
import { SendIcon, ImageIcon, TrashIcon, SettingsIcon } from './Icons';
import { GenerationConfig } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, imageBase64: string | null, mimeType: string | null, config: GenerationConfig) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<GenerationConfig>({
    aspectRatio: '16:9',
    resolution: '720p',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simple validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is like "data:image/png;base64,..."
      const base64 = result.split(',')[1];
      const mimeType = file.type;
      
      setSelectedImage({
        base64,
        mimeType,
        preview: result
      });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
    e.target.value = '';
  };

  const handleSend = () => {
    if (!text.trim() && !selectedImage) return;

    onSendMessage(
      text, 
      selectedImage?.base64 || null, 
      selectedImage?.mimeType || null,
      config
    );
    
    setText('');
    setSelectedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Settings Panel (Collapsible) */}
      {showSettings && (
        <div className="mb-4 p-4 bg-gray-800 border border-gray-700 rounded-xl shadow-lg animate-in slide-in-from-bottom-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">Video Configuration</h3>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Aspect Ratio</label>
              <div className="flex bg-gray-900 rounded-lg p-1">
                <button
                  onClick={() => setConfig({ ...config, aspectRatio: '16:9' })}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${config.aspectRatio === '16:9' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  16:9 (Landscape)
                </button>
                <button
                  onClick={() => setConfig({ ...config, aspectRatio: '9:16' })}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${config.aspectRatio === '9:16' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  9:16 (Portrait)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Resolution</label>
              <div className="flex bg-gray-900 rounded-lg p-1">
                 <button
                  onClick={() => setConfig({ ...config, resolution: '720p' })}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${config.resolution === '720p' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  720p
                </button>
                <button
                  onClick={() => setConfig({ ...config, resolution: '1080p' })}
                  className={`px-3 py-1.5 text-xs rounded-md transition-all ${config.resolution === '1080p' ? 'bg-primary-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  1080p
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Area */}
      {selectedImage && (
        <div className="mb-2 relative inline-block">
          <div className="relative group">
            <img 
              src={selectedImage.preview} 
              alt="Selected" 
              className="h-20 w-auto rounded-lg border border-primary-500 shadow-md" 
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="relative flex items-end gap-2 bg-gray-800 p-2 rounded-2xl border border-gray-700 focus-within:ring-2 focus-within:ring-primary-500/50 transition-all shadow-xl">
        
        {/* Helper Buttons */}
        <div className="flex pb-2 pl-1 gap-1">
          <button 
            className={`p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ${showSettings ? 'bg-gray-700 text-white' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Video Settings"
          >
            <SettingsIcon />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={() => fileInputRef.current?.click()}
            title="Add Image"
          >
            <ImageIcon />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleImageSelect}
          />
        </div>

        {/* Text Area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedImage ? "Describe how to animate this image..." : "Describe a video you want to generate..."}
          className="w-full bg-transparent text-white placeholder-gray-500 text-sm md:text-base p-3 max-h-32 min-h-[50px] resize-none focus:outline-none scrollbar-hide"
          rows={1}
          style={{ height: 'auto', minHeight: '50px' }}
          disabled={disabled}
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && !selectedImage)}
          className={`mb-1 p-3 rounded-xl flex items-center justify-center transition-all ${
            disabled || (!text.trim() && !selectedImage)
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-900/20'
          }`}
        >
          <SendIcon />
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        Powered by Google Veo. Videos may take 1-2 minutes to generate.
      </p>
    </div>
  );
};

export default ChatInput;