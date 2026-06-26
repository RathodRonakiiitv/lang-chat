import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatBox from './components/ChatBox';

function App() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('chat_sessions');
    if (saved) return JSON.parse(saved);
    return [{ id: 'default', title: 'New Chat' }];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    const saved = localStorage.getItem('active_session');
    return saved || 'default';
  });

  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('active_session', activeSessionId);
  }, [activeSessionId]);

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setSessions([{ id: newId, title: 'New Chat' }, ...sessions]);
    setActiveSessionId(newId);
  };

  const handleDeleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const newId = `session-${Date.now()}`;
      setSessions([{ id: newId, title: 'New Chat' }]);
      setActiveSessionId(newId);
    } else {
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
      }
    }
    // Also clear the messages for this session
    localStorage.removeItem(`chat_messages_${id}`);
  };

  const handleRenameSession = (id, newTitle) => {
    setSessions(sessions.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  return (
    <div className="app-container">
      <Sidebar 
        sessions={sessions} 
        activeSessionId={activeSessionId} 
        onSelectSession={setActiveSessionId} 
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
      />
      <div className="main-chat">
        <div className="chat-header">
          {sessions.find(s => s.id === activeSessionId)?.title || 'Chat'}
        </div>
        <ChatBox sessionId={activeSessionId} />
      </div>
    </div>
  );
}

export default App;
