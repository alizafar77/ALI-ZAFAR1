import React, { useState, useRef, useEffect } from 'react';
import { RefreshCcw, Image, MessageSquare, Plus, Trash2, Send, Search, Code, Check, X } from 'lucide-react';

// This is a basic custom component to handle syntax highlighting since the external library is not working.
// It will apply styling based on simple logic, but will not be as robust as a dedicated library.
const CustomSyntaxHighlighter = ({ language, code }) => {
  // A simple way to add some basic styling to the code block.
  // This can be expanded to support more languages and advanced syntax.
  const keywords = ['import', 'from', 'export', 'const', 'let', 'var', 'function', 'return', 'class', 'extends', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally'];
  const formattedCode = code.split('\n').map((line, lineIndex) => (
    <div key={lineIndex}>
      {line.split(' ').map((word, wordIndex) => {
        const isKeyword = keywords.includes(word.replace(/[.,;(){}]/g, ''));
        const color = isKeyword ? 'text-red-400 font-semibold' : 'text-gray-200';
        return (
          <span key={wordIndex} className={color}>
            {word}{' '}
          </span>
        );
      })}
    </div>
  ));

  return (
    <pre className="p-4 rounded-md overflow-x-auto text-sm">
      <code className={`language-${language}`}>
        {formattedCode}
      </code>
    </pre>
  );
};

// Modal component for API Key management
const ApiKeyModal = ({ isOpen, onClose, onSave }) => {
  // Using state to simulate localStorage for this environment
  const [geminiKey, setGeminiKey] = useState(
    () => {
      // In a real application, you would get this from localStorage.
      // return localStorage.getItem('geminiApiKey') || '';
      return '';
    }
  );
  const [openRouterKey, setOpenRouterKey] = useState(
    () => {
      // In a real application, you would get this from localStorage.
      // return localStorage.getItem('openRouterApiKey') || '';
      return '';
    }
  );
  
  // This useEffect is to load the keys from the main App's state
  // into the modal's internal state when the modal opens.
  // We'll simulate this by not having an actual effect, but this is where it would go.

  const handleSave = () => {
    // In a real application, you would save to localStorage.
    // localStorage.setItem('geminiApiKey', geminiKey);
    // localStorage.setItem('openRouterApiKey', openRouterKey);
    onSave({ gemini: geminiKey, openRouter: openRouterKey });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">API Keys</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-4">
          Keys are stored locally in your browser via localStorage and sent only with your requests. Do not hardcode keys in code.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Gemini API Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10"
                placeholder="AIza..."
              />
              <a href="https://aistudio.google.com/app/u/0/apikey?pli=1" target="_blank" rel="noopener noreferrer" className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-red-400 hover:underline">
                Get API key
              </a>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300">OpenRouter API Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="password"
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10"
                placeholder="sk-or..."
              />
              <a href="https://openrouter.ai/sign-in?redirect_url=https%3A%2F%2Fopenrouter.ai%2Fsettings%2Fkeys" target="_blank" rel="noopener noreferrer" className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-red-400 hover:underline">
                Get API key
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-400 rounded-md hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// This is the main component for the application.
export default function App() {
  const [messages, setMessages] = useState([]);
  const [panes, setPanes] = useState(['gemini-pro-vision']);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState(null);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const chatContainerRefs = useRef({});
  const [codeContent, setCodeContent] = useState('');
  
  // State for API keys and modal visibility
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  // In a real app, these would be loaded from localStorage
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [openRouterApiKey, setOpenRouterApiKey] = useState('');
  
  // Model definitions. The models are organized by their providers.
  const models = [
    { id: 'gemini-pro-vision', name: 'Gemini Pro (Vision)', type: 'chat', provider: 'Google' },
    { id: 'llama-3-8b', name: 'Llama 3.3', type: 'chat', provider: 'OpenRouter' },
    { id: 'qwen-7b', name: 'Qwen', type: 'chat', provider: 'OpenRouter' },
    { id: 'mistral-7b', name: 'Mistral 7B', type: 'chat', provider: 'OpenRouter' },
    { id: 'reka-flash', name: 'Reka Flash', type: 'chat', provider: 'OpenRouter' },
    { id: 'deepseek-r1', name: 'DeepSeek R1', type: 'chat', provider: 'DeepSeek' },
    { id: 'imagen-gen', name: 'Imagen (Image Generation)', type: 'image', provider: 'Google' },
    { id: 'code-playground', name: 'Code Playground', type: 'code', provider: 'Google' }
  ];

  // Utility function for exponential backoff.
  const retryFetch = async (url, options, retries = 3, delay = 1000) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (retries === 0) {
        throw error;
      }
      await new Promise(res => setTimeout(res, delay));
      return retryFetch(url, options, retries - 1, delay * 2);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !attachedImage) return;

    // Check if Gemini API Key is provided for Gemini and Imagen models
    const requiresGeminiKey = panes.some(id => 
      ['gemini-pro-vision', 'imagen-gen', 'code-playground'].includes(id)
    );
    if (requiresGeminiKey && !geminiApiKey) {
      alert("Please provide a Gemini API Key to use this model.");
      setShowApiKeyModal(true); // Open the modal
      return;
    }

    // Check if OpenRouter API Key is provided for OpenRouter models
    const requiresOpenRouterKey = panes.some(id => 
      ['llama-3-8b', 'qwen-7b', 'mistral-7b', 'reka-flash', 'deepseek-r1'].includes(id)
    );
    if (requiresOpenRouterKey && !openRouterApiKey) {
      alert("Please provide an OpenRouter API Key to use this model.");
      setShowApiKeyModal(true); // Open the modal
      return;
    }

    // Add user message to all panes
    const userMessage = { sender: 'user', text: inputMessage, image: attachedImage, timestamp: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    
    // Clear input
    const currentInput = inputMessage;
    const currentImage = attachedImage;
    setInputMessage('');
    setAttachedImage(null);
    setIsLoading(true);

    const apiCalls = panes.map(async (paneId) => {
      const model = models.find(m => m.id === paneId);
      if (!model) return;

      const responseMessageId = `${paneId}-${Date.now()}`;
      setMessages(prev => {
        if (model.type === 'chat' || model.type === 'image') {
          return [...prev, { sender: paneId, text: '', id: responseMessageId }];
        }
        return prev;
      });

      try {
        if (model.type === 'chat') {
          await streamTextResponse(paneId, responseMessageId, currentInput, currentImage);
        } else if (model.type === 'image') {
          await generateImageResponse(paneId, responseMessageId, currentInput);
        } else if (model.type === 'code') {
          await generateCodeResponse(currentInput);
        }
      } catch (error) {
        setMessages(prev => {
          return prev.map(msg => msg.id === responseMessageId ? { ...msg, text: `Error: ${error.message}` } : msg);
        });
        if (model.type === 'code') {
          setCodeContent(`Error: ${error.message}`);
        }
      }
    });

    await Promise.all(apiCalls);
    setIsLoading(false);
  };

  // Function to simulate a streaming text response.
  const streamTextResponse = async (paneId, messageId, prompt, image) => {
    let fullPrompt = prompt;
    if (webSearchEnabled) {
      fullPrompt = `(with web search) ${prompt}`;
    }

    const promptParts = [{ text: fullPrompt }];
    if (image) {
      promptParts.push({
        inlineData: {
          mimeType: "image/png",
          data: image.split(',')[1]
        }
      });
    }

    const payload = {
      contents: [{
        role: "user",
        parts: promptParts,
      }],
    };
    
    // This part is for the sandbox environment. In a real app, you'd use the key from state.
    // const apiKey = geminiApiKey; 
    const apiKey = ""; // Required for canvas environment to work
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await retryFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    const fullText = result.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    const words = fullText.split(' ');

    let generatedText = '';
    for (let i = 0; i < words.length; i++) {
      generatedText += words[i] + ' ';
      setMessages(prev => {
        return prev.map(msg => msg.id === messageId ? { ...msg, text: generatedText } : msg);
      });
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 50)); // Simulating a delay
    }
  };

  // Function to handle image generation response
  const generateImageResponse = async (paneId, messageId, prompt) => {
    const payload = {
      instances: [{ prompt: prompt }],
      parameters: { "sampleCount": 1 }
    };
    
    // This part is for the sandbox environment. In a real app, you'd use the key from state.
    // const apiKey = geminiApiKey;
    const apiKey = ""; // Required for canvas environment to work
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
    
    const response = await retryFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    const imageUrl = `data:image/png;base64,${result.predictions?.[0]?.bytesBase64Encoded}`;
    setMessages(prev => {
      return prev.map(msg => msg.id === messageId ? { ...msg, text: "Image generated successfully.", image: imageUrl } : msg);
    });
  };

  // Function to handle code generation response
  const generateCodeResponse = async (prompt) => {
    const fullPrompt = `Generate a complete and well-commented code snippet based on the following request: ${prompt}. The code should be fully functional. Only return the code block, no extra text.`;
    const payload = {
      contents: [{
        role: "user",
        parts: [{ text: fullPrompt }],
      }],
    };
    
    // This part is for the sandbox environment. In a real app, you'd use the key from state.
    // const apiKey = geminiApiKey;
    const apiKey = ""; // Required for canvas environment to work
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await retryFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    const fullCode = result.candidates?.[0]?.content?.parts?.[0]?.text || "# No code response.";
    setCodeContent(fullCode);
  };

  const handleImageAttach = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addPane = (modelId) => {
    if (panes.length < 5 && !panes.includes(modelId)) {
      setPanes(prev => [...prev, modelId]);
    }
  };

  const removePane = (modelId) => {
    setPanes(prev => prev.filter(id => id !== modelId));
    setMessages(prev => prev.filter(msg => msg.sender !== modelId));
  };
  
  // Auto-scroll to the bottom of the chat container.
  useEffect(() => {
    panes.forEach(paneId => {
      const chatContainer = chatContainerRefs.current[paneId];
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }, [messages, panes]);

  const ChatMessage = ({ message, paneId }) => {
    const isUser = message.sender === 'user';
    const senderName = isUser ? 'You' : models.find(m => m.id === message.sender)?.name || 'Model';
    const isVisibleInPane = isUser || message.sender === paneId;

    if (!isVisibleInPane) return null;

    return (
      <div className={`p-4 rounded-xl ${isUser ? 'bg-red-900 self-start text-white' : 'bg-gray-800 self-start text-gray-200'} max-w-2xl shadow-lg my-2`}>
        <div className={`font-bold text-sm mb-1 ${isUser ? 'text-white' : 'text-gray-400'}`}>{senderName}</div>
        {message.text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
        )}
        {message.image && (
          <img src={message.image} alt="attached content" className="mt-2 rounded-lg max-w-full h-auto object-contain" />
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen flex font-sans antialiased">
      {/* Left Sidebar */}
      <aside className="w-80 bg-black p-4 flex flex-col border-r border-gray-800">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <button onClick={() => setShowApiKeyModal(true)} className="flex items-center text-red-500 hover:text-red-400 transition-colors">
            <MessageSquare size={28} className="mr-2" />
            <h1 className="text-xl font-bold">Open-Fiesta</h1>
          </button>
        </div>
        
        {/* Model Catalog */}
        <div className="flex-1 overflow-y-auto my-4">
          <h2 className="text-lg font-semibold mb-2 text-white">Model</h2>
          <div className="space-y-2">
            {models.map(model => {
              const isActive = panes.includes(model.id);
              return (
                <button
                  key={model.id}
                  onClick={() => addPane(model.id)}
                  className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${isActive ? 'bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
                  disabled={panes.length >= 5 && !isActive}
                >
                  <span className="truncate flex-1">
                    {model.name}
                    <span className="text-xs ml-2 text-gray-400">({model.provider})</span>
                  </span>
                  {isActive ? <Check size={16} /> : <Plus size={16} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Web Search and Code Playground */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${webSearchEnabled ? 'bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            <span className="flex items-center">
              <Search size={16} className="mr-2" />
              Web Search
            </span>
            {webSearchEnabled ? <Check size={16} /> : null}
          </button>
          <button
            onClick={() => addPane('code-playground')}
            className={`w-full text-left p-2 rounded-lg transition-colors flex items-center justify-between ${panes.includes('code-playground') ? 'bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            <span className="flex items-center">
              <Code size={16} className="mr-2" />
              Code Playground
            </span>
            {panes.includes('code-playground') ? <Check size={16} /> : <Plus size={16} />}
          </button>
        </div>

      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col bg-gray-950 relative">
        {panes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center text-gray-500">
              <p className="mb-4 text-lg">Select a model from the sidebar to start a conversation.</p>
            </div>
          </div>
        ) : (
          <div className={`grid flex-1 overflow-hidden transition-all duration-300`} style={{ gridTemplateColumns: `repeat(${panes.length}, minmax(0, 1fr))` }}>
            {panes.map(paneId => {
              const model = models.find(m => m.id === paneId);
              if (!model) return null;

              return (
                <div key={paneId} className="flex flex-col border-r border-gray-800 last:border-r-0">
                  {/* Pane header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
                    <span className="font-bold text-lg text-white">{model.name}</span>
                    <button onClick={() => removePane(paneId)} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {/* Pane content */}
                  {model.type === 'chat' || model.type === 'image' ? (
                    <div ref={el => chatContainerRefs.current[paneId] = el} className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                      {messages.map((msg, index) => (
                        <ChatMessage key={index} message={msg} paneId={paneId} />
                      ))}
                      {isLoading && <div className="p-4 text-sm text-gray-400">Typing...</div>}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-800">
                      <CustomSyntaxHighlighter language="python" code={codeContent} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {/* Footer and Made by info */}
      <footer className="p-4 border-t border-gray-800 bg-black sticky bottom-0">
        <div className="flex flex-col items-center">
          {/* Toggles */}
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
              className={`p-2 rounded-lg transition-colors flex items-center ${webSearchEnabled ? 'bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Search size={16} className="mr-2" />
              Web Search
            </button>
            <button
              onClick={() => addPane('code-playground')}
              className={`p-2 rounded-lg transition-colors flex items-center ${panes.includes('code-playground') ? 'bg-red-700 text-white' : 'bg-gray-800 hover:bg-gray-700'}`}
            >
              <Code size={16} className="mr-2" />
              Code Playground
            </button>
          </div>
          
          {/* Input form */}
          <form onSubmit={handleSendMessage} className="flex w-full items-end space-x-2">
            <label htmlFor="image-input" className="p-3 bg-gray-800 rounded-full cursor-pointer hover:bg-gray-700 transition-colors">
              <Image size={24} className="text-gray-400" />
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageAttach}
              className="hidden"
            />
            {attachedImage && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-700">
                <img src={attachedImage} alt="attached" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-1 right-1 bg-red-500 rounded-full p-1"
                >
                  <Trash2 size={12} className="text-white" />
                </button>
              </div>
            )}
            
            <div className="flex-1 relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 resize-none bg-gray-800 text-gray-200 p-3 pr-10 rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
                style={{ minHeight: '48px', maxHeight: '150px' }}
              />
              <button
                type="submit"
                disabled={isLoading || (!inputMessage.trim() && !attachedImage)}
                className="absolute right-2 bottom-2 p-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-700 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCcw size={20} className="animate-spin text-white" /> : <Send size={20} className="text-white" />}
              </button>
            </div>
          </form>
        </div>
        
        {/* Made by info */}
        <div className="absolute bottom-2 right-4 text-xs text-gray-600">
          Made by Ali Zafar
        </div>
      </footer>
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={(keys) => {
          setGeminiApiKey(keys.gemini);
          setOpenRouterApiKey(keys.openRouter);
        }}
      />
    </div>
  );
}
