import csv
import random

file_path = "/Users/seungkyulee/Projects/jiguchon/bible_ox_quiz.csv"

with open(file_path, mode="r", encoding="utf-8") as f:
    reader = csv.reader(f)
    rows = list(reader)

header = rows[0]
data = rows[1:]

diff_groups = {"하": [], "중": [], "상": [], "눈치": []}

for r in data:
    diff_groups[r[0]].append(r)

new_data = []

# Seed for deterministic, unreadable non-periodic pattern
random.seed(123)

for diff in ["하", "중", "상", "눈치"]:
    group = diff_groups[diff]
    random.shuffle(group)
    new_data.extend(group)

with open(file_path, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(header)
    writer.writerows(new_data)

o_count = sum(1 for r in new_data if r[3] == "O")
x_count = sum(1 for r in new_data if r[3] == "X")
print(f"Shuffled successfully! Total: {len(new_data)}, O: {o_count}, X: {x_count}")

# Print first 20 answers to verify no simple alternating pattern
ans_sequence = "".join([r[3] for r in new_data[:25]])
print("First 25 answers sequence (Unpredictable pattern):", ans_sequence)
