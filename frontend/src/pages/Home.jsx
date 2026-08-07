import React, { useState } from 'react';
import DiseaseGrid from '../components/DiseaseGrid';
import UserForm from '../components/UserForm';
import Recommendation from '../components/Recommendation';
import ChatBox from '../components/ChatBox';
import { recommend, chat } from '../services/api';

const Home = () => {
  const [selectedDiseases, setSelectedDiseases] = useState(['Cancer']);
  const [userProfile, setUserProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [conversation, setConversation] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const handleToggleDisease = (diseaseName) => {
    setSelectedDiseases((prev) =>
      prev.includes(diseaseName)
        ? prev.filter((d) => d !== diseaseName)
        : [...prev, diseaseName]
    );
  };

  const handleSelectAllDiseases = (allNames) => {
    setSelectedDiseases(allNames);
  };

  const handleClearDiseases = () => {
    setSelectedDiseases([]);
  };

  const handleFormSubmit = async (profileData) => {
    setError('');
    setUserProfile(profileData);
    setRecommendation(null);
    setConversation([]);
    setLoading(true);

    try {
      const data = await recommend({
        ...profileData,
        diseases: selectedDiseases,
      });
      setRecommendation(data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to fetch recommendations. Check your backend server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async (question) => {
    if (!question.trim()) return;
    setConversation((prev) => [...prev, { role: 'user', text: question }]);
    setChatLoading(true);

    const fullProfile = {
      ...(userProfile || {}),
      conditions: selectedDiseases,
      diseases: selectedDiseases,
      income: userProfile?.annual_income || 280000,
      age: userProfile?.age || 35,
      active_recommendations_count: recommendation?.count || 0,
      recommended_policies: (recommendation?.recommended_policies || []).map(p => p.policy_name),
    };

    try {
      const response = await chat({ question, user_profile: fullProfile });
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', text: response.answer || 'No answer returned.' },
      ]);
    } catch {
      setConversation((prev) => [
        ...prev,
        { role: 'assistant', text: 'Sorry, I could not fetch an answer. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Banner */}
      <div
        className="relative px-8 py-8 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}
      >
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-2">
              🛡️ Intelligent Health Insurance Recommendation Engine
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Personalized Policy Matching &{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #818cf8, #c084fc)' }}
              >
                Verification System
              </span>
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl leading-relaxed">
              Select medical conditions, enter your annual family income & age to automatically get eligible active insurance schemes with downloadable PDF policy documents.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <p className="text-white font-bold text-sm">20+ Categories</p>
              <p className="text-slate-400 text-[10px]">Cancer, Diabetes, Kidney...</p>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
              <p className="text-emerald-400 font-bold text-sm">Active Schedule</p>
              <p className="text-slate-400 text-[10px]">Mon-Sun day-of-week checks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-6 space-y-6">

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <div>
              <p className="font-bold">Evaluation Warning</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Clean Minimal Username Dashboard Block */}
        <div className="bg-white rounded-2xl px-5 py-3.5 border border-slate-200 shadow-sm flex items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-extrabold shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {((userProfile?.name || 'Subrahmanyam').split(' ').map(w => w[0]).join('').slice(0, 2) || 'SB').toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                {userProfile?.name || 'Subrahmanyam'}
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">Username</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
          </div>
        </div>

        {/* Section 1: 20+ Disease Grid Selector */}
        <DiseaseGrid
          selectedDiseases={selectedDiseases}
          onToggleDisease={handleToggleDisease}
          onSelectAll={handleSelectAllDiseases}
          onClearAll={handleClearDiseases}
        />

        {/* Section 2: Split Layout (User Form vs Results & Chat) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Applicant Form */}
          <div className="w-full lg:w-[340px] flex-shrink-0 lg:sticky lg:top-[80px]">
            <UserForm
              onSubmit={handleFormSubmit}
              loading={loading}
              selectedDiseases={selectedDiseases}
            />
          </div>

          {/* Right: Recommendation Results & AI Assistant */}
          <div className="flex-1 min-w-0 space-y-6 w-full">
            {/* Recommendation Grid */}
            <Recommendation data={recommendation} loading={loading} />

            {/* Initial Empty State */}
            {!loading && !recommendation && !error && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center bg-white">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl mb-3">
                  🔍
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Ready to Recommend</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Select your medical conditions from the grid above, enter annual income (e.g. ₹2,80,000) and click <strong>"Generate Combined Policy Recommendations"</strong>.
                </p>
              </div>
            )}

            {/* AI Assistant Chat - Always Available */}
            <ChatBox
              profile={userProfile || { name: 'Applicant', age: 35, conditions: selectedDiseases }}
              conversation={conversation}
              onSend={handleChatSend}
              loading={chatLoading}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
