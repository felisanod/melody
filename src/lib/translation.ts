import type { SongItem } from "./music-types";

export type TranslationMode = "original" | "translated" | "romanized" | "transcribed";

export interface TranslationResult {
  original: string;
  translated: string;
  mode: TranslationMode;
  source: string;
}

export interface TranslationOptions {
  targetLanguage: string;
  provider: "openrouter" | "deepl";
  model?: string | undefined;
  mode: TranslationMode;
  customPrompt?: string | undefined;
  formality?: "default" | "formal" | "informal" | undefined;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEEPL_URL = "https://api-free.deepl.com/v2/translate";

async function translateWithOpenRouter(
  text: string,
  targetLanguage: string,
  model: string,
  mode: TranslationMode,
): Promise<string> {
  const systemPrompt =
    mode === "romanized"
      ? "Romanize the following text (convert native script to Latin alphabet). Return only the romanized text."
      : mode === "transcribed"
        ? "Transcribe the following text (convert spoken language to written text). Return only the transcribed text."
        : `Translate the following text to ${targetLanguage}. Return only the translated text.`;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env["VITE_OPENROUTER_API_KEY"] ?? ""}`,
    },
    body: JSON.stringify({
      model: model ?? "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? "";
}

async function translateWithDeepL(
  text: string,
  targetLanguage: string,
  formality: TranslationOptions["formality"],
): Promise<string> {
  const params = new URLSearchParams({
    text,
    target_lang: targetLanguage.toUpperCase(),
  });
  if (formality) params.set("formality", formality);

  const res = await fetch(`${DEEPL_URL}?${params}`, {
    headers: {
      Authorization: `DeepL-Auth-Key ${import.meta.env["VITE_DEEPL_API_KEY"] ?? ""}`,
    },
  });
  if (!res.ok) throw new Error(`DeepL error: ${res.status}`);
  const data = (await res.json()) as { translations: Array<{ text: string }> };
  return data.translations[0]?.text ?? "";
}

export async function translateLyrics(
  lyrics: string,
  options: TranslationOptions,
): Promise<TranslationResult> {
  const formality = (options.formality ?? "default") as TranslationOptions["formality"];
  const translated =
    options.provider === "deepl"
      ? await translateWithDeepL(lyrics, options.targetLanguage, formality)
      : await translateWithOpenRouter(lyrics, options.targetLanguage, options.model ?? "", options.mode);

  return {
    original: lyrics,
    translated,
    mode: options.mode,
    source: options.provider,
  };
}

export async function translateLyricsLines(
  lines: string[],
  options: TranslationOptions,
): Promise<string[]> {
  return Promise.all(lines.map((line) => translateLyrics(line, options).then((r) => r.translated)));
}
