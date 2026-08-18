import { useState, useEffect } from 'react';
import { BarChart2, Users, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';

interface PollResultsTabProps {
    pollId: string;
    questions: any[];
    labels: any[];
}

export default function PollResultsTab({ pollId, questions, labels }: PollResultsTabProps) {
    const [resultsData, setResultsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVoters, setSelectedVoters] = useState<{name: string, voters: any[]} | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const timestamp = Date.now();
                const res = await fetch(`/api/poll_results?poll=${pollId}&t=${timestamp}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Błąd pobierania wyników');
                setResultsData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [pollId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-500 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
                <p>Kalkulowanie wyników głosowania...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-danger-500 gap-2">
                <p className="font-bold">Wystąpił problem</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!resultsData) return null;

    const totalParticipants = resultsData.total_participants;
    const resultsMap = resultsData.results;

    // Use original questions array to maintain order and labels
    const displayQuestions = questions.filter(q => resultsMap[q.id]);

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
            
            {/* SUMMARY CARD */}
            <div className="bg-bg-200 border border-bg-400 rounded-md p-4 md:p-6 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-text-500 font-medium">Liczba uczestników</span>
                        <span className="text-2xl font-bold text-text-900">{totalParticipants}</span>
                    </div>
                </div>
            </div>

            {/* RESULTS LIST */}
            <div className="flex flex-col gap-6">
                {displayQuestions.map((q: any) => {
                    const qResults = resultsMap[q.id];
                    if (!qResults) return null;
                    
                    // Sort options by vote count descending
                    const optionsArray = Object.keys(qResults.options).map(optId => ({
                        id: optId,
                        ...qResults.options[optId]
                    })).sort((a, b) => b.vote_count - a.vote_count);

                    const totalVotesForQuestion = optionsArray.reduce((acc, opt) => acc + opt.vote_count, 0);

                    return (
                        <div key={q.id} className="bg-bg-200 border border-bg-400 rounded-md p-5 md:p-6 shadow-sm flex flex-col gap-4">
                            
                            {/* QUESTION HEADER */}
                            <div className="flex flex-col gap-2">
                                <h3 className="text-lg font-bold text-text-900 font-markazi">{q.name}</h3>
                                {q.labels && q.labels.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {q.labels.map((lbl: any) => (
                                            <Tooltip key={lbl.id} content={
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold">{lbl.name}</span>
                                                    {lbl.description && <span className="text-text-500 font-normal">{lbl.description}</span>}
                                                </div>
                                            }>
                                                <span className="text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 cursor-help" style={{ backgroundColor: `${lbl.hex}15`, color: lbl.hex, borderColor: lbl.hex }}>
                                                    {lbl.name}
                                                </span>
                                            </Tooltip>
                                        ))}
                                    </div>
                                )}
                                <span className="text-xs text-text-500 mt-1">Oddano głosów: {totalVotesForQuestion}</span>
                            </div>

                            {/* BARS */}
                            <div className="flex flex-col gap-3 mt-2">
                                {optionsArray.map((opt: any) => (
                                    <div key={opt.id} className="flex flex-col gap-1.5 relative group">
                                        {/* HEADER: NAME + VOTERS + VOTE COUNT */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm text-text-900 truncate pr-4">{opt.name}</span>
                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* VOTERS AVATARS */}
                                                {opt.voters && opt.voters.length > 0 && (
                                                    <div 
                                                        className="flex -space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => setSelectedVoters({ name: opt.name, voters: opt.voters })}
                                                    >
                                                        {opt.voters.slice(0, 3).map((v: any) => (
                                                            <img 
                                                                key={v.id} 
                                                                src={v.pfp_base64 ? (v.pfp_base64.startsWith('data:image') ? v.pfp_base64 : `data:image/jpeg;base64,${v.pfp_base64}`) : '/img/default_pfp.webp'}
                                                                alt={v.displayed_name} 
                                                                className="w-6 h-6 rounded-full border-2 border-bg-200 object-cover bg-bg-100" 
                                                                title={v.displayed_name} 
                                                            />
                                                        ))}
                                                        {opt.voters.length > 3 && (
                                                            <div className="w-6 h-6 rounded-full border-2 border-bg-200 bg-bg-100 flex items-center justify-center text-[9px] font-bold text-text-500 relative z-10">
                                                                +{opt.voters.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="text-sm font-semibold text-text-900 tabular-nums">
                                                    {opt.vote_count} <span className="text-xs text-text-500 font-normal">({opt.percentage}%)</span>
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* PROGRESS BAR TRACK */}
                                        <div className="h-2 w-full bg-bg-300 rounded-full overflow-hidden">
                                            {/* FILL */}
                                            <div 
                                                className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${opt.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* VOTERS MODAL */}
            <Modal
                isOpen={!!selectedVoters}
                onClose={() => setSelectedVoters(null)}
                title={
                    <div className="flex gap-2 items-center">
                        <Users className="w-5 h-5 text-text-500" />
                        <span className="truncate">Głosy na: {selectedVoters?.name}</span>
                    </div>
                }
                maxWidth="max-w-md"
            >
                <div className="flex flex-col gap-1 py-1">
                    {selectedVoters?.voters.map((v: any) => (
                        <div key={v.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-bg-200 border border-transparent hover:border-bg-300 transition-colors">
                            <img 
                                src={v.pfp_base64 ? (v.pfp_base64.startsWith('data:image') ? v.pfp_base64 : `data:image/jpeg;base64,${v.pfp_base64}`) : '/img/default_pfp.webp'}
                                alt={v.displayed_name} 
                                className="w-8 h-8 rounded-full object-cover border border-bg-300" 
                            />
                            <div className="flex flex-col">
                                <span className="font-medium text-text-900 text-sm">{v.displayed_name}</span>
                                <span className="text-[10px] text-text-500">@{v.id}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
