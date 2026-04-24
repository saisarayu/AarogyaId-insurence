import { useEffect, useRef, useState } from 'react';

const ChatBox = ({ profile, conversation, onSend, loading }) => {
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!question.trim() || loading) return;
    onSend(question);
    setQuestion('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden flex flex-col mt-6 h-[500px]">
      
      <div className="p-5 border-b border-slate-100 bg-white z-10 shadow-sm flex items-center justify-between">
         <div>
            <h2 className="font-semibold text-slate-800 text-lg">AI Insurance Assistant</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ask me anything about your insurance policy</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
        
        {conversation.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <span className="text-4xl mb-3">💬</span>
            <p className="font-medium text-slate-600">I'm ready to answer any questions.</p>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">Ask about what is covered in your city, or specific details for {profile?.conditions?.join(', ') || 'your conditions'}.</p>
          </div>
        )}

        {conversation.map((msg, i) => {
          const isUser = msg.role === 'user';
          return (
            <div key={i} className={`flex gap-3 w-full ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs shadow-sm bg-white border border-slate-200 ${isUser ? 'hidden' : 'block'}`}>
                 🤖
              </div>

              <div className={`max-w-[75%] px-5 py-3.5 shadow-sm text-sm leading-relaxed
                ${isUser 
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm' 
                  : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
            </div>
          );
        })}

        {loading && (
           <div className="flex gap-3 w-full flex-row">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center shadow-sm">
                 🤖
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm">
                 <div className="flex gap-1.5 items-center justify-center h-5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                 </div>
              </div>
           </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask me anything about insurance..."
            className="w-full border border-slate-200 bg-slate-50 rounded-full pl-5 pr-12 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-full w-9 flex items-center justify-center transition-colors"
          >
            {'>'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatBox;
