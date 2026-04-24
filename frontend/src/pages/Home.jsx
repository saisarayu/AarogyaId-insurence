import { useState } from 'react';
import UserForm from '../components/UserForm';
import Recommendation from '../components/Recommendation';
import ChatBox from '../components/ChatBox';
import { recommend, chat } from '../services/api';

const parseRecommendation = (data) => {
  if (!data) return null;
  return {
    peerComparison:  data.peer_comparison  ?? data.peerComparison  ?? [],
    coverageDetails: data.coverage_details ?? data.coverageDetails ?? {},
    whyThisPolicy:   data.why_this_policy  ?? data.whyThisPolicy   ?? '',
    sourcePolicies:  data.source_policies  ?? data.sourcePolicies  ?? [],
  };
};

const Home = () => {
  const [profile, setProfile]             = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [conversation, setConversation]   = useState([]);
  const [chatLoading, setChatLoading]     = useState(false);

  const handleFormSubmit = async (userProfile) => {
    setError('');
    setProfile(userProfile);
    setRecommendation(null);
    setConversation([]);
    setLoading(true);
    try {
      const data = await recommend(userProfile);
      setRecommendation(parseRecommendation(data));
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail ?? 'Unable to fetch recommendation.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (question) => {
    if (!question.trim()) return;
    setChatLoading(true);
    try {
      const response = await chat({ question, user_profile: profile });
      setConversation((prev) => [
        ...prev,
        { role: 'user',      text: question },
        { role: 'assistant', text: response.answer ?? 'No answer returned.' },
      ]);
    } catch {
      // ignore
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Welcome back, User! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Get the best health insurance recommendations tailored for you.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
            U
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Main Grid: Left Column (Form) / Right Column (Results) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Form */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <UserForm onSubmit={handleFormSubmit} loading={loading} />
        </div>

        {/* Right Column: Results & Chat */}
        <div className="flex-1 w-full space-y-6">
          <Recommendation data={recommendation} loading={loading} />

          {/* Always render this div so we can scroll to it */}
          <div id="chat-section">
            {(!profile || !recommendation) ? (
               <div className="bg-white rounded-xl border border-slate-200 card-shadow overflow-hidden flex flex-col items-center justify-center p-12 text-center h-[300px] mt-6">
                 <span className="text-4xl mb-3">🔒</span>
                 <p className="font-semibold text-slate-800">Chat Assistant Locked</p>
                 <p className="text-sm text-slate-500 mt-1 max-w-sm">Please fill out your profile and click "Get Recommendations" to unlock personalized AI chat support.</p>
               </div>
            ) : (
              <ChatBox
                profile={profile}
                conversation={conversation}
                onSend={handleChatSend}
                loading={chatLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
