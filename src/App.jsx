import React, { useEffect, useMemo, useState } from "react";

/** ---------- ユーティリティ ---------- */
const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const storageKey = (date) => `workout-${date}`;
const clone = (v) => JSON.parse(JSON.stringify(v));

/** 器具の表示ラベル */
const EQUIP_LABEL = {
  machine: "マシン",
  dumbbell: "ダンベル",
  bodyweight: "自重",
  cable: "ケーブル",
  barbell: "バーベル",
};

/** ---------- デフォルトメニュー（彼女用） ---------- */
/** 基本は 50〜60分。軽めで効く全身メニュー。 */
const DEFAULT_PLAN = [
  {
    section: "ウォームアップ",
    items: [
      {
        id: "warmup-cardio",
        name: "トレッドミル or バイク",
        equipment: ["machine"],
        sets: 1,
        type: "time",
        timeSec: 300, // 5分
        note: "軽めでOK。心拍数を上げて体温め。",
      },
    ],
  },
  {
    section: "脚・お尻（引き締めメイン）",
    items: [
      {
        id: "squat",
        name: "スクワット",
        equipment: ["bodyweight", "dumbbell"],
        sets: 3,
        type: "reps",
        reps: 12,
        allowWeight: true, // ダンベル利用時は重量入力も可
        note: "膝とつま先は同方向。背中は真っ直ぐ。",
      },
      {
        id: "lunge",
        name: "ダンベル・ランジ",
        equipment: ["dumbbell"],
        sets: 3,
        type: "reps",
        reps: 10,
        perSide: true,
        allowWeight: true,
        note: "大股で踏み出し、前足で体を支えるイメージ。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/17503/",
      },
      {
        id: "hipthrust",
        name: "ヒップスラスト",
        equipment: ["machine", "barbell", "dumbbell", "bodyweight"],
        sets: 3,
        type: "reps",
        reps: 12,
        allowWeight: true,
        note: "お尻を真上に。フィニッシュで1秒止めると効く。",
      },
      {
        id: "kickback",
        name: "グルートキックバック",
        equipment: ["cable", "bodyweight"],
        sets: 3,
        type: "reps",
        reps: 12,
        perSide: true,
        allowWeight: false,
        note: "腰反らさずに、かかとで蹴る感覚で。",
      },
    ],
  },
  {
    section: "背中（姿勢改善）",
    items: [
      {
        id: "latpulldown",
        name: "ラットプルダウン",
        equipment: ["machine"],
        sets: 3,
        type: "reps",
        reps: 12,
        allowWeight: true,
        note: "バーを胸に引き下ろす。肩すくめない。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/18800/",
      },
    ],
  },
  {
    section: "胸・肩（上半身のライン）",
    items: [
      {
        id: "chestpress",
        name: "チェストプレス",
        equipment: ["machine"],
        sets: 3,
        type: "reps",
        reps: 12,
        allowWeight: true,
        note: "肩甲骨を寄せて押す。可動域は無理なく。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/18092/",
      },
      {
        id: "shoulderpress",
        name: "ショルダープレス",
        equipment: ["dumbbell", "machine"],
        sets: 3,
        type: "reps",
        reps: 10,
        allowWeight: true,
        note: "耳とダンベルが一直線。反り腰に注意。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/20177/",
      },
    ],
  },
  {
    section: "体幹（お腹・くびれ）",
    items: [
      {
        id: "plank",
        name: "プランク",
        equipment: ["bodyweight"],
        sets: 3,
        type: "time",
        timeSec: 45,
        note: "一直線をキープ。お尻が上がらないように。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/17477/",
      },
      {
        id: "sideplank",
        name: "サイドプランク",
        equipment: ["bodyweight"],
        sets: 3,
        type: "time",
        timeSec: 30,
        perSide: true,
        note: "横腹に効かせる。肩の真下に肘。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/20202/",
      },
      {
        id: "russiantwist",
        name: "ロシアンツイスト",
        equipment: ["bodyweight", "dumbbell"],
        sets: 3,
        type: "reps",
        reps: 20,
        allowWeight: true,
        note: "目線は正面、上体で捻る。反動NG。",
        link: "https://news.mynavi.jp/article/training-15/",
      },
    ],
  },
  {
    section: "仕上げ（脂肪燃焼）",
    items: [
      {
        id: "mountain",
        name: "マウンテンクライマー",
        equipment: ["bodyweight"],
        sets: 3,
        type: "time",
        timeSec: 30,
        note: "体幹固定、膝を素早く胸へ。",
        link: "https://co-medical.mynavi.jp/contents/therapistplus/lifestyle/beauty/22453/",
      },
    ],
  },
];

