import { ExternalLink, Info, Circle, CheckCircle2, Square, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '../ui/ToastProvider';
import { ensureAbsoluteUrl } from '@/lib/utils';

interface PollVoteTabProps {
    questions: any[];
    labels: any[];
    answers: Record<string, string[]>;
    setAnswers: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
    filterQuery: string;
    selectedLabels: string[];
    permissions: any;
}

export default function PollVoteTab({
    questions, labels, answers, setAnswers, filterQuery, selectedLabels, permissions
}: PollVoteTabProps) {
    const { addToast } = useToast();

    // Apply filters
    const filteredQuestions = questions.filter(q => {
        // Search query
        if (filterQuery) {
            const query = filterQuery.toLowerCase();
            if (!q.name.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Label filter (must have AT LEAST ONE of the selected labels)
        if (selectedLabels.length > 0) {
            const qLabels = (q.labels || []).map((l: any) => String(l.id));
            const hasMatchingLabel = selectedLabels.some(id => qLabels.includes(String(id)));
            if (!hasMatchingLabel) return false;
        }

        return true;
    });

    const handleOptionToggle = (questionId: string, optionIdRaw: any, isMultiple: boolean) => {
        if (!permissions.canVote) {
            addToast({ message: "Nie masz uprawnień do głosowania.", type: "error" });
            return;
        }

        const optionId = String(optionIdRaw);

        setAnswers(prev => {
            const currentSelected = prev[questionId] || [];
            // Ensure all currentSelected elements are strings for safe comparison
            const currentSelectedStrings = currentSelected.map(id => String(id));

            if (isMultiple) {
                // Toggle
                if (currentSelectedStrings.includes(optionId)) {
                    return { ...prev, [questionId]: currentSelectedStrings.filter(id => id !== optionId) };
                } else {
                    return { ...prev, [questionId]: [...currentSelectedStrings, optionId] };
                }
            } else {
                // Radio behavior
                if (currentSelectedStrings.includes(optionId)) {
                    return { ...prev, [questionId]: [] }; // Deselect if clicking the same radio
                } else {
                    return { ...prev, [questionId]: [optionId] }; // Select new radio
                }
            }
        });
    };

    if (!permissions.canVote) {
        return (
            <div className="w-full text-center mt-12 text-text-500 bg-bg-200 p-8 rounded-md">
                <h2 className="text-xl font-bold mb-2">Brak uprawnień</h2>
                <p>Nie masz odpowiednich uprawnień, aby wyświetlić zawartość tego głosowania.</p>
            </div>
        );
    }

    // Filter and sort questions
    const sortedQuestions = [...filteredQuestions]
        .sort((a, b) => a.sort_order - b.sort_order);

    if (sortedQuestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-text-500">
                Brak pytań.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 w-full pb-32">
            {sortedQuestions.map((q) => {

                const questionLabels = labels.filter(l => (q.label_ids || []).includes(l.id));
                const selectedOptionIds = answers[q.id] || [];

                return (
                    <div key={q.id} className="bg-bg-200 rounded-md p-4 md:p-6 w-full shadow-sm flex flex-col gap-4">

                        {/* Question Header */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-start gap-4">
                                <h2 className="text-lg md:text-xl font-bold text-text-900 leading-tight">
                                    {q.name}
                                </h2>
                                <Tooltip content={q.multiple_choice ? "Pytanie wielokrotnego wyboru" : "Pytanie jednokrotnego wyboru"}>
                                    <div className={`relative flex items-center justify-center shrink-0 border-[2px] border-text-500 transition-all duration-300 ease-in-out ${q.multiple_choice ? 'w-[22px] h-[22px] rounded-sm rotate-90' : 'w-[22px] h-[22px] rounded-full rotate-0'
                                        }`}>
                                        <div className={`bg-text-500 transition-all duration-300 ease-in-out ${q.multiple_choice ? 'w-2.5 h-2.5 rounded-[2px]' : 'w-[10px] h-[10px] rounded-full'
                                            }`} />
                                    </div>
                                </Tooltip>
                            </div>

                            {q.page_url && (
                                <a href={ensureAbsoluteUrl(q.page_url)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent-600 hover:text-accent-500 text-sm w-fit transition-colors mt-1">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[200px] md:max-w-full">{q.page_url}</span>
                                </a>
                            )}
                        </div>

                        {/* Labels */}
                        {q.labels && q.labels.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                                {q.labels.map((l: any) => (
                                    <Tooltip key={l.id} content={
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold">{l.name}</span>
                                            {l.description && <span className="text-text-500 font-normal">{l.description}</span>}
                                        </div>
                                    }>
                                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 cursor-help" style={{ backgroundColor: `${l.hex}15`, color: l.hex, borderColor: l.hex }}>
                                            {l.name}
                                        </span>
                                    </Tooltip>
                                ))}
                            </div>
                        )}

                        {/* Options */}
                        <div className="flex flex-col gap-1 mt-1">
                            {q.options?.map((opt: any) => {
                                const isSelected = selectedOptionIds.some((id: any) => String(id) === String(opt.id));
                                return (
                                    <label key={opt.id} className="flex items-center gap-3 py-2 px-3 -mx-3 rounded-md cursor-pointer group hover:bg-bg-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            name={`q-${q.id}`}
                                            value={opt.id}
                                            checked={isSelected}
                                            onChange={() => handleOptionToggle(q.id, opt.id, !!q.multiple_choice)}
                                            className="hidden"
                                        />
                                        <div className={`relative flex items-center justify-center shrink-0 border-2 transition-all duration-200 ease-in-out
                                            ${q.multiple_choice ? 'w-[22px] h-[22px] rounded-sm rotate-90' : 'w-[22px] h-[22px] rounded-full rotate-0'}
                                            ${isSelected ? 'border-text-900' : 'border-text-500 group-hover:border-text-700'}
                                        `}>
                                            <div className={`transition-all duration-200 ease-in-out bg-text-900
                                                ${q.multiple_choice ? 'rounded-sm' : 'rounded-full'}
                                                ${isSelected ? (q.multiple_choice ? 'w-2.5 h-2.5' : 'w-[10px] h-[10px]') : 'w-0 h-0 opacity-0'}
                                            `} />
                                        </div>
                                        <span className={`text-base ${isSelected ? 'font-semibold text-text-900' : 'text-text-700 group-hover:text-text-900'}`}>
                                            {opt.name}
                                        </span>
                                    </label>
                                );
                            })}
                            {(!q.options || q.options.length === 0) && (
                                <div className="text-sm text-text-500 italic px-2">Brak dostępnych odpowiedzi.</div>
                            )}
                        </div>

                    </div>
                )
            })}
        </div>
    );
}
