export function shouldIgnoreFile(
  filePath: string,
  patterns: string[],
): boolean {
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern).test(filePath);
    } catch {
      return false;
    }
  });
}
