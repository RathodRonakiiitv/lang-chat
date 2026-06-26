import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Loader2, Copy, RotateCw, Square, Paperclip, Check } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

function ChatBox({ sessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Load history when session changes
  useEffect(() => {
    const saved = localStorage.getItem(`chat_messages_${sessionId}`);
    setMessages(saved ? JSON.parse(saved) : []);
  }, [sessionId]);

  // Save history whenever messages change (but ensure we don't cross-contaminate sessions)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    localStorage.setItem(`chat_messages_${sessionId}`, JSON.stringify(messages));
  }, [messages]); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleFileAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedFile({
        name: file.name,
        content: event.target.result
      });
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input so same file can be selected again
  };

  const submitPrompt = async (promptText) => {
    if (!promptText.trim() || isLoading) return;
    
    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: promptText,
          stream: true
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + chunk
          };
          return newMessages;
        });
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else {
        console.error(err);
        setMessages(prev => [...prev, { role: 'ai', content: '**Error**: Could not reach API.' }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const userMsg = input.trim();
    if (!userMsg && !attachedFile) return;
    
    let fullPrompt = userMsg;
    let displayPrompt = userMsg;

    if (attachedFile) {
      const fileContext = `Here is the contents of the attached file '${attachedFile.name}':\n\n\`\`\`\n${attachedFile.content}\n\`\`\`\n\n`;
      fullPrompt = fileContext + userMsg;
      displayPrompt = `*(Attached file: ${attachedFile.name})*\n\n${userMsg}`;
      setAttachedFile(null);
    }
    
    setInput('');
    // We display the simplified prompt to the user, but submit the full prompt to the LLM
    setMessages(prev => [...prev, { role: 'user', content: displayPrompt }]);
    submitPrompt(fullPrompt);
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    let lastUserIndex = messages.length - 1;
    while (lastUserIndex >= 0 && messages[lastUserIndex].role !== 'user') {
      lastUserIndex--;
    }
    if (lastUserIndex < 0) return;
    
    const lastUserMessage = messages[lastUserIndex].content;
    const newMessages = messages.slice(0, lastUserIndex + 1);
    setMessages(newMessages);
    
    submitPrompt(lastUserMessage);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMarkdown = (text) => {
    const rawMarkup = marked(text, { breaks: true });
    return { __html: DOMPurify.sanitize(rawMarkup) };
  };

  return (
    <div className="chat-messages-container" style={{display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden'}}>
      {messages.length === 0 ? (
        <div className="empty-state">
          <Bot size={48} style={{ marginBottom: '16px', color: 'var(--accent-color)' }} />
          <div className="empty-state-title">How can I help you today?</div>
          <p>Send a message to start a conversation with the AI.</p>
        </div>
      ) : (
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              <div className="message-content">
                <div className={`avatar ${msg.role}`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className="message-text">
                  {msg.role === 'ai' && msg.content === '' ? (
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  ) : (
                    <div className="markdown-body" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                  )}
                  
                  {msg.role === 'ai' && msg.content !== '' && (
                    <div className="message-actions">
                      <button className="action-btn" onClick={() => handleCopy(msg.content, idx)}>
                        {copiedId === idx ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                      </button>
                      {idx === messages.length - 1 && !isLoading && (
                        <button className="action-btn" onClick={handleRegenerate} title="Regenerate">
                          <RotateCw size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="input-area-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isLoading && (
          <button className="stop-btn" onClick={handleStop}>
            <Square size={12} fill="currentColor" /> Stop Generating
          </button>
        )}
        
        {attachedFile && (
          <div className="attachment-chip">
            <Paperclip size={12} />
            {attachedFile.name}
            <button className="remove-attachment-btn" onClick={() => setAttachedFile(null)}>
              <Square size={10} /> {/* We use Square or an X icon. Lucide X is better but we don't have it imported. Let's use Square as a placeholder or import X. Actually, we do have X imported in Sidebar, but not here. I will just use 'x' string. */}
              <span style={{marginLeft: '2px', fontSize: '10px', fontWeight: 'bold'}}>x</span>
            </button>
          </div>
        )}

        <form className="input-box" onSubmit={handleSubmit}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileAttach} 
            style={{ display: 'none' }} 
            accept=".txt,.md,.py,.js,.jsx,.json,.css,.html,.csv"
          />
          <button 
            type="button" 
            className="attachment-btn" 
            title="Attach file"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={18} />
          </button>
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message LangChain AI..."
            rows={1}
            disabled={isLoading}
          />
          <button type="submit" className="send-btn" disabled={(!input.trim() && !attachedFile) || isLoading}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
