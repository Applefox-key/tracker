export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .replace(/[,:.;!?"()\[\]{}«»—–]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

type DiffPart = { char: string; type: "correct" | "extra" | "missing" };

function buildDiff(a: string, b: string): DiffPart[] {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const parts: DiffPart[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      parts.unshift({ char: a[i - 1], type: "correct" });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      parts.unshift({ char: b[j - 1], type: "missing" });
      j--;
    } else {
      parts.unshift({ char: a[i - 1], type: "extra" });
      i--;
    }
  }
  return parts;
}

export function AnswerDiff({ input, correct }: { input: string; correct: string }) {
  const parts = buildDiff(normalizeAnswer(input), normalizeAnswer(correct));

  return (
    <span className="font-semibold tracking-wide">
      {parts.map((p, idx) => {
        if (p.type === "correct")
          return <span key={idx} className="text-green-600 dark:text-green-400">{p.char}</span>;
        if (p.type === "extra")
          return <span key={idx} className="text-red-500 dark:text-red-400 line-through opacity-60">{p.char}</span>;
        return (
          <span key={idx} className="text-red-600 dark:text-red-400 underline decoration-red-500 underline-offset-2">
            {p.char}
          </span>
        );
      })}
    </span>
  );
}
