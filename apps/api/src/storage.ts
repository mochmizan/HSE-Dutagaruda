import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | null = null;

export function bucketName(): string {
  return process.env.GARAGE_BUCKET ?? "hse-foto";
}

export function storage(): S3Client {
  if (client) return client;
  const endpoint = process.env.GARAGE_S3_ENDPOINT ?? "http://garage:3900";
  const region = process.env.GARAGE_S3_REGION ?? "garage";
  const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID ?? process.env.GARAGE_ACCESS_KEY ?? "";
  const secretAccessKey = process.env.GARAGE_SECRET_KEY ?? "";
  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export async function putBytes(key: string, bytes: Uint8Array, mime: string): Promise<void> {
  await storage().send(
    new PutObjectCommand({ Bucket: bucketName(), Key: key, Body: bytes, ContentType: mime }),
  );
}

// Signatures are computed against the internal Garage endpoint; presignedGet
// rewrites the host to the public storage base so Caddy can proxy it. Garage
// only validates Host + path + query, so this split is signature-safe.
export function publicStorageBase(): string {
  return process.env.PUBLIC_STORAGE_BASE ?? "";
}

export async function presignedGet(
  key: string,
  seconds = 60,
  audience: "public" | "internal" = "public",
): Promise<string> {
  const url = new URL(
    await getSignedUrl(storage(), new GetObjectCommand({ Bucket: bucketName(), Key: key }), {
      expiresIn: seconds,
    }),
  );
  const pub = publicStorageBase();
  if (audience === "public" && pub !== "") url.href = `${pub.replace(/\/$/, "")}${url.pathname}${url.search}`;
  return url.toString();
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await storage().send(new HeadObjectCommand({ Bucket: bucketName(), Key: key }));
    return true;
  } catch (err) {
    const name = (err as { name?: string }).name ?? "";
    if (name === "NotFound" || name === "NoSuchKey") return false;
    throw err;
  }
}

export async function getBytes(key: string): Promise<Uint8Array> {
  const res = await storage().send(new GetObjectCommand({ Bucket: bucketName(), Key: key }));
  return new Uint8Array(await res.Body!.transformToByteArray());
}

export async function deleteObject(key: string): Promise<void> {
  await storage().send(new DeleteObjectCommand({ Bucket: bucketName(), Key: key }));
}
