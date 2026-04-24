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
  const [chatError, setChatError]         = useState('');

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
      setError(detail ?? 'Unable to fetch recommendation. Check the backend is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (question) => {
    if (!question.trim()) return;
    setChatError('');
    setChatLoading(true);
    try {
      const response = await chat({ question, user_profile: profile });
      setConversation((prev) => [
        ...prev,
        { role: 'user',      text: question },
        { role: 'assistant', text: response.answer ?? 'No answer returned.' },
      ]);
    } catch {
      setChatError('Unable to send message. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-10">

      {/* ── Hero intro ── */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--accent)' }}>
          AI-powered · Grounded in policy documents
        </p>
        <h1 className="font-display text-3xl sm:text-4xl" style={{ color: 'var(--ink)' }}>
          Find the right health insurance for you.
        </h1>
        <p className="text-base max-w-xl" style={{ color: 'var(--ink-muted)' }}>
          Answer six questions and our AI will compare uploaded policies against your profile
          — no hallucinated data, no upselling.
        </p>
      </div>

      {/* ── Form card ── */}
      <div className="rounded-xl border bg-white px-6 py-7 sm:px-8" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs uppercase tracking-widest font-medium mb-5" style={{ color: 'var(--ink-muted)' }}>
          Your profile
        </p>
        <UserForm onSubmit={handleFormSubmit} loading={loading} />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="fade-up rounded-lg px-4 py-3 text-sm" style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* ── Results ── */}
      <Recommendation data={recommendation} loading={loading} />

      {/* ── Chat — only after results load ── */}
      {profile && recommendation && !loading && (
        <ChatBox
          profile={profile}
          conversation={conversation}
          onSend={handleChatSend}
          loading={chatLoading}
          error={chatError}
        />
      )}
    </div>
  );
};

export default Home;
