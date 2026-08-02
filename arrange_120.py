import csv

file_path = "/Users/seungkyulee/Projects/jiguchon/bible_ox_quiz.csv"

with open(file_path, mode="r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Divide into 4 Pools of 30 items
# Each pool must have 15 O and 15 X
r1_pool = rows[:30]
r2_pool = rows[30:60]
r3_pool = rows[60:90]
r4_pool = rows[90:120]

def organize_pool(pool, priority_keywords):
    o_items = [r for r in pool if r["정답"] == "O"]
    x_items = [r for r in pool if r["정답"] == "X"]
    
    # Priority sorting
    def get_score(r):
        for idx, kw in enumerate(priority_keywords):
            if kw in r["문제"] or kw in r["카테고리"]:
                return idx
        return 999
        
    o_items.sort(key=get_score)
    x_items.sort(key=get_score)
    
    # Front 15: 8 O and 7 X (or 7 O and 8 X)
    front_o = o_items[:8]
    back_o = o_items[8:]
    
    front_x = x_items[:7]
    back_x = x_items[7:]
    
    # Front 15: Unpredictable O/X pattern
    front_15 = [
        front_o[0], front_o[1], front_x[0], front_o[2],
        front_x[1], front_x[2], front_o[3], front_x[3],
        front_o[4], front_x[4], front_o[5], front_x[5],
        front_o[6], front_x[6], front_o[7]
    ]
    
    # Back 15: Unpredictable O/X pattern (7 O, 8 X)
    back_15 = [
        back_x[0], back_o[0], back_x[1], back_o[1],
        back_o[2], back_x[2], back_x[3], back_o[3],
        back_x[4], back_o[4], back_x[5], back_o[5],
        back_x[6], back_o[6], back_x[7]
    ]
    
    return front_15 + back_15

r1_kw = ["연예", "스포츠", "ELEVEN", "카리나", "세종대왕", "다윗"]
r2_kw = ["사회", "역사", "과학", "헌법", "독도", "자전", "광합성"]
r3_kw = ["지구촌교회", "3N", "느헤미야", "예수님", "사도행전", "성령"]
r4_kw = ["말라기", "옥중서신", "유월절", "갈멜산", "팔복", "삼손"]

# Ensure exactly 15 O and 15 X per pool
final_rows = []
for i, (pool, kw) in enumerate([(r1_pool, r1_kw), (r2_pool, r2_kw), (r3_pool, r3_kw), (r4_pool, r4_kw)], 1):
    o_cnt = sum(1 for r in pool if r["정답"] == "O")
    x_cnt = sum(1 for r in pool if r["정답"] == "X")
    print(f"Pool {i} initial O: {o_cnt}, X: {x_cnt}")

# Let us construct clean balanced pools if needed
all_o = [r for r in rows if r["정답"] == "O"]
all_x = [r for r in rows if r["정답"] == "X"]

# Divide into 4 sets of 15 O and 15 X
set1_o, set2_o, set3_o, set4_o = all_o[:15], all_o[15:30], all_o[30:45], all_o[45:60]
set1_x, set2_x, set3_x, set4_x = all_x[:15], all_x[15:30], all_x[30:45], all_x[45:60]

def build_round(set_o, set_x, kw):
    def get_score(r):
        for idx, k in enumerate(kw):
            if k in r["문제"] or k in r["카테고리"]:
                return idx
        return 999
        
    set_o.sort(key=get_score)
    set_x.sort(key=get_score)
    
    front_o = set_o[:8]
    back_o = set_o[8:]
    
    front_x = set_x[:7]
    back_x = set_x[7:]
    
    front_15 = [
        front_o[0], front_o[1], front_x[0], front_o[2],
        front_x[1], front_x[2], front_o[3], front_x[3],
        front_o[4], front_x[4], front_o[5], front_x[5],
        front_o[6], front_x[6], front_o[7]
    ]
    
    back_15 = [
        back_x[0], back_o[0], back_x[1], back_o[1],
        back_o[2], back_x[2], back_x[3], back_o[3],
        back_x[4], back_o[4], back_x[5], back_o[5],
        back_x[6], back_o[6], back_x[7]
    ]
    
    return front_15 + back_15

r1_final = build_round(set1_o, set1_x, r1_kw)
r2_final = build_round(set2_o, set2_x, r2_kw)
r3_final = build_round(set3_o, set3_x, r3_kw)
r4_final = build_round(set4_o, set4_x, r4_kw)

final_120 = r1_final + r2_final + r3_final + r4_final

fieldnames = ["난이도", "카테고리", "문제", "정답", "해설 및 참고"]

with open(file_path, mode="w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(final_120)

print("Arranged 120 items into 4 rounds with 15 Essential + 15 Reserve priority successfully!")