/** ---------- ローカル保存ヘルパ ---------- */
function makeEmptyLogFromPlan(plan) {
  const entries = {};
  plan.forEach((sec) =>
    sec.items.forEach((it) => {
      entries[it.id] = {
        chosenEquip: it.equipment[0],
        sets: Array.from({ length: it.sets }).map(() => ({
          done: false,
          weight: it.allowWeight ? "" : null,
          reps: it.type === "reps" ? it.reps : null,
          timeSec: it.type === "time" ? it.timeSec : null,
        })),
        note: it.note || "",
      };
    })
  );
  return { entries };
}

function loadDay(date, plan) {
  const raw = localStorage.getItem(storageKey(date));
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return parsed;
    } catch {}
  }
  return makeEmptyLogFromPlan(plan);
}

function saveDay(date, data) {
  localStorage.setItem(storageKey(date), JSON.stringify(data));
}

/** ---------- タイマー（休憩） ---------- */
function useCountdown() {
  const [sec, setSec] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active || sec <= 0) return;
    const id = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [active, sec]);

  useEffect(() => {
    if (sec <= 0 && active) setActive(false);
  }, [sec, active]);

  const start = (seconds) => {
    setSec(seconds);
    setActive(true);
  };
  const stop = () => setActive(false);
  const reset = () => {
    setSec(0);
    setActive(false);
  };

  return { sec, active, start, stop, reset };
}

/** ---------- UI コンポーネント ---------- */
function Chip({ children, active = false }) {
  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium " +
        (active ? "bg-brand-500 text-white" : "bg-brand-100 text-brand-700")
      }
    >
      {children}
    </span>
  );
}

