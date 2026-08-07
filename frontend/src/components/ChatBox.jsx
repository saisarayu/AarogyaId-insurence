import { useEffect, useRef, useState } from 'react';

const SUGGESTED = [
  'Hi maama! What policies cover diabetes?',
  'Is Cancer covered maama?',
  'What is the waiting period?',
  'Can I claim 100% cashless?',
  'Which policy is best for low income maama?',
];

const ChatBox = ({ profile, conversation, onSend, loading }) => {
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    onSend(question.trim());
    setQuestion('');
  };

  const handleSuggestion = (q) => {
    if (loading) return;
    onSend(q);
  };

  const hasMessages = conversation.length > 0;

  return (
    <div
      id="chat-section"
      className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden flex flex-col mt-5"
      style={{ height: 520 }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            🤖
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-sm leading-tight">AI Insurance Assistant</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-600 font-medium">Online · Human Interactive Assistant</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:block">
          {conversation.length > 0 ? `${Math.ceil(conversation.length / 2)} messages` : 'Ask anything maama'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-slate-50/50">
        {!hasMessages && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm animate-float"
              style={{ background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)' }}
            >
              💬
            </div>
            <p className="font-semibold text-slate-700 text-sm">Ready to answer your questions</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
              I'll only reference your uploaded policy documents — no hallucinations.
            </p>

            {/* Suggested questions */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center max-w-sm">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSuggestion(q)}
                  className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all duration-200"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={i}
              className={`flex gap-3 w-full animate-fade-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Bot avatar */}
              {!isUser && (
                <div
                  className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  🤖
                </div>
              )}

              <div
                className={`max-w-[76%] px-4 py-3 text-sm leading-relaxed shadow-sm
                  ${isUser
                    ? 'rounded-2xl rounded-tr-sm text-white'
                    : 'rounded-2xl rounded-tl-sm bg-white border border-slate-200 text-slate-700'
                  }`}
                style={isUser ? {
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                } : {}}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 w-full flex-row animate-fade-in">
            <div
              className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-sm shadow-sm"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              🤖
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
        {/* Quick suggestions (if conversation started) */}
        {hasMessages && !loading && (
          <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1 scrollbar-none">
            {SUGGESTED.slice(0, 3).map((q) => (
              <button
                key={q}
                onClick={() => handleSuggestion(q)}
                className="text-[11px] bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap hover:border-indigo-300 hover:text-indigo-600 transition-all flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me anything about insurance…"
            className="w-full border border-slate-200 bg-slate-50 rounded-full pl-5 pr-14 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 focus:bg-white transition-all placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-1.5 bottom-1.5 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
