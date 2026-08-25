import type { ZodType } from "zod";
export interface StructuredLlmRequest<T> { name: string; prompt: string; schema: ZodType<T>; jsonSchema: Record<string, unknown> }
export interface LlmProvider { readonly model: string; generateStructured<T>(request: StructuredLlmRequest<T>): Promise<T> }
export class OpenAiProvider implements LlmProvider {
  readonly model = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";
  async generateStructured<T>(request: StructuredLlmRequest<T>): Promise<T> {
    const key = process.env.OPENAI_API_KEY; if (!key) throw new Error("OPENAI_API_KEY is not configured");
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model: this.model, input: request.prompt, text: { format: { type: "json_schema", name: request.name, strict: true, schema: request.jsonSchema } } }) });
      if (!response.ok) { if (attempt === 1) throw new Error(`LLM request failed: ${response.status}`); continue; }
      const body = await response.json() as { output_text?: string };
      const parsed = request.schema.safeParse(JSON.parse(body.output_text ?? "null"));
      if (parsed.success) return parsed.data;
      if (attempt === 1) throw new Error("LLM structured output validation failed");
    }
    throw new Error("LLM request failed");
  }
}
