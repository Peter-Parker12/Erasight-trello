
append_code = r"""

type GroupSectionProps = {
  label: string;
  color?: string;
  cards: GroupEntry[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
};

const GroupSection = ({ label, color, cards, selectedIds, onSelect }: GroupSectionProps) => {
  const [open, setOpen] = useState(true);
  const allSel = cards.length > 0 && cards.every((c) => selectedIds.has(c.card.id));
  return (
    <>
      <tr className="bg-muted/30 border-b">
        <td className="py-1.5 px-3">
          <input type="checkbox" checked={allSel}
            onChange={() => cards.forEach((c) => onSelect(c.card.id))}
            className="rounded border-gray-300 text-sky-600" />
        </td>
        <td colSpan={8} className="py-1.5 px-2">
          <button
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {color && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
            {label} <span className="font-normal text-muted-foreground/60">({cards.length})</span>
          </button>
        </td>
      </tr>
      {open && cards.map(({ card, listName, listColor }) => (
        <CardRow key={card.id} card={card} listName={listName} listColor={listColor} selected={selectedIds.has(card.id)} onSelect={onSelect} />
      ))}
    </>
  );
};

export const ListView = ({ lists }: ListViewProps) => {
  const [groupBy, setGroupBy] = useState<"list" | "priority" | "assignee">("list");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const allCards = useMemo<GroupEntry[]>(
    () => lists.flatMap((list) => list.cards.map((card) => ({ card, listName: list.title, listColor: getListColor(list.title) }))),
    [lists]
  );

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const groups = useMemo(() => {
    if (groupBy === "list") {
      return lists
        .map((l) => ({ label: l.title, color: getListColor(l.title) as string | undefined, cards: allCards.filter((c) => c.listName === l.title) }))
        .filter((g) => g.cards.length > 0);
    }
    if (groupBy === "priority") {
      return PRIORITY_ORDER
        .map((p) => ({ label: PRIORITY_BADGE[p].label, color: undefined as string | undefined, cards: allCards.filter((c) => c.card.priority === p) }))
        .filter((g) => g.cards.length > 0);
    }
    const map = new Map<string, { name: string; cards: GroupEntry[] }>();
    allCards.forEach((row) => {
      if (row.card.members.length === 0) {
        if (!map.has("__none")) map.set("__none", { name: "Unassigned", cards: [] });
        map.get("__none")!.cards.push(row);
      } else {
        row.card.members.forEach((m) => {
          if (!map.has(m.userId)) map.set(m.userId, { name: m.userName, cards: [] });
          map.get(m.userId)!.cards.push(row);
        });
      }
    });
    return Array.from(map.values()).map((v) => ({ label: v.name, color: undefined as string | undefined, cards: v.cards }));
  }, [groupBy, allCards, lists]);

  if (allCards.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        No cards yet. Switch to Board view to add cards.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Group by:</span>
        {(["list", "priority", "assignee"] as const).map((g) => (
          <button key={g} onClick={() => setGroupBy(g)}
            className={cn("text-xs px-3 py-1 rounded-full border transition",
              groupBy === g ? "bg-gray-900 text-white border-gray-900" : "bg-white text-muted-foreground border-gray-200 hover:border-gray-400"
            )}>
            {g === "list" ? "List" : g === "priority" ? "Priority" : "Assignee"}
          </button>
        ))}
        {selectedIds.size > 0 && <span className="ml-2 text-xs text-sky-600 font-medium">{selectedIds.size} selected</span>}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="py-2.5 px-3 w-8">
                <input type="checkbox"
                  onChange={(e) => setSelectedIds(e.target.checked ? new Set(allCards.map((c) => c.card.id)) : new Set())}
                  checked={selectedIds.size === allCards.length && allCards.length > 0}
                  className="rounded border-gray-300 text-sky-600" />
              </th>
              {["Title","List","Labels","Priority","Due Date","Checklist","Activity","Members"].map((h) => (
                <th key={h} className="text-left py-2.5 px-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupSection key={group.label} label={group.label} color={group.color} cards={group.cards} selectedIds={selectedIds} onSelect={toggleSelect} />
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-2xl">
          <span className="text-sm font-medium">{selectedIds.size} card{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="w-px h-4 bg-white/20 mx-1" />
          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-400 hover:bg-white/10 gap-1" onClick={() => setSelectedIds(new Set())}>
            <Trash2 className="h-3.5 w-3.5" /> Clear selection
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-white/50 hover:text-white ml-1">x</button>
        </div>
      )}
    </div>
  );
};
"""

with open(r'd:\Erasight-trello\Erasight-trello\app\(platform)\(dashboard)\board\[boardId]\_components\list-view.tsx', 'a', encoding='utf-8') as f:
    f.write(append_code)
print('Done')
