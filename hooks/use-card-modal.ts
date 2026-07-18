import { create } from "zustand";

// A stack of open card ids. Opening a card fresh (from the board, a table
// row, a deep link, etc.) replaces the whole stack with just that card.
// Opening a subtask from WITHIN an already-open card's modal pushes onto the
// stack instead, so the parent stays mounted underneath and reappears when
// the subtask's modal is closed.
type CardModalStore = {
  stack: string[];
  onOpen: (id: string) => void;
  onOpenNested: (id: string) => void;
  onClose: () => void;
};

export const useCardModal = create<CardModalStore>((set) => ({
  stack: [],
  onOpen: (id: string) => set({ stack: [id] }),
  onOpenNested: (id: string) => set((state) => ({ stack: [...state.stack, id] })),
  onClose: () => set((state) => ({ stack: state.stack.slice(0, -1) })),
}));
