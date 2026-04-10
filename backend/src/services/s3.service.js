const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;

function buildClient() {
  const hasStaticCredentials =
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  return new S3Client({
    region,
    credentials: hasStaticCredentials
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN || undefined,
        }
      : undefined,
  });
}

const s3Client = buildClient();

function ensureS3Config() {
  if (!region || !bucket) {
    const error = new Error("S3 is not configured. Set AWS_REGION and S3_BUCKET_NAME.");
    error.statusCode = 500;
    throw error;
  }
}

async function uploadFile(buffer, mimeType, folder = "documents", originalName = "file") {
  ensureS3Config();
  const extension = path.extname(originalName) || "";
  const key = `${folder}/${crypto.randomUUID()}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: "AES256",
    }),
  );

  return key;
}

async function generateSignedUrl(s3Key, expiresInSeconds = 3600) {
  ensureS3Config();
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: expiresInSeconds,
  });
}

module.exports = {
  uploadFile,
  generateSignedUrl,
};