function SectionCard({ title, children }) {
  return (
    <section className="bg-white rounded-2xl shadow-soft p-4 md:p-6">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** セット入力行 */
function SetRow({ idx, entry, onChange, type, allowWeight }) {
  const set = entry.sets[idx];
  return (
    <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-xl border border-neutral-200 p-2">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={set.done}
          onChange={(e) => onChange(idx, { done: e.target.checked })}
          className="size-5 accent-brand-500"
        />
        <span className="text-sm text-neutral-600">SET {idx + 1}</span>
      </label>

      <div className="flex flex-wrap gap-2 items-center">
        {allowWeight && (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="decimal"
              placeholder="重量(kg)"
              className="w-24 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              value={set.weight ?? ""}
              onChange={(e) =>
                onChange(idx, { weight: e.target.value === "" ? "" : +e.target.value })
              }
            />
            <span className="text-xs text-neutral-500">kg</span>
          </div>
        )}

        {type === "reps" ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              placeholder="回数"
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              value={set.reps ?? ""}
              onChange={(e) =>
                onChange(idx, { reps: e.target.value === "" ? "" : +e.target.value })
              }
            />
            <span className="text-xs text-neutral-500">回</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              placeholder="秒"
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm"
              value={set.timeSec ?? ""}
              onChange={(e) =>
                onChange(idx, { timeSec: e.target.value === "" ? "" : +e.target.value })
              }
            />
            <span className="text-xs text-neutral-500">秒</span>
          </div>
        )}
      </div>

      <div className="text-right">
        {set.done ? (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
            完了
          </span>
        ) : (
          <span className="text-xs text-neutral-500">未完了</span>
        )}
      </div>
    </div>
  );
}

/** ---------- メイン App ---------- */
export default function App() {
  const [date, setDate] = useState(todayStr());
  const [plan] = useState(DEFAULT_PLAN);
  const [log, setLog] = useState(() => loadDay(todayStr(), DEFAULT_PLAN));
  const restTimer = useCountdown();

  // 日付変更でロード
  useEffect(() => {
    setLog(loadDay(date, plan));
  }, [date, plan]);

  // 変更があれば保存
  useEffect(() => {
    saveDay(date, log);
  }, [date, log]);

  /** 進捗・ボリューム */
  const { totalSets, doneSets, totalVolume } = useMemo(() => {
    let total = 0;
    let done = 0;
    let volume = 0;
    plan.forEach((sec) =>
      sec.items.forEach((it) => {
        const ent = log.entries[it.id];
        if (!ent) return;
        ent.sets.forEach((s) => {
          total += 1;
          if (s.done) done += 1;
          if (it.type === "reps" && it.allowWeight && s.weight && s.reps) {
            volume += Number(s.weight) * Number(s.reps);
          }
        });
      })
    );
    return { totalSets: total, doneSets: done, totalVolume: volume };
  }, [plan, log]);

  /** ハンドラ群 */
  const updateEntry = (id, patch) => {
    setLog((prev) => {
      const next = clone(prev);
      next.entries[id] = { ...next.entries[id], ...patch };
      return next;
    });
  };

  const updateSetField = (id, setIndex, setPatch) => {
    setLog((prev) => {
      const next = clone(prev);
      const sets = next.entries[id].sets;
      sets[setIndex] = { ...sets[setIndex], ...setPatch };
      return next;
    });
  };

  const resetToday = () => {
    if (!confirm("本日のチェックと入力をリセットします。よろしいですか？")) return;
    setLog(makeEmptyLogFromPlan(plan));
  };

  const progressPct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      {/* ヘッダ */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ワークアウト</h1>
          <p className="text-sm text-neutral-600">淡い水色テーマ・全身（50〜60分）</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            onClick={resetToday}
            className="rounded-xl bg-brand-100 hover:bg-brand-200 px-3 py-2 text-sm text-brand-800"
          >
            本日リセット
          </button>
        </div>
      </header>

      {/* 進捗カード */}
      <SectionCard title="今日の進捗">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">
              セット完了：{doneSets}/{totalSets}
            </span>
            <span className="text-neutral-600">
              総ボリューム：<b>{totalVolume}</b> kg･rep
            </span>
          </div>
          <div className="w-full h-3 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 休憩タイマー */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-neutral-600">休憩タイマー</span>
          <button
            className="rounded-lg bg-brand-500 text-white px-3 py-1 text-sm hover:bg-brand-400"
            onClick={() => restTimer.start(30)}
          >
            ▶︎ 30秒
          </button>
          <button
            className="rounded-lg bg-brand-500 text-white px-3 py-1 text-sm hover:bg-brand-400"
            onClick={() => restTimer.start(60)}
          >
            ▶︎ 60秒
          </button>
          {restTimer.active ? (
            <span className="ml-2 text-sm font-semibold text-brand-700">
              残り {restTimer.sec}s
            </span>
          ) : (
            <span className="ml-2 text-sm text-neutral-500">停止中</span>
          )}
          {restTimer.active && (
            <button
              className="ml-auto rounded-lg bg-brand-100 px-3 py-1 text-sm hover:bg-brand-200"
              onClick={restTimer.stop}
            >
              停止
            </button>
          )}
        </div>
      </SectionCard>

      {/* 各セクション */}
      {plan.map((sec) => (
        <SectionCard key={sec.section} title={sec.section}>
          {sec.items.map((it) => {
            const entry = log.entries[it.id];
            if (!entry) return null;

            return (
              <div
                key={it.id}
                className="rounded-2xl border border-neutral-200 p-3 md:p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold">{it.name}</h3>
                      {/* 器具チップ */}
                      <div className="flex flex-wrap gap-1">
                        {it.equipment.map((eq) => (
                          <button
                            key={eq}
                            onClick={() => updateEntry(it.id, { chosenEquip: eq })}
                            className="focus:outline-none"
                            title={`器具: ${EQUIP_LABEL[eq] || eq}`}
                          >
                            <Chip active={entry.chosenEquip === eq}>
                              {EQUIP_LABEL[eq] || eq}
                            </Chip>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-neutral-600">
                      {it.type === "reps"
                        ? `目安：${it.reps}${it.perSide ? "（左右各）" : ""} × ${it.sets}セット`
                        : `目安：${it.timeSec}秒${it.perSide ? "（左右各）" : ""} × ${it.sets}セット`}
                    </p>
                  </div>
                </div>

                {it.note && <p className="mt-2 text-sm text-neutral-600">💡 {it.note}</p>}

                {/* 「やり方はこちら」リンク */}
                {it.link && (
                  <a
                    href={it.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-brand-600 hover:underline"
                  >
                    👉 やり方はこちら
                  </a>
                )}

                <div className="mt-3 space-y-2">
                  {entry.sets.map((_, idx) => (
                    <SetRow
                      key={idx}
                      idx={idx}
                      entry={entry}
                      type={it.type}
                      allowWeight={!!it.allowWeight && entry.chosenEquip !== "bodyweight"}
                      onChange={(setIndex, patch) => {
                        updateSetField(it.id, setIndex, patch);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </SectionCard>
      ))}

      <footer className="pb-10 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Workout
      </footer>
    </div>
  );
}
