import { NextResponse } from "next/server";

import {
  getSongAudioFromR2,
  isInvalidSongAudioRange,
  isMissingSongAudio,
  uploadSongAudioToR2,
} from "@/lib/r2-audio-storage";
import { isValidSongAudioSlotIndex, validateSongAudioFile } from "@/lib/song-audio";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ songId: string }>;
};

function parseSlotIndex(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return isValidSongAudioSlotIndex(parsed) ? parsed : null;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const slotIndex = parseSlotIndex(formData.get("slotIndex"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Selecione um arquivo MP3 para enviar." }, { status: 400 });
    }

    if (!slotIndex) {
      return NextResponse.json({ error: "Slot de audio invalido." }, { status: 400 });
    }

    const validationError = validateSongAudioFile(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { songId } = await context.params;
    const uploadedAudio = await uploadSongAudioToR2(songId, slotIndex, file);

    return NextResponse.json({
      slotIndex,
      label: typeof formData.get("label") === "string" ? formData.get("label") : `Audio ${slotIndex}`,
      ...uploadedAudio,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao enviar o audio para o R2.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { songId } = await context.params;
    const slotIndex = parseSlotIndex(new URL(request.url).searchParams.get("slot"));

    if (!slotIndex) {
      return NextResponse.json({ error: "Slot de audio invalido." }, { status: 400 });
    }

    const audio = await getSongAudioFromR2(songId, slotIndex, request.headers.get("range"));

    return new NextResponse(audio.body, {
      status: audio.status,
      headers: {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=60",
        "Content-Type": audio.contentType,
        ...(audio.contentLength ? { "Content-Length": audio.contentLength } : {}),
        ...(audio.contentRange ? { "Content-Range": audio.contentRange } : {}),
        ...(audio.etag ? { ETag: audio.etag } : {}),
        ...(audio.lastModified ? { "Last-Modified": audio.lastModified } : {}),
      },
    });
  } catch (error) {
    if (isMissingSongAudio(error)) {
      return NextResponse.json({ error: "Audio nao encontrado." }, { status: 404 });
    }

    if (isInvalidSongAudioRange(error)) {
      return NextResponse.json({ error: "Faixa de audio invalida." }, { status: 416 });
    }

    const message = error instanceof Error ? error.message : "Falha ao carregar o audio.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}