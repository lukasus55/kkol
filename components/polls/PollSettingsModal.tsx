import { useState, useEffect } from 'react';
import { X, Settings, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

interface PollSettingsModalProps {
    poll: any;
    pollDefaultOptions?: any[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedPoll: any) => void;
    onSuccessOptions?: (opts: any[]) => void;
}

const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
};

export default function PollSettingsModal({ poll, pollDefaultOptions = [], isOpen, onClose, onSuccess, onSuccessOptions }: PollSettingsModalProps) {
    const { addToast } = useToast();
    const [name, setName] = useState(poll?.name || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rightsLevel, setRightsLevel] = useState(0);
    const [defaultOptions, setDefaultOptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && poll) {
            setName(poll.name);
            setStartDate(formatDateForInput(poll.start_date));
            setEndDate(formatDateForInput(poll.end_date));
            setRightsLevel(poll.rights_level);
            setDefaultOptions(pollDefaultOptions ? JSON.parse(JSON.stringify(pollDefaultOptions)) : []);
            setError('');
        }
    }, [isOpen, poll, pollDefaultOptions]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setLoading(true);
        setError('');

        try {
            // First save poll updates
            const res = await fetch('/api/poll_update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: poll.id,
                    name,
                    start_date: new Date(startDate).toISOString(),
                    end_date: new Date(endDate).toISOString(),
                    rights_level: Number(rightsLevel)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Wystąpił błąd podczas zapisywania');

            // Then save default options
            const optsRes = await fetch('/api/poll_default_options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    poll_id: poll.id,
                    options: defaultOptions
                })
            });
            const optsData = await optsRes.json();
            if (!optsRes.ok) throw new Error(optsData.error || 'Błąd zapisu opcji domyślnych');

            onSuccess({
                ...poll,
                name,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
                rights_level: Number(rightsLevel)
            });
            if (onSuccessOptions) {
                onSuccessOptions(defaultOptions.filter(o => o.name.trim() !== '').map((o, i) => ({ ...o, sort_order: i })));
            }

            addToast({ message: "Ustawienia ankiety zostały zapisane", type: "success" });
            onClose();
        } catch (err: any) {
            addToast({ message: err.message || "Wystąpił nieznany błąd", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-lg"
            title={
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-text-500" />
                    <span>Ustawienia Ankiety</span>
                </div>
            }
            footer={
                <div className="flex justify-end gap-3 w-full">
                    <Button variant="secondary" onClick={onClose}>Anuluj</Button>
                    <Button variant="primary" onClick={handleSave} isLoading={loading}>Zapisz Zmiany</Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 py-2">
                {error && (
                    <div className="p-3 rounded-md bg-danger-500/10 border border-danger-500 text-danger-500 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-text-700">Nazwa ankiety</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input_base py-2.5 cursor-text"
                        placeholder="Wprowadź nazwę ankiety..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-text-700">Początek</label>
                        <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input_base py-2.5 cursor-text"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-semibold text-text-700">Koniec</label>
                        <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="input_base py-2.5 cursor-text"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-text-700">Uczestnicy mogą:</label>
                    <div className="flex flex-col gap-2">
                        {[
                            { val: 1, label: 'I - odpowiadać na pytania' },
                            { val: 2, label: 'II - zarządzać pytaniami' },
                            { val: 3, label: 'III - zarządzać pytaniami i etykietami' }
                        ].map((opt) => (
                            <div
                                key={opt.val}
                                onClick={() => setRightsLevel(opt.val)}
                                className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${rightsLevel === opt.val ? 'bg-bg-200 border-accent-500' : 'bg-bg-100 border-bg-300 hover:border-bg-400'}`}
                            >
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${rightsLevel === opt.val ? 'border-accent-500' : 'border-bg-400'}`}>
                                    {rightsLevel === opt.val && <div className="w-2 h-2 rounded-full bg-accent-500" />}
                                </div>
                                <span className="text-sm text-text-900">{opt.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-text-500 mt-1">Poziom dostępu definiuje do jakich akcji mają dostęp uczestnicy turnieju (z wykluczeniem organizatorów, którzy mogą wszystko).</p>
                </div>

                <hr className="border-bg-300 my-2" />

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-text-700">Domyślne opcje odpowiedzi</label>
                        <button
                            type="button"
                            onClick={() => setDefaultOptions(prev => [...prev, { id: `temp-${Date.now()}`, name: '' }])}
                            className="text-xs flex items-center gap-1 font-medium text-accent-500 hover:text-accent-600 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> Dodaj opcję
                        </button>
                    </div>

                    {defaultOptions.length === 0 ? (
                        <div className="text-sm text-text-500 italic py-2 text-center bg-bg-100 rounded-md border border-dashed border-bg-300">
                            Brak domyślnych opcji.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                            {defaultOptions.map((opt, idx) => (
                                <div key={opt.id || idx} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={opt.name}
                                        onChange={(e) => {
                                            const newOpts = [...defaultOptions];
                                            newOpts[idx] = { ...newOpts[idx], name: e.target.value };
                                            setDefaultOptions(newOpts);
                                        }}
                                        className="input_base py-2 flex-1 text-sm"
                                        placeholder={`Opcja ${idx + 1}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newOpts = [...defaultOptions];
                                            newOpts.splice(idx, 1);
                                            setDefaultOptions(newOpts);
                                        }}
                                        className="p-2 text-text-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-md transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-text-500 mt-1">Te opcje będą automatycznie dodawane jako szablon przy każdym nowym pytaniu.</p>
                </div>
            </div>
        </Modal>
    );
}
