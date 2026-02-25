export interface PasswordRule {
  key: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { key: "minLength", test: (pw) => pw.length >= 8 },
  { key: "uppercase", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lowercase", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", test: (pw) => /\d/.test(pw) },
];

export type PasswordStrength = "empty" | "weak" | "fair" | "strong";

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return "empty";
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return "weak";
  if (passed <= 3) return "fair";
  return "strong";
}

export function allRulesPass(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}
