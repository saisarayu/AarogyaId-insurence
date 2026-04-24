import { useState } from 'react';

const ProfileForm = ({ onSubmit }) => {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    lifestyle: '',
    conditions: '',
    income: '',
    city: '',
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const processedProfile = {
      ...profile,
      age: parseInt(profile.age),
      conditions: profile.conditions.split(',').map(c => c.trim()).filter(c => c),
    };
    onSubmit(processedProfile);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md animate-slide-up">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            name="age"
            value={profile.age}
            onChange={handleChange}
            min="0"
            max="120"
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Lifestyle</label>
          <select
            name="lifestyle"
            value={profile.lifestyle}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Select</option>
            <option value="Sedentary">Sedentary</option>
            <option value="Moderate">Moderate</option>
            <option value="Active">Active</option>
            <option value="Athlete">Athlete</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Conditions (comma separated)</label>
          <input
            type="text"
            name="conditions"
            value={profile.conditions}
            onChange={handleChange}
            placeholder="e.g. diabetes, hypertension"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Income</label>
          <select
            name="income"
            value={profile.income}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Select</option>
            <option value="under 3L">under 3L</option>
            <option value="3-8L">3-8L</option>
            <option value="8-15L">8-15L</option>
            <option value="15L+">15L+</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <select
            name="city"
            value={profile.city}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Select</option>
            <option value="Metro">Metro</option>
            <option value="Tier-2">Tier-2</option>
            <option value="Tier-3">Tier-3</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 animate-fade-in"
        >
          Get Recommendations
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;