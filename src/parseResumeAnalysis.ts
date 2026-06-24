// The main ATS backend stores resume_text as `str(analysis)` — a Python
// dict repr (single-quoted keys/strings, None/True/False) rather than
// valid JSON. This converts that string into real JSON safely, and never
// throws: callers get `null` on anything it can't confidently parse,
// since this is a "nice to have" detail view, not something that should
// ever break the page if the format drifts.

export interface ParsedSkill {
  name: string;
  category?: string;
}

export interface ParsedPosition {
  title?: string;
  company?: string;
  duration?: string;
}

export interface ParsedEducation {
  level?: string;
  institution?: string;
  field?: string;
  year?: string;
}

export interface ParsedJobMatch {
  title?: string;
  matchPercentage?: number;
  recommendations?: string[];
}

export interface ParsedResumeAnalysis {
  overallScore?: number;
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  skills?: ParsedSkill[];
  experience?: {
    totalYears?: number;
    totalMonths?: number;
    positions?: ParsedPosition[];
  };
  education?: ParsedEducation[];
  jobMatch?: ParsedJobMatch;
  analysisDate?: string;
  language?: string;
  textLength?: number;
}

function pythonLiteralToJson(input: string): string {
  let s = input;
  // Python literals -> JSON literals (word-boundary guarded so this never
  // touches a substring inside an actual name/word).
  s = s.replace(/\bNone\b/g, "null");
  s = s.replace(/\bTrue\b/g, "true");
  s = s.replace(/\bFalse\b/g, "false");

  // Python's str()/repr() mixes quote styles within the same structure —
  // it uses double quotes for any string containing an apostrophe, and
  // single quotes otherwise. Match BOTH styles in one pass and normalize
  // everything to double-quoted JSON strings.
  s = s.replace(
    /"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'/g,
    (_match, dq: string | undefined, sq: string | undefined) => {
      const inner = dq !== undefined ? dq : (sq as string);
      const normalized = inner
        .replace(/\\'/g, "'") // \' isn't meaningful in JSON — unescape it
        .replace(/(?<!\\)"/g, '\\"'); // escape any literal " not already escaped
      return `"${normalized}"`;
    }
  );

  return s;
}

export function parseResumeAnalysis(resumeText: string | null | undefined): ParsedResumeAnalysis | null {
  if (!resumeText) return null;

  // Already valid JSON? Try that first (in case the backend format changes
  // later to store real JSON instead of a Python repr).
  try {
    return JSON.parse(resumeText) as ParsedResumeAnalysis;
  } catch {
    // fall through to Python-literal conversion
  }

  try {
    const converted = pythonLiteralToJson(resumeText);
    return JSON.parse(converted) as ParsedResumeAnalysis;
  } catch {
    return null;
  }
}
