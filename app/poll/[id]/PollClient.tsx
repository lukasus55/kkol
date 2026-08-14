'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import PollHeader from '@/components/polls/PollHeader';
import PollVoteTab from '@/components/polls/PollVoteTab';
import PollEditTab from '@/components/polls/PollEditTab';
// We will import ResultsTab in Stage 3

export default function PollClient() {
  const router = useRouter();
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
  });

  // Dirty flags
  const [isAnswersDirty, setIsAnswersDirty] = useState(false);
  const [isQuestionsDirty, setIsQuestionsDirty] = useState(false);

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
        const [labelsRes, questionsRes, answersRes] = await Promise.all([
          fetch(`/api/poll_labels?poll=${pollId}&t=${timestamp}`),
          fetch(`/api/poll_questions?poll=${pollId}&t=${timestamp}`),
          fetch(`/api/poll_player_answers?poll=${pollId}&player=${currentUser.id}&t=${timestamp}`),
        ]);

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

        setPermissions({
          canEditSettings,
          canEditLabels: canEditSettings || rightsLevel >= 3,
          canEditQuestions: canEditSettings || rightsLevel >= 2,
          canVote: canEditSettings || isTourPlayer || rightsLevel >= 1, // Basic assumption
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

  const handleModeChange = (newMode: 'vote' | 'results' | 'edit') => {
    if (newMode === mode) return;
    if (isAnswersDirty || isQuestionsDirty) {
      setShakeModal(true);
      setTimeout(() => setShakeModal(false), 500);
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
    <div className="w-full max-w-[800px] px-4 py-8 flex flex-col relative min-h-screen">

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
      />

      {/* CONTENT */}
      <div className="mt-6 flex-1 w-full">
        {mode === 'vote' && (
          <PollVoteTab
            questions={questions}
            labels={labels}
            answers={answers}
            setAnswers={setAnswers}
            setIsAnswersDirty={setIsAnswersDirty}
            filterQuery={filterQuery}
            selectedLabels={selectedLabels}
            permissions={permissions}
          />
        )}

        {mode === 'results' && (
          <div className="text-center text-text-500 mt-20">Sekcja Wyników w budowie (Stage 3)</div>
        )}

        {mode === 'edit' && (
          <PollEditTab
            questions={questions}
            setQuestions={setQuestions}
            labels={labels}
            setIsQuestionsDirty={setIsQuestionsDirty}
            permissions={permissions}
          />
        )}
      </div>

      {/* UNSAVED CHANGES BAR (Floating) */}
      {(isAnswersDirty || isQuestionsDirty || isClosingModal) && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 p-4 md:px-6 md:py-5 rounded-xl shadow-2xl flex items-center gap-6 z-[100] transition-colors duration-300 ${isClosingModal ? 'animate-bounce-out' : 'animate-bounce-in'} ${shakeModal ? 'bg-danger-500 border border-danger-600' : 'bg-bg-200 border border-bg-400'}`}>
          <span className={`font-medium transition-colors duration-300 ${shakeModal ? 'text-bg-100' : 'text-text-700'}`}>
            Uważaj - masz niezapisane zmiany!
          </span>
          <div className="flex gap-3">
            <button 
                className="btn_tertiary bg-transparent text-text-500 hover:text-text-900 border-none px-5 py-2.5"
                onClick={() => {
                  closeModal(() => {
                      if (mode === 'vote') {
                          setAnswers(JSON.parse(JSON.stringify(originalAnswers)));
                          setIsAnswersDirty(false);
                      } else if (mode === 'edit') {
                          setQuestions(JSON.parse(JSON.stringify(originalQuestions)));
                          setIsQuestionsDirty(false);
                      }
                  });
                }}
            >
                Resetuj
            </button>
            <button 
                className="btn_primary px-8 py-2.5 bg-accent-500 text-bg-100 hover:bg-accent-600 font-bold"
                onClick={async () => {
                  if (mode === 'vote') {
                      // Bulk save answers
                      try {
                          const res = await fetch('/api/poll_players_answers_update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ poll_id: pollId, answers })
                          });
                          if (!res.ok) throw new Error("Błąd podczas zapisywania odpowiedzi");
                          closeModal(() => {
                              setOriginalAnswers(JSON.parse(JSON.stringify(answers)));
                              setIsAnswersDirty(false);
                          });
                      } catch (err) {
                          alert(err);
                      }
                  } else if (mode === 'edit') {
                      // Bulk save questions
                      try {
                          const res = await fetch('/api/poll_question_update', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ poll_id: pollId, questions })
                          });
                          if (!res.ok) throw new Error("Błąd podczas zapisywania pytań");
                          closeModal(() => {
                              setOriginalQuestions(JSON.parse(JSON.stringify(questions)));
                              setIsQuestionsDirty(false);
                          });
                      } catch (err) {
                          alert(err);
                      }
                  }
                }}
            >
                Zapisz
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
