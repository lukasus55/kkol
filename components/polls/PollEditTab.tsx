import { useState, useRef } from 'react';
import { GripVertical, Trash2, Plus, ExternalLink, Link2, Tag } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';

interface PollEditTabProps {
    questions: any[];
    setQuestions: React.Dispatch<React.SetStateAction<any[]>>;
    labels: any[];
    permissions: any;
}

export default function PollEditTab({
    questions, setQuestions, labels, permissions
}: PollEditTabProps) {

    // Drag & Drop
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragEnabledId, setDragEnabledId] = useState<string | null>(null);

    if (!permissions.canEditQuestions) {
        return (
            <div className="w-full text-center mt-12 text-text-500 bg-bg-200 p-8 rounded-md border border-bg-300">
                <h2 className="text-xl font-bold mb-2">Brak uprawnień</h2>
                <p>Nie masz odpowiednich uprawnień do edycji pytań.</p>
            </div>
        );
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Slight delay so the element being dragged isn't instantly hidden by opacity
        setTimeout(() => {
            if (e.target instanceof HTMLElement) {
                e.target.style.opacity = '0.5';
            }
        }, 0);
    };

    const handleDragEnter = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newQuestions = [...questions];
        const draggedItem = newQuestions[draggedIndex];
        newQuestions.splice(draggedIndex, 1);
        newQuestions.splice(index, 0, draggedItem);

        // Update sort orders
        newQuestions.forEach((q, idx) => {
            q.sort_order = idx;
        });

        setDraggedIndex(index);
        setQuestions(newQuestions);
    };

    const handleDragEnd = (e: React.DragEvent) => {
        setDraggedIndex(null);
        if (e.target instanceof HTMLElement) {
            e.target.style.opacity = '1';
        }
    };

    const handleQuestionChange = (id: string, field: string, value: any) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleOptionChange = (qId: string, optId: string, value: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: q.options.map((o: any) => o.id === optId ? { ...o, name: value } : o)
                };
            }
            return q;
        }));
    };

    const handleAddOption = (qId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOption = { id: `temp-opt-${Date.now()}`, name: '' };
                return { ...q, options: [...(q.options || []), newOption] };
            }
            return q;
        }));
    };

    const handleRemoveOption = (qId: string, optId: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                return { ...q, options: q.options.filter((o: any) => o.id !== optId) };
            }
            return q;
        }));
    };

    const handleAddQuestion = () => {
        const newQ = {
            id: `temp-q-${Date.now()}`,
            name: '',
            page_url: '',
            multiple_choice: false,
            sort_order: questions.length,
            options: [],
            label_ids: []
        };
        setQuestions(prev => [...prev, newQ]);
    };

    const handleRemoveQuestion = (id: string) => {
        if (!confirm('Czy na pewno chcesz usunąć to pytanie?')) return;
        setQuestions(prev => {
            const filtered = prev.filter(q => q.id !== id);
            return filtered.map((q, idx) => ({ ...q, sort_order: idx }));
        });
    };

    const sortedQuestions = [...questions].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <div className="flex flex-col gap-6 w-full pb-32">
            {sortedQuestions.map((q, index) => {
                return (
                    <div
                        key={q.id}
                        draggable={dragEnabledId === q.id}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`bg-bg-200 border border-bg-400 rounded-md p-4 md:p-6 w-full shadow-sm flex flex-col gap-4 transition-all ${draggedIndex === index ? 'opacity-50 border-accent-500 scale-[0.98]' : 'hover:border-bg-500'}`}
                    >
                        {/* Header Row */}
                        <div className="flex gap-4">
                            <div 
                                className="cursor-grab text-bg-500 hover:text-text-500 mt-2"
                                onMouseEnter={() => setDragEnabledId(q.id)}
                                onMouseLeave={() => setDragEnabledId(null)}
                            >
                                <GripVertical className="w-5 h-5" />
                            </div>

                            <div className="flex-1 flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    placeholder="Treść pytania"
                                    value={q.name}
                                    onChange={(e) => handleQuestionChange(q.id, 'name', e.target.value)}
                                    className="w-full bg-bg-100 border border-bg-400 text-text-900 rounded-md px-4 py-2 font-medium focus:outline-none focus:border-accent-500"
                                />

                                <div className="flex gap-2">
                                    <div className="relative flex-1 md:w-64">
                                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-500" />
                                        <input
                                            type="text"
                                            placeholder="Link (opcjonalnie)"
                                            value={q.page_url || ''}
                                            onChange={(e) => handleQuestionChange(q.id, 'page_url', e.target.value)}
                                            className="w-full bg-bg-100 border border-bg-400 text-text-700 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                                        />
                                    </div>
                                    <Tooltip content={q.multiple_choice ? "Pytanie wielokrotnego wyboru (kliknij aby zmienić)" : "Pytanie jednokrotnego wyboru (kliknij aby zmienić)"}>
                                        <button 
                                            type="button"
                                            onClick={() => handleQuestionChange(q.id, 'multiple_choice', !q.multiple_choice)}
                                            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-md hover:bg-bg-300 transition-colors group"
                                        >
                                            <div className={`relative flex items-center justify-center shrink-0 border-[2px] border-text-500 transition-all duration-300 ease-in-out group-hover:border-text-900 ${
                                                q.multiple_choice ? 'w-[22px] h-[22px] rounded-[2px] rotate-90' : 'w-[22px] h-[22px] rounded-[11px] rotate-0'
                                            }`}>
                                                <div className={`transition-all duration-300 ease-in-out bg-text-500 group-hover:bg-text-900 ${
                                                    q.multiple_choice ? 'w-2.5 h-2.5 rounded-[2px]' : 'w-[10px] h-[10px] rounded-[5px]'
                                                }`} />
                                            </div>
                                        </button>
                                    </Tooltip>
                                    <button onClick={() => handleRemoveQuestion(q.id)} className="shrink-0 w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-colors" title="Usuń pytanie">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Meta Row: Labels */}
                        <div className="flex flex-wrap items-center gap-4 pl-9">
                            {/* Selected Labels render */}
                            <div className="flex gap-1.5 flex-wrap">
                                {q.label_ids?.map((lblId: string) => {
                                    const lbl = labels.find(l => l.id === lblId);
                                    if (!lbl) return null;
                                    return (
                                        <div key={lbl.id} className="px-2 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1" style={{ borderColor: lbl.hex, color: lbl.hex, backgroundColor: `${lbl.hex}15` }}>
                                            {lbl.name}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-2 pl-9 mt-2">
                            {q.options?.map((opt: any) => (
                                <div key={opt.id} className="flex gap-2 items-center">
                                    <input
                                        type="text"
                                        value={opt.name}
                                        onChange={(e) => handleOptionChange(q.id, opt.id, e.target.value)}
                                        placeholder="Odpowiedź..."
                                        className="flex-1 bg-bg-100 border border-bg-300 text-text-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                                    />
                                    <button onClick={() => handleRemoveOption(q.id, opt.id)} className="p-2 text-text-500 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            <button onClick={() => handleAddOption(q.id)} className="w-full mt-2 py-2 border border-dashed border-bg-400 text-text-500 rounded-md text-sm font-medium hover:border-text-500 hover:text-text-700 transition-colors flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> Utwórz odpowiedź
                            </button>
                        </div>

                    </div>
                )
            })}

            <button onClick={handleAddQuestion} className="w-full mt-4 py-4 border-2 border-dashed border-accent-500/50 text-accent-500 rounded-xl text-lg font-bold hover:bg-accent-500 hover:text-white hover:border-accent-500 transition-all duration-300 flex items-center justify-center gap-2">
            <Plus className="w-6 h-6" /> Dodaj nowe pytanie
        </button>
        </div>
    );
}
