import sys

with open('src/App.jsx', 'r') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    line_num = i + 1
    # Very simple parser - this is not perfect but might help
    # Check for <div (ignore self-closing or single-line for now)
    if '<div' in line and '/>' not in line:
        stack.append(line_num)
    if '</div>' in line:
        if stack:
            stack.pop()
        else:
            print(f"Unmatched </div> on line {line_num}")

for line_num in stack:
    print(f"Unmatched <div on line {line_num}")
