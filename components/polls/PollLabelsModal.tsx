import { useState, useEffect } from 'react';
import { X, Tag, Plus, Edit2, Trash2, AlertCircle, Save } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PollLabelsModalProps {
    pollId: string;
    labels: any[];
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (updatedLabels: any[]) => void;
}

export default function PollLabelsModal({ pollId, labels, isOpen, onClose, onSuccess }: PollLabelsModalProps) {
    const [localLabels, setLocalLabels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', hex: '#6366f1' });

    useEffect(() => {
        if (isOpen) {
            setLocalLabels([...labels]);
            setError('');
            setEditingId(null);
            resetForm();
        }
    }, [isOpen, labels]);

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

    const resetForm = () => {
        setEditForm({ name: '', description: '', hex: '#6366f1' });
        setEditingId(null);
    };

    const startEditing = (label: any) => {
        setEditingId(label.id);
        setEditForm({
            name: label.name,
            description: label.description || '',
            hex: label.hex
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Czy na pewno chcesz usunąć tę etykietę? Zostanie ona usunięta ze wszystkich pytań.")) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/poll_label_delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error("Błąd podczas usuwania etykiety");
            
            const newLabels = localLabels.filter(l => l.id !== id);
            setLocalLabels(newLabels);
            onSuccess(newLabels);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editForm.name.trim()) {
            setError('Nazwa etykiety nie może być pusta.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (editingId === 'NEW') {
                // Create
                const res = await fetch('/api/poll_label_create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        poll: pollId,
                        name: editForm.name,
                        description: editForm.description,
                        hex: editForm.hex
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Błąd tworzenia etykiety');
                
                const newLabels = [...localLabels, data.label];
                setLocalLabels(newLabels);
                onSuccess(newLabels);
            } else {
                // Update
                const res = await fetch('/api/poll_label_update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: editingId,
                        name: editForm.name,
                        description: editForm.description,
                        hex: editForm.hex
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Błąd aktualizacji etykiety');
                
                const newLabels = localLabels.map(l => l.id === editingId ? { ...l, ...editForm } : l);
                setLocalLabels(newLabels);
                onSuccess(newLabels);
            }
            resetForm();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-2xl"
            title={
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-text-500" />
                    <span>Menedżer Etykiet</span>
                </div>
            }
            footer={
                <div className="flex justify-end w-full">
                    <Button variant="primary" onClick={onClose}>Gotowe</Button>
                </div>
            }
        >
            <div className="flex flex-col gap-5 py-2">
                {error && (
                    <div className="p-3 rounded-md bg-danger-500/10 border border-danger-500 text-danger-500 text-sm flex items-center gap-2 shrink-0">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* EXISTING LABELS LIST */}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-text-900">Etykiety w tej ankiecie</h3>
                        {!editingId && (
                            <Button 
                                variant="secondary"
                                onClick={() => setEditingId('NEW')}
                                className="!py-1.5 !px-3 !text-sm flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" /> Nowa etykieta
                            </Button>
                        )}
                    </div>

                    {localLabels.length === 0 && !editingId && (
                        <div className="text-center p-8 bg-bg-200 border border-dashed border-bg-400 rounded-md text-text-500 text-sm">
                            Brak zdefiniowanych etykiet. Kliknij przycisk powyżej, aby utworzyć pierwszą.
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {localLabels.map(label => (
                            <div key={label.id} className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 rounded-md border transition-colors ${editingId === label.id ? 'bg-bg-200 border-accent-500' : 'bg-bg-100 border-bg-300 hover:border-bg-400'}`}>
                                
                                {/* LABEL PREVIEW */}
                                <div className="flex flex-col gap-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.hex }} />
                                        <span className="font-medium text-text-900 truncate">{label.name}</span>
                                    </div>
                                    {label.description && (
                                        <p className="text-xs text-text-500 truncate pl-5">{label.description}</p>
                                    )}
                                </div>

                                {/* ACTIONS OR EDITOR */}
                                {editingId === label.id ? (
                                    <div className="flex flex-col gap-3 w-full md:w-auto bg-bg-200 p-3 rounded-md border border-bg-300">
                                        <div className="flex gap-2 items-center">
                                            <input type="color" value={editForm.hex} onChange={e => setEditForm({...editForm, hex: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent shrink-0" />
                                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Nazwa" className="input_base text-sm py-1.5" />
                                        </div>
                                        <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Opis (opcjonalnie)" className="input_base text-sm py-1.5" />
                                        <div className="flex gap-2 justify-end mt-1">
                                            <Button variant="secondary" onClick={resetForm} className="!py-1.5 !px-3 !text-xs">Anuluj</Button>
                                            <Button variant="primary" onClick={handleSave} isLoading={loading} className="!py-1.5 !px-3 !text-xs flex items-center gap-1">Zapisz</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-1 shrink-0 pl-5 md:pl-0">
                                        <button onClick={() => startEditing(label)} disabled={!!editingId} className="p-1.5 text-text-500 hover:text-accent-500 hover:bg-bg-200 rounded transition-colors disabled:opacity-50">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(label.id)} disabled={!!editingId || loading} className="p-1.5 text-text-500 hover:text-danger-500 hover:bg-bg-200 rounded transition-colors disabled:opacity-50">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* NEW LABEL EDITOR */}
                        {editingId === 'NEW' && (
                            <div className="flex flex-col gap-3 p-4 rounded-md border border-accent-500 bg-bg-200 mt-2">
                                <h4 className="font-semibold text-sm text-text-900 mb-1">Tworzenie nowej etykiety</h4>
                                <div className="flex gap-3 items-center">
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <label className="text-xs font-semibold text-text-500">Kolor</label>
                                        <input type="color" value={editForm.hex} onChange={e => setEditForm({...editForm, hex: e.target.value})} className="w-10 h-10 rounded cursor-pointer border-none p-0 bg-transparent" />
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-xs font-semibold text-text-500">Nazwa</label>
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Np. Frontend" className="input_base text-sm" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-text-500">Opis (opcjonalnie)</label>
                                    <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} placeholder="Krótki opis do czego służy etykieta..." className="input_base text-sm" />
                                </div>
                                <div className="flex gap-2 justify-end mt-2">
                                    <Button variant="secondary" onClick={resetForm} className="!py-2 !px-4 !text-sm">Anuluj</Button>
                                    <Button variant="primary" onClick={handleSave} isLoading={loading} className="!py-2 !px-4 !text-sm flex items-center gap-1.5"><Plus className="w-4 h-4"/> Utwórz Etykietę</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
