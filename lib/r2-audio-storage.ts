import "server-only";

import { GetObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";

import { buildSongAudioKey, buildSongAudioUrl } from "@/lib/song-audio";

type R2Config = {
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

type SongAudioObject = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: string | null;
  contentRange: string | null;
  etag: string | null;
  lastModified: string | null;
  status: number;
};

let cachedClient: S3Client | null = null;
let cachedConfigKey = "";

function getR2Config(): R2Config {
  const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";
  const bucketName = process.env.R2_BUCKET_NAME ?? "";
  const endpoint = process.env.R2_ENDPOINT ?? "";

  if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
    throw new Error(
      "R2 nao configurado. Defina R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME e R2_ENDPOINT.",
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  };
}

function getR2Client() {
  const config = getR2Config();
  const configKey = `${config.endpoint}|${config.bucketName}|${config.accessKeyId}`;

  if (!cachedClient || cachedConfigKey !== configKey) {
    cachedClient = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    cachedConfigKey = configKey;
  }

  return {
    client: cachedClient,
    config,
  };
}

function toWebStream(body: unknown) {
  const streamBody = body as { transformToWebStream?: () => ReadableStream<Uint8Array> } | null;

  if (!streamBody || typeof streamBody.transformToWebStream !== "function") {
    throw new Error("Nao foi possivel ler o audio armazenado no R2.");
  }

  return streamBody.transformToWebStream();
}

export async function uploadSongAudioToR2(songId: string, slotIndex: number, file: File) {
  const { client, config } = getR2Client();
  const audioKey = buildSongAudioKey(songId, slotIndex);
  const uploadedAt = new Date().toISOString();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: audioKey,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "audio/mpeg",
    }),
  );

  return {
    audioKey,
    audioUrl: buildSongAudioUrl(songId, slotIndex),
    audioFileName: file.name,
    audioContentType: file.type || "audio/mpeg",
    audioSizeBytes: file.size,
    audioStatus: "uploaded" as const,
    audioError: null,
    audioUploadedAt: uploadedAt,
  };
}

export async function getSongAudioFromR2(
  songId: string,
  slotIndex: number,
  rangeHeader: string | null,
): Promise<SongAudioObject> {
  const { client, config } = getR2Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: buildSongAudioKey(songId, slotIndex),
      Range: rangeHeader || undefined,
    }),
  );

  return {
    body: toWebStream(response.Body),
    contentType: response.ContentType || "audio/mpeg",
    contentLength: typeof response.ContentLength === "number" ? String(response.ContentLength) : null,
    contentRange: response.ContentRange ?? null,
    etag: response.ETag ?? null,
    lastModified: response.LastModified ? response.LastModified.toUTCString() : null,
    status: response.ContentRange ? 206 : 200,
  };
}

export function isMissingSongAudio(error: unknown) {
  return error instanceof S3ServiceException && (error.name === "NoSuchKey" || error.name === "NotFound");
}

export function isInvalidSongAudioRange(error: unknown) {
  return error instanceof S3ServiceException && error.name === "InvalidRange";
}