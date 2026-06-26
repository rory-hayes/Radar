export type EvalCase = {
  name: string;
  run: () => void | Promise<void>;
};

export function assertEval(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runEvalSuite(cases: readonly EvalCase[]): Promise<void> {
  const failures: string[] = [];

  for (const testCase of cases) {
    try {
      await testCase.run();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      failures.push(`${testCase.name}: ${detail}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("\n"));
  }
}
