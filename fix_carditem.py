path = r'd:\Erasight-trello\Erasight-trello\app\(platform)\(dashboard)\board\[boardId]\_components\card-item.tsx'
with open(path, encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
print(f'Total lines: {len(lines)}')

# Find second "use client"
found = []
for i, l in enumerate(lines):
    if 'use client' in l:
        found.append(i)
        print(f'Line {i+1}: {repr(l)}')

if len(found) >= 2:
    # Keep only up to (but not including) the second occurrence
    clean = '\n'.join(lines[:found[1]])
    with open(path, 'w', encoding='utf-8') as f:
        f.write(clean)
    print(f'Truncated to line {found[1]}')
else:
    print('No duplicate found')
