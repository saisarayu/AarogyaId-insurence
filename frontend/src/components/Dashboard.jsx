import { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ profile, onResetProfile }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        const response = await axios.post('http://localhost:8000/recommend', profile);
        setRecommendation(response.data);
      } catch (error) {
        console.error('Error fetching recommendation:', error);
        setRecommendation({ recommendation: 'Unable to fetch recommendation. Please try again.' });
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendation();
  }, [profile]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    setChatLoading(true);
    try {
      const response = await axios.post('http://localhost:8000/chat', {
        question: chatQuestion,
        user_profile: profile,
      });
      setChatHistory([...chatHistory, { question: chatQuestion, answer: response.data.answer }]);
      setChatQuestion('');
    } catch (error) {
      console.error('Error chatting:', error);
      setChatHistory([...chatHistory, { question: chatQuestion, answer: 'Sorry, unable to respond. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Insurance Dashboard</h1>
        <button
          onClick={onResetProfile}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition duration-200"
        >
          Edit Profile
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-medium mb-4 text-gray-700">Personalized Recommendation</h2>
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
        ) : (
          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-gray-800">{recommendation?.recommendation}</p>
            {recommendation?.source_policies && (
              <p className="text-sm text-gray-600 mt-2">Sources: {recommendation.source_policies.join(', ')}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-medium mb-4 text-gray-700">Ask AI Assistant</h2>
        <div className="bg-secondary p-4 rounded-lg mb-4 max-h-64 overflow-y-auto">
          {chatHistory.map((chat, index) => (
            <div key={index} className="mb-4">
              <p className="font-medium text-primary">You: {chat.question}</p>
              <p className="text-gray-800">AI: {chat.answer}</p>
            </div>
          ))}
          {chatLoading && <div className="animate-pulse bg-gray-200 h-10 rounded"></div>}
        </div>
        <form onSubmit={handleChatSubmit} className="flex">
          <input
            type="text"
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            placeholder="Ask a question about insurance..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-primary focus:border-primary"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="bg-primary text-white px-4 py-2 rounded-r-md hover:bg-blue-600 transition duration-200 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;