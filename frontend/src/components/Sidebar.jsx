import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from 'lucide-react';

function Sidebar({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onRenameSession }) {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (e, session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    onDeleteSession(id);
  };

  return (
    <div className="sidebar">
      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} />
        New Chat
      </button>
      <div className="session-list">
        {sessions.map(session => (
          <div 
            key={session.id} 
            className={`session-item ${activeSessionId === session.id ? 'active' : ''}`}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare size={16} />
            
            {editingId === session.id ? (
              <div className="edit-container" onClick={e => e.stopPropagation()}>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditing(e, session.id);
                    if (e.key === 'Escape') cancelEditing(e);
                  }}
                  autoFocus
                />
                <button onClick={(e) => saveEditing(e, session.id)} className="icon-btn success"><Check size={14}/></button>
                <button onClick={cancelEditing} className="icon-btn danger"><X size={14}/></button>
              </div>
            ) : (
              <>
                <span className="session-title">{session.title}</span>
                <div className="session-actions">
                  <button onClick={(e) => startEditing(e, session)} className="icon-btn" title="Rename"><Edit2 size={14}/></button>
                  <button onClick={(e) => handleDelete(e, session.id)} className="icon-btn danger" title="Delete"><Trash2 size={14}/></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;
