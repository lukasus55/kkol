'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import PollHeader from '@/components/polls/PollHeader';
import PollVoteTab from '@/components/polls/PollVoteTab';
import PollEditTab from '@/components/polls/PollEditTab';
import PollResultsTab from '@/components/polls/PollResultsTab';
import PollSettingsModal from '@/components/polls/PollSettingsModal';
import PollLabelsModal from '@/components/polls/PollLabelsModal';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/ToastProvider';
// We will import ResultsTab in Stage 3

export default function PollClient() {
  const router = useRouter();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const pollId = params?.id as string;

  // Modes: 'vote', 'results', 'edit'
  const [mode, setMode] = useState<'vote' | 'results' | 'edit'>(() => {
    const m = searchParams?.get('m');
    if (m === 'e') return 'edit';
    if (m === 'r') return 'results';
    return 'vote';
  });

  // Loading states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [user, setUser] = useState<any>(null);
  const [poll, setPoll] = useState<any>(null);
  const [labels, setLabels] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({}); // { question_id: [option_id, ...] }
  
  // Original states for Reset
  const [originalQuestions, setOriginalQuestions] = useState<any[]>([]);
  const [originalAnswers, setOriginalAnswers] = useState<Record<string, string[]>>({});

  // Permissions
  const [permissions, setPermissions] = useState({
    canEditSettings: false,
    canEditLabels: false,
    canEditQuestions: false,
    canVote: false,
    votingStatus: 'open'
  });

  // Dirty flags
  const normalizeAnswers = (ans: Record<string, string[]>) => {
    const normalized: Record<string, string[]> = {};
    Object.keys(ans).sort().forEach(k => {
      normalized[k] = [...ans[k]].sort();
    });
    return JSON.stringify(normalized);
  };
  const isAnswersDirty = normalizeAnswers(answers) !== normalizeAnswers(originalAnswers);
  const isQuestionsDirty = JSON.stringify(questions) !== JSON.stringify(originalQuestions);

  // Modals
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLabelsModalOpen, setIsLabelsModalOpen] = useState(false);

  // Filters
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  useEffect(() => {
    if (!pollId) {
      setError('Brak ID ankiety w URL.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const userRes = await fetch('/api/me');
        if (!userRes.ok) throw new Error('Brak autoryzacji');
        const userData = await userRes.json();
        const currentUser = userData.user;

        const pollRes = await fetch(`/api/polls?id=${pollId}`);
        const pollDataArr = await pollRes.json();
        if (!pollDataArr || pollDataArr.length === 0) {
          throw new Error('Ankieta nie istnieje.');
        }
        const currentPoll = pollDataArr[0];

        // Fetch labels, questions, answers concurrently
        const timestamp = Date.now();
        const labelsRes = await fetch(`/api/poll_labels?poll=${pollId}&t=${timestamp}`);
        const questionsRes = await fetch(`/api/poll_questions?poll=${pollId}&t=${timestamp}`);
        const answersRes = await fetch(`/api/poll_player_answers?poll=${pollId}&player=${currentUser.id}&t=${timestamp}`);

        if (!questionsRes.ok) {
            const errData = await questionsRes.json();
            throw new Error(errData.error || 'Brak dostępu do pytań.');
        }

        const labelsData = await labelsRes.json();
        const questionsData = await questionsRes.json();
        const answersMap = await answersRes.json(); // API returns Record<string, string[]>

        // Permission Logic
        const isGlobalAdmin = currentUser.role === 'admin';
        const tourRole = currentUser.organizer_roles?.[currentPoll.tournament_id];
        const isTourManagerOrOwner = tourRole === 'owner' || tourRole === 'manager';
        const isTourPlayer = !!currentUser.tournaments?.[currentPoll.tournament_id];

        const canEditSettings = isGlobalAdmin || isTourManagerOrOwner;
        const rightsLevel = currentPoll.rights_level || 0;

        const now = new Date();
        const startDate = currentPoll.start_date ? new Date(currentPoll.start_date) : null;
        const endDate = currentPoll.end_date ? new Date(currentPoll.end_date) : null;

        let votingStatus = 'open';
        if (startDate && startDate > now) votingStatus = 'not_started';
        else if (endDate && endDate < now) votingStatus = 'ended';

        setPermissions({
          canEditSettings,
          canEditLabels: canEditSettings || rightsLevel >= 3,
          canEditQuestions: canEditSettings || rightsLevel >= 2,
          canVote: canEditSettings || isTourPlayer || rightsLevel >= 1, // Basic assumption
          votingStatus
        });

        setUser(currentUser);
        setPoll(currentPoll);
        setLabels(labelsData || []);
        
        setQuestions(questionsData || []);
        setOriginalQuestions(JSON.parse(JSON.stringify(questionsData || []))); // deep copy

        setAnswers(answersMap || {});
        setOriginalAnswers(JSON.parse(JSON.stringify(answersMap || {}))); // deep copy

      } catch (err: any) {
        console.error(err);
        if (err.message === 'Brak autoryzacji') {
           router.push(`/login?r=${encodeURIComponent(`poll/${pollId}`)}`);
           return;
        }
        setError(err.message || 'Wystąpił błąd.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pollId]);


  const [isClosingModal, setIsClosingModal] = useState(false);
  const [shakeModal, setShakeModal] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);

  // Intercept all link clicks when there are unsaved changes
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (isAnswersDirty || isQuestionsDirty) {
        const target = e.target as HTMLElement;
        const link = target.closest('a');
        if (link && link.href && !link.href.includes(window.location.pathname) && link.target !== '_blank') {
            e.preventDefault();
            e.stopPropagation();
            setShakeModal(true);
            setShakeScreen(true);
            setTimeout(() => {
                setShakeModal(false);
                setShakeScreen(false);
            }, 500);
        }
      }
    };
    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [isAnswersDirty, isQuestionsDirty]);

  const handleModeChange = (newMode: 'vote' | 'results' | 'edit') => {
    if (newMode === mode) return;
    if (isAnswersDirty || isQuestionsDirty) {
      setShakeModal(true);
      setShakeScreen(true);
      setTimeout(() => {
        setShakeModal(false);
        setShakeScreen(false);
      }, 500);
      return;
    }
    setMode(newMode);
  };

  // Helper to handle modal closing animation
  const closeModal = (callback: () => void) => {
      setIsClosingModal(true);
      setTimeout(() => {
          callback();
          setIsClosingModal(false);
      }, 400); // Wait for animation to finish
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 text-center text-text-500">
        <h2 className="text-2xl mb-4 font-bold">Wystąpił problem</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (loading || !poll) {
    return (
      <div className="w-full max-w-5xl px-4 py-8 flex flex-col gap-6 animate-pulse mt-8">
        <div className="h-24 bg-bg-200 rounded-md w-full"></div>
        <div className="h-64 bg-bg-200 rounded-md w-full"></div>
        <div className="h-64 bg-bg-200 rounded-md w-full"></div>
      </div>
    );
  }

  return (
    <>
      <div className={`w-full max-w-[800px] px-4 py-8 flex flex-col relative min-h-screen ${shakeScreen ? 'animate-shake' : ''}`}>

      {/* HEADER */}
      <PollHeader
        poll={poll}
        mode={mode}
        setMode={handleModeChange}
        permissions={permissions}
        labels={labels}
        filterQuery={filterQuery}
        setFilterQuery={setFilterQuery}
        selectedLabels={selectedLabels}
        setSelectedLabels={setSelectedLabels}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenLabels={() => setIsLabelsModalOpen(true)}
      />

      {/* CONTENT */}
      <div className="mt-6 flex-1 w-full">
        {mode === 'vote' && (
          <PollVoteTab
            poll={poll}
            questions={questions}
            labels={labels}
            answers={answers}
            setAnswers={setAnswers}
            filterQuery={filterQuery}
            selectedLabels={selectedLabels}
            permissions={permissions}
          />
        )}

        {mode === 'results' && (
          <PollResultsTab 
            pollId={pollId}
            questions={questions}
            labels={labels}
            filterQuery={filterQuery}
            selectedLabels={selectedLabels}
          />
        )}

        {mode === 'edit' && (
          <PollEditTab
            questions={questions}
            setQuestions={setQuestions}
            labels={labels}
            permissions={permissions}
            filterQuery={filterQuery}
            selectedLabels={selectedLabels}
          />
        )}
      </div>
      </div>

      {/* UNSAVED CHANGES BAR (Floating) */}
      {(isAnswersDirty || isQuestionsDirty || isClosingModal) && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 p-4 md:px-6 md:py-5 w-[90vw] md:w-auto max-w-[600px] rounded-xl shadow-2xl flex items-center justify-between gap-4 md:gap-6 z-[100] transition-colors duration-300 ${isClosingModal ? 'animate-bounce-out' : 'animate-bounce-in'} ${shakeModal ? 'bg-danger-500 border border-danger-600' : 'bg-bg-200 border border-bg-400'}`}>
          <span className={`font-medium transition-colors duration-300 text-sm md:text-base ${shakeModal ? 'text-bg-100' : 'text-text-700'}`}>
            <span className="md:hidden">Niezapisane zmiany</span>
            <span className="hidden md:inline">Uważaj - masz niezapisane zmiany!</span>
          </span>
          <div className="flex gap-3">
            <button 
                className="btn_tertiary bg-transparent text-text-500 hover:text-text-900 border-none px-5 py-2.5"
                onClick={() => {
                  closeModal(() => {
                      if (mode === 'vote') {
                          setAnswers(JSON.parse(JSON.stringify(originalAnswers)));
                      } else if (mode === 'edit') {
                          setQuestions(JSON.parse(JSON.stringify(originalQuestions)));
                      }
                  });
                }}
            >
                Resetuj
            </button>
            <button 
                className="btn_primary px-6 py-2.5 bg-accent-500 text-bg-100 hover:bg-accent-600 font-bold rounded-md flex items-center gap-2"
                onClick={async () => {
                  if (mode === 'vote') {
                      addToast({ message: "Odpowiedzi zostały pomyślnie zapisane", type: "success" });
                      closeModal(() => {
                          setOriginalAnswers(JSON.parse(JSON.stringify(answers)));
                      });
                      try {
                          const res = await fetch('/api/poll_players_answers_update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ poll_id: pollId, answers })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Błąd podczas zapisywania odpowiedzi");
                      } catch (err: any) {
                          addToast({ message: err.message || "Wystąpił nieznany błąd", type: "error" });
                      }
                  } else if (mode === 'edit') {
                      const invalidQuestion = questions.find((q: any) => !q.name || !q.name.trim() || q.name.length < 3);
                      if (invalidQuestion) {
                          addToast({ message: "Każde pytanie musi posiadać treść (min. 3 znaki)", type: "error" });
                          return;
                      }
                      for (const q of questions) {
                          const invalidOption = q.options.find((o: any) => !o.name || !o.name.trim());
                          if (invalidOption) {
                              addToast({ message: `Opcje odpowiedzi w pytaniu "${q.name}" nie mogą być puste`, type: "error" });
                              return;
                          }
                      }

                      addToast({ message: "Zmiany w ankiecie zostały pomyślnie zapisane", type: "success" });
                      closeModal(() => {
                          setOriginalQuestions(JSON.parse(JSON.stringify(questions)));
                      });

                      try {
                          const res = await fetch('/api/poll_question_update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ poll_id: pollId, questions })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Błąd podczas zapisywania pytań");
                      } catch (err: any) {
                          addToast({ message: err.message || "Wystąpił nieznany błąd", type: "error" });
                      }
                  }
                }}
            >
                <Save className="w-4 h-4" /> Zapisz
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <PollSettingsModal 
        poll={poll}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={(updatedPoll) => {
            setPoll(updatedPoll);
        }}
      />

      <PollLabelsModal
        pollId={pollId}
        labels={labels}
        isOpen={isLabelsModalOpen}
        onClose={() => setIsLabelsModalOpen(false)}
        onSuccess={(updatedLabels) => {
            setLabels(updatedLabels);
        }}
      />
    </>
  );
}
