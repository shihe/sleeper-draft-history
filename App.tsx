
import React, { useState, useCallback } from 'react';
import { TeamData } from './types';
import { fetchLeagueData } from './services/sleeperService';
import { LeagueInput } from './components/LeagueInput';
import { TeamCard } from './components/TeamCard';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { SleeperIcon } from './components/icons/SleeperIcon';

export default function App(): React.ReactNode {
  const [leagueId, setLeagueId] = useState<string>('');
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState<string>('');

  const handleFetchData = useCallback(async () => {
    if (!leagueId) {
      setError("Please enter a Sleeper League ID.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setTeams([]);

    try {
      const data = await fetchLeagueData(leagueId);
      setTeams(data);
      // A little hacky, but we can get league name from owner's team name if available
      // This is not a real API field but good enough for a display
      const leagueInfo = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`).then(res => res.json());
      setLeagueName(leagueInfo.name || 'Your League');
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to fetch league data. Please check the League ID. Error: ${err.message}`);
      } else {
        setError("An unknown error occurred.");
      }
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-teal-400/30">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <SleeperIcon className="w-16 h-16" />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-500 text-transparent bg-clip-text">
              Sleeper Roster Analyzer
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            View final rosters, draft capital, and get an AI-powered analysis for any Sleeper fantasy football league.
          </p>
        </header>

        <LeagueInput
          leagueId={leagueId}
          setLeagueId={setLeagueId}
          onFetch={handleFetchData}
          isLoading={isLoading}
        />

        {isLoading && (
          <div className="flex flex-col items-center justify-center mt-12 gap-4">
            <LoadingSpinner />
            <p className="text-slate-300 animate-pulse">Fetching league data...</p>
          </div>
        )}

        {error && (
          <div className="mt-12 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-xl mx-auto">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {teams.length > 0 && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-center mb-8 text-slate-200">{leagueName} Rosters</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        )}
      </main>
      <footer className="text-center py-6 text-sm text-slate-500">
        <p>Built for fantasy football enthusiasts. Not affiliated with Sleeper.</p>
      </footer>
    </div>
  );
}
