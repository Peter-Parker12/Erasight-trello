export type DepartmentNode<T> = T & { children: DepartmentNode<T>[] };

type TreeInput = { id: string; parentId: string | null; order: number };

// Builds a nested tree from a flat list of departments, sorted by `order`
// within each level. A department whose parentId doesn't resolve to another
// item in the list (e.g. dangling/cross-org data) is treated as a root.
export const buildDepartmentTree = <T extends TreeInput>(items: T[]): DepartmentNode<T>[] => {
  const byId = new Map<string, DepartmentNode<T>>();
  items.forEach((item) => byId.set(item.id, { ...item, children: [] }));

  const roots: DepartmentNode<T>[] = [];
  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortTree = (nodes: DepartmentNode<T>[]) => {
    nodes.sort((a, b) => a.order - b.order);
    nodes.forEach((n) => sortTree(n.children));
  };
  sortTree(roots);

  return roots;
};

// All ids in the subtree rooted at `id` (including `id` itself). Used to keep
// a department (and its own descendants) out of its own "parent" picker.
export const descendantIds = <T extends TreeInput>(items: T[], id: string): Set<string> => {
  const childrenOf = new Map<string, string[]>();
  items.forEach((item) => {
    if (!item.parentId) return;
    childrenOf.set(item.parentId, [...(childrenOf.get(item.parentId) ?? []), item.id]);
  });

  const result = new Set<string>([id]);
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) continue;
    result.add(current);
    stack.push(...(childrenOf.get(current) ?? []));
  }
  return result;
};
