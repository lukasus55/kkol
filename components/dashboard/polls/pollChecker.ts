export async function checkHasUnansweredPolls(user: any): Promise<boolean> {
  if (!user?.id) return false;
  try {
    const res = await fetch('/api/polls');
    if (!res.ok) return false;
    const pData = await res.json();
    if (!Array.isArray(pData) || pData.length === 0) return false;

    const now = new Date();
    const eligiblePolls = pData.filter((poll: any) => {
      const isPlayer = !!user.tournaments?.[poll.tournament_id];
      const isOrganizer = !!user.organizer_roles?.[poll.tournament_id];
      const isStarted = !poll.start_date || new Date(poll.start_date) <= now;
      const isEnded = poll.end_date && new Date(poll.end_date) < now;
      return (isPlayer || isOrganizer) && isStarted && !isEnded;
    });

    if (eligiblePolls.length === 0) return false;

    for (const poll of eligiblePolls) {
      const [qRes, aRes] = await Promise.all([
        fetch(`/api/poll_questions?poll=${poll.id}`).catch(() => null),
        fetch(`/api/poll_player_answers?poll=${poll.id}&player=${user.id}`).catch(() => null)
      ]);

      if (qRes?.ok && aRes?.ok) {
        const questions = await qRes.json();
        const answers = await aRes.json();
        if (Array.isArray(questions)) {
          const answerable = questions.filter(
            (q: any) => Array.isArray(q.options) && q.options.length > 0
          );
          if (answerable.length > 0) {
            const hasUnanswered = answerable.some(
              (q: any) => !answers[q.id] || answers[q.id].length === 0
            );
            if (hasUnanswered) return true;
          }
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}
