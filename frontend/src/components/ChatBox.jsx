import { useEffect, useRef, useState } from 'react';

const ChatBox = ({ profile, conversation, onSend, loading, error }) => {
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!question.trim() || loading) return;
    onSend(question);
    setQuestion('');
  };

  const handleKeyDown = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault();
      handleSubmit(ev);
    }
  };

  return (
    <div className="fade-up rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--navy)' }}
        >
          AI
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Policy Assistant</p>
          <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
            Ask anything about your recommendation · uses {profile?.name}'s profile context
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="px-5 py-4 space-y-3 overflow-y-auto"
        style={{ minHeight: '180px', maxHeight: '380px', background: '#faf9f7' }}
      >
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <p className="text-sm mb-1" style={{ color: 'var(--ink-muted)' }}>
              No messages yet.
            </p>
            <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
              Try asking: "What does this policy cover for diabetics?" or "Explain co-pay."
            </p>
          </div>
        ) : (
          conversation.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                    isUser ? 'rounded-br-sm' : 'rounded-bl-sm'
                  }`}
                  style={
                    isUser
                      ? { background: 'var(--navy)', color: '#fff' }
                      : { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }
                  }
                >
                  {!isUser && (
                    <p className="text-xs font-medium mb-1 opacity-50">Assistant</p>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl rounded-bl-sm px-4 py-3"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="dot-pulse flex gap-1">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-2 text-xs" style={{ color: 'var(--accent)', background: '#fff7ed', borderTop: '1px solid #fed7aa' }}>
          {error}
        </div>
      )}

      {/* Input */}
      <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <textarea
            rows={1}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about coverage, premiums, exclusions…"
            className="field-input flex-1 resize-none leading-6"
            style={{ paddingTop: '0.55rem', paddingBottom: '0.55rem' }}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="btn-primary flex-shrink-0 px-4"
          >
            {loading ? '…' : '↑'}
          </button>
        </form>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--ink-muted)' }}>
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatBox;
