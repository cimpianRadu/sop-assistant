// Minimal line-level diff using LCS. Good enough for SOP text + titles.
// Returns a sequence of ops: "eq" for unchanged, "add" for inserted in b,
// "del" for removed from a. No moves, no intra-line highlighting.

export type DiffOp = { type: "eq" | "add" | "del"; line: string };

export function diffLines(a: string, b: string): DiffOp[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const n = aLines.length;
  const m = bLines.length;

  // LCS table
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0)
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      ops.push({ type: "eq", line: aLines[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ type: "del", line: aLines[i] });
      i++;
    } else {
      ops.push({ type: "add", line: bLines[j] });
      j++;
    }
  }
  while (i < n) ops.push({ type: "del", line: aLines[i++] });
  while (j < m) ops.push({ type: "add", line: bLines[j++] });
  return ops;
}

// Collapse long runs of unchanged lines into a single summary for readability.
// Keeps `context` lines around changes.
export function condenseDiff(ops: DiffOp[], context = 2): DiffOp[] {
  if (ops.length === 0) return ops;
  // Mark which indexes are "near" a change.
  const keep = new Array(ops.length).fill(false);
  ops.forEach((op, idx) => {
    if (op.type !== "eq") {
      for (
        let k = Math.max(0, idx - context);
        k <= Math.min(ops.length - 1, idx + context);
        k++
      ) {
        keep[k] = true;
      }
    }
  });

  const out: DiffOp[] = [];
  let skipped = 0;
  for (let idx = 0; idx < ops.length; idx++) {
    if (keep[idx]) {
      if (skipped > 0) {
        out.push({ type: "eq", line: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"}` });
        skipped = 0;
      }
      out.push(ops[idx]);
    } else {
      skipped++;
    }
  }
  if (skipped > 0) {
    out.push({ type: "eq", line: `… ${skipped} unchanged line${skipped === 1 ? "" : "s"}` });
  }
  return out;
}

// Step-list diff: compares two ordered step arrays by position, reporting
// added/removed/modified entries. Position-sensitive (a reordered list will
// read as lots of modifications, which is probably the honest answer).
export type StepDiff =
  | { type: "added"; step_number: number; step_text: string }
  | { type: "removed"; step_number: number; step_text: string }
  | {
      type: "modified";
      step_number: number;
      before: string;
      after: string;
    };

export function diffSteps(
  before: Array<{ step_number: number; step_text: string }>,
  after: Array<{ step_number: number; step_text: string }>
): StepDiff[] {
  const out: StepDiff[] = [];
  const maxLen = Math.max(before.length, after.length);
  for (let i = 0; i < maxLen; i++) {
    const b = before[i];
    const a = after[i];
    if (b && a) {
      if (b.step_text !== a.step_text) {
        out.push({
          type: "modified",
          step_number: a.step_number,
          before: b.step_text,
          after: a.step_text,
        });
      }
    } else if (a) {
      out.push({
        type: "added",
        step_number: a.step_number,
        step_text: a.step_text,
      });
    } else if (b) {
      out.push({
        type: "removed",
        step_number: b.step_number,
        step_text: b.step_text,
      });
    }
  }
  return out;
}
