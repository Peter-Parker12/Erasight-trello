export type EffectiveDueDate = {
  date: Date | null;
  isReview: boolean;
  overdue: boolean;
  dueSoon: boolean;
};

export const getEffectiveDueDate = (card: {
  dueDate: Date | string | null;
  reviewDeadline?: Date | string | null;
  completed: boolean;
}): EffectiveDueDate => {
  const due = card.dueDate ? new Date(card.dueDate) : null;
  const review = card.reviewDeadline ? new Date(card.reviewDeadline) : null;
  const date = due ?? review;
  const isReview = !due && !!review;

  const now = new Date();
  const overdue = !!date && !card.completed && date < now;
  const dueSoon = !!date && !card.completed && date > now && date.getTime() - now.getTime() < 86400000 * 2;

  return { date, isReview, overdue, dueSoon };
};
