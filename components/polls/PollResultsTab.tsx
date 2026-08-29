import { useState, useEffect, useMemo } from 'react';
import { BarChart2, Users, Loader2, Trophy, List } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';

interface PollResultsTabProps {
    pollId: string;
    questions: any[];
    labels: any[];
    filterQuery?: string;
    selectedLabels?: string[];
}

type ResultsView = 'standard' | 'ranking';

export default function PollResultsTab({ pollId, questions, labels, filterQuery, selectedLabels = [] }: PollResultsTabProps) {
    const [resultsData, setResultsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedVoters, setSelectedVoters] = useState<{ name: string, voters: any[] } | null>(null);
    const [view, setView] = useState<ResultsView>('standard');

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

    // Check if ranking view makes sense (at least one option starts with a digit)
    const canShowRanking = useMemo(() => {
        if (!resultsData) return false;
        const resultsMap = resultsData.results;
        for (const qId of Object.keys(resultsMap)) {
            const opts = resultsMap[qId]?.options || {};
            for (const optId of Object.keys(opts)) {
                const match = opts[optId].name?.match(/^(\d+)/);
                if (match) return true;
            }
        }
        return false;
    }, [resultsData]);

    // Calculate ranking data
    const rankingData = useMemo(() => {
        if (!resultsData) return [];
        const resultsMap = resultsData.results;

        const filteredQuestions = questions.filter(q => {
            if (!resultsMap[q.id]) return false;
            if (filterQuery) {
                const query = filterQuery.toLowerCase();
                if (!q.name.toLowerCase().includes(query)) return false;
            }
            if (selectedLabels.length > 0) {
                const qLabels = (q.labels || []).map((l: any) => String(l.id));
                const hasMatchingLabel = selectedLabels.some(id => qLabels.includes(String(id)));
                if (!hasMatchingLabel) return false;
            }
            return true;
        });

        return filteredQuestions.map(q => {
            const qResults = resultsMap[q.id];
            const opts = qResults?.options || {};
            
            let totalWeighted = 0;
            let totalVotes = 0;

            for (const optId of Object.keys(opts)) {
                const opt = opts[optId];
                const match = opt.name?.match(/^(\d+)/);
                if (match) {
                    const numericValue = parseInt(match[1], 10);
                    totalWeighted += numericValue * opt.vote_count;
                    totalVotes += opt.vote_count;
                }
            }

            const average = totalVotes > 0 ? totalWeighted / totalVotes : 0;

            return {
                questionId: q.id,
                name: q.name,
                labels: q.labels || [],
                average: Math.round(average * 100) / 100,
                totalVotes,
                page_url: q.page_url
            };
        }).filter(item => item.average > 0).sort((a, b) => b.average - a.average);
    }, [resultsData, questions, filterQuery, selectedLabels]);

    // Find the max possible score (highest digit prefix across all options in this poll)
    const maxScore = useMemo(() => {
        let max = 5;
        if (!resultsData) return max;
        const rMap = resultsData.results || {};
        for (const qId of Object.keys(rMap)) {
            const opts = rMap[qId]?.options || {};
            for (const optId of Object.keys(opts)) {
                const match = opts[optId].name?.match(/^(\d+)/);
                if (match) {
                    const val = parseInt(match[1], 10);
                    if (val > max) max = val;
                }
            }
        }
        return max;
    }, [resultsData]);

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

    const resultsMap = resultsData.results;

    // Use original questions array to maintain order and labels, plus apply filters
    const displayQuestions = questions.filter(q => {
        if (!resultsMap[q.id]) return false;

        // Search query
        if (filterQuery) {
            const query = filterQuery.toLowerCase();
            if (!q.name.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Label filter
        if (selectedLabels.length > 0) {
            const qLabels = (q.labels || []).map((l: any) => String(l.id));
            const hasMatchingLabel = selectedLabels.some(id => qLabels.includes(String(id)));
            if (!hasMatchingLabel) return false;
        }

        return true;
    });

    return (
        <div className="flex flex-col gap-6 w-full">

            {/* VIEW TOGGLE */}
            {canShowRanking && (
                <div className="flex items-center bg-bg-200 rounded-md p-1 self-start">
                    <button
                        onClick={() => setView('standard')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'standard' ? 'bg-bg-100 text-text-900 border border-bg-300' : 'text-text-500 hover:text-text-800 border border-transparent'}`}
                    >
                        <List className="w-4 h-4" />
                        Standardowy
                    </button>
                    <button
                        onClick={() => setView('ranking')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${view === 'ranking' ? 'bg-bg-100 text-text-900 border border-bg-300' : 'text-text-500 hover:text-text-800 border border-transparent'}`}
                    >
                        <Trophy className="w-4 h-4" />
                        Ranking Ocen
                    </button>
                </div>
            )}

            {/* RANKING VIEW */}
            {view === 'ranking' && canShowRanking && (
                <div className="flex flex-col gap-3">
                    {rankingData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-text-500 gap-2 text-center bg-bg-200 rounded-md">
                            <p className="font-bold">Brak wyników do wyświetlenia</p>
                            <p className="text-sm">Nie ma pytań spełniających Twoje kryteria wyszukiwania.</p>
                        </div>
                    ) : (
                        (() => {
                            const topAverage = rankingData[0]?.average || 1;
                            
                            // Build positions with tie handling
                            let currentPosition = 1;
                            const positions: number[] = [];
                            for (let i = 0; i < rankingData.length; i++) {
                                if (i > 0 && rankingData[i].average < rankingData[i - 1].average) {
                                    currentPosition = i + 1;
                                }
                                positions.push(currentPosition);
                            }

                            return rankingData.map((item, index) => {
                                const position = positions[index];
                                const barWidth = topAverage > 0 ? (item.average / topAverage) * 100 : 0;
                                
                                return (
                                    <div key={item.questionId} className="bg-bg-200 rounded-md p-4 md:p-5 flex flex-col gap-3">
                                        {/* HEADER: POSITION + NAME */}
                                        <div className="flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-sm font-bold ${position === 1 ? 'bg-yellow-500/20 text-yellow-600' : position === 2 ? 'bg-gray-300/30 text-gray-500' : position === 3 ? 'bg-orange-400/20 text-orange-500' : 'bg-bg-300 text-text-500'}`}>
                                                {position}
                                            </div>
                                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                                                <h3 className="text-base font-bold text-text-900 font-markazi break-words">{item.name}</h3>
                                                {item.labels.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.labels.map((lbl: any) => (
                                                            <span key={lbl.id} className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${lbl.hex}15`, color: lbl.hex, borderColor: lbl.hex }}>
                                                                {lbl.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-xl font-bold text-accent-500 tabular-nums">{item.average.toFixed(2)}</span>
                                                <span className="text-[10px] text-text-500">{item.totalVotes} głosów</span>
                                            </div>
                                        </div>

                                        {/* SCORE BAR */}
                                        <div className="h-2 w-full bg-bg-300 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${barWidth}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>
            )}

            {/* STANDARD VIEW */}
            {view === 'standard' && (
                <div className="flex flex-col gap-6">
                    {displayQuestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-text-500 gap-2 text-center bg-bg-200 rounded-md">
                            <p className="font-bold">Brak wyników do wyświetlenia</p>
                            <p className="text-sm">Nie ma pytań spełniających Twoje kryteria wyszukiwania.</p>
                        </div>
                    ) : (
                        displayQuestions.map((q: any) => {
                            const qResults = resultsMap[q.id];
                            if (!qResults) return null;

                            // Sort options by vote count descending
                            const optionsArray = Object.keys(qResults.options).map(optId => ({
                                id: optId,
                                ...qResults.options[optId]
                            })).sort((a, b) => b.vote_count - a.vote_count);

                            const totalVotesForQuestion = optionsArray.reduce((acc, opt) => acc + opt.vote_count, 0);

                            return (
                                <div key={q.id} className="bg-bg-200 rounded-md p-5 md:p-6 flex flex-col gap-4">

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
                        })
                    )}
                </div>
            )}

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
