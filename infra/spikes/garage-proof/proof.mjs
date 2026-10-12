import { createHash } from "node:crypto";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.GARAGE_S3_ENDPOINT || "http://garage:3900";
const region = process.env.GARAGE_S3_REGION || "garage";
const accessKeyId = process.env.GARAGE_ACCESS_KEY_ID || process.env.GARAGE_ACCESS_KEY;
const secretAccessKey = process.env.GARAGE_SECRET_KEY;
const bucket = process.env.GARAGE_BUCKET || "hse-foto";
if (!accessKeyId || !secretAccessKey) {
  console.error("missing GARAGE_ACCESS_KEY_ID and GARAGE_SECRET_KEY in env");
  process.exit(1);
}

const KEY = "spike/garage-proof.txt";
const BODY = "viaannn garage-proof round-trip fixture";
const want = createHash("sha256").update(BODY).digest("hex");

const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
});

await s3.send(new PutObjectCommand({ Bucket: bucket, Key: KEY, Body: BODY, ContentType: "text/plain" }));
console.log(`put ok bucket=${bucket} key=${KEY} bytes=${Buffer.byteLength(BODY)} sha256=${want}`);

const got = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: KEY }));
const viaSdk = Buffer.from(await got.Body.transformToByteArray()).toString("utf8");
const gotHash = createHash("sha256").update(viaSdk).digest("hex");
console.log(`get ok bytes=${Buffer.byteLength(viaSdk)} sha256=${gotHash} match=${gotHash === want}`);

const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: KEY }), { expiresIn: 60 });
const u = new URL(url);
console.log(`presigned ok host=${u.host} signed=${u.searchParams.has("X-Amz-Signature")} expires=${u.searchParams.get("X-Amz-Expires")}s`);

const res = await fetch(url);
const viaUrl = await res.text();
const urlHash = createHash("sha256").update(viaUrl).digest("hex");
console.log(`fetch ok http=${res.status} bytes=${Buffer.byteLength(viaUrl)} sha256=${urlHash} match=${urlHash === want}`);

if (gotHash !== want || urlHash !== want || !res.ok) process.exit(1);
console.log("round-trip proven");
