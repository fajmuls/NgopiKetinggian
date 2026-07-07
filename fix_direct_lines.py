import os

file_path = 'src/components/BookingModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Target line index 941 (942nd line) and 942 (943rd line)
# Let's print them first to confirm we are modifying the right lines
print("OLD LINE 942:", repr(lines[941]))
print("OLD LINE 943:", repr(lines[942]))

# Overwrite line 942 with the fixed single line and replace line 943 with empty string
lines[941] = "                              const lines = html.split('\\n').filter((l: string) => l.trim().length > 0);\n"
lines[942] = ""

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("SUCCESSFULLY REPLACED BY DIRECT LINE INDEX!")
