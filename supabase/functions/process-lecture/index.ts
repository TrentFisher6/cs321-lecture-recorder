// Turns an uploaded lecture into a transcript (Deepgram) and notes (Claude)
import Anthropic from "@anthropic-ai/sdk";
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic();

const notesSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    keyPoints: { type: "array", items: { type: "string" } },
    terms: {
      type: "array",
      items: {
        type: "object",
        properties: { term: { type: "string" }, meaning: { type: "string" } },
        required: ["term", "meaning"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "keyPoints", "terms"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization")! } },
  });
  const { lectureId } = await req.json();

  const setLecture = (fields: Record<string, unknown>) =>
    supabase.from("lectures").update(fields).eq("id", lectureId);

  try {
    const { data: lecture, error } = await supabase
      .from("lectures").select("audio_path").eq("id", lectureId).single();
    if (error) throw error;
    if (!lecture.audio_path) throw new Error("Lecture has no audio");
    await setLecture({ status: "processing" });

    // 1. Transcribe. Deepgram downloads the audio itself
    // Taken from https://www.npmjs.com/package/@deepgram/sdk -Trent
    const { data: signed } = await supabase.storage.from("lectures").createSignedUrl(lecture.audio_path, 600);
    const dg = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true&diarize=true&utterances=true",
      {
        method: "POST",
        headers: { Authorization: `Token ${Deno.env.get("DEEPGRAM_API_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: signed!.signedUrl }),
      },
    );
    if (!dg.ok) throw new Error(`Deepgram ${dg.status}: ${await dg.text()}`);
    const utterances: { speaker: number; start: number; transcript: string }[] = (await dg.json()).results.utterances;
    const transcript = utterances.map((u) => ({ speaker: u.speaker, start: u.start, text: u.transcript }));

    // 2. Process using claude, export as json schema
    // Taken from https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript -Trent
    const message = await anthropic.messages.stream({
      model: "claude-sonnet-5",
      max_tokens: 64000,
      output_config: { format: { type: "json_schema", schema: notesSchema } },
      system:
        "You write study notes for college students with intellectual disabilities. " +
        "Use short, plain sentences. Include any deadlines, quizzes, or homework the teacher mentions.",
      messages: [{ role: "user", content: transcript.map((t) => t.text).join("\n") }],
    }).finalMessage();
    if (message.stop_reason === "refusal") throw new Error("Claude declined to write notes");
    const text = message.content.find((b) => b.type === "text");
    const notes = JSON.parse(text!.text);

    // 3. Save.
    await setLecture({ transcript, notes, status: "ready" });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    await setLecture({ status: "error" });
    return Response.json({ error: String(e) }, { status: 500 });
  }
});
