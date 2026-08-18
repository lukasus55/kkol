import { useState, useEffect } from 'react';
import { X, Settings, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

interface PollSettingsModalProps {
    poll: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedPoll: any) => void;
}

const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
};

export default function PollSettingsModal({ poll, isOpen, onClose, onSuccess }: PollSettingsModalProps) {
    const { addToast } = useToast();
    const [name, setName] = useState(poll?.name || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [rightsLevel, setRightsLevel] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && poll) {
            setName(poll.name);
            setStartDate(formatDateForInput(poll.start_date));
            setEndDate(formatDateForInput(poll.end_date));
            setRightsLevel(poll.rights_level);
            setError('');
        }
    }, [isOpen, poll]);

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
            onSuccess({
                ...poll,
                name,
                start_date: new Date(startDate).toISOString(),
                end_date: new Date(endDate).toISOString(),
                rights_level: Number(rightsLevel)
            });
            addToast({ message: "Ustawienia ankiety zostały zapisane", type: "success" });
            onClose();

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
        } catch (err: any) {
            addToast({ message: err.message || "Wystąpił nieznany błąd", type: "error" });
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
            </div>
        </Modal>
    );
}
