
import React from 'react';

interface LeagueInputProps {
  leagueId: string;
  setLeagueId: (id: string) => void;
  onFetch: () => void;
  isLoading: boolean;
}

export const LeagueInput: React.FC<LeagueInputProps> = ({ leagueId, setLeagueId, onFetch, isLoading }) => {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetch();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        value={leagueId}
        onChange={(e) => setLeagueId(e.target.value)}
        placeholder="Enter Sleeper League ID..."
        disabled={isLoading}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-none transition duration-200 placeholder-slate-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-md hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Fetch Rosters'}
      </button>
    </form>
  );
};
