/**
 * S3-Compatible Storage Adapter
 *
 * Stores files in S3 or S3-compatible storage (MinIO, R2, etc.).
 * Uses fetch-based S3 API calls with AWS Signature V4 to avoid
 * the heavy AWS SDK dependency.
 */

import type {
  StoragePort,
  StorageObject,
  StorageObjectMetadata,
  PutObjectOptions,
} from "@/lib/ports/StoragePort";

type S3StorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicUrlPrefix?: string;
  forcePathStyle?: boolean;
};

async function hmacSha256(
  key: ArrayBuffer | Uint8Array,
  message: string,
): Promise<ArrayBuffer> {
  let keyBuffer: ArrayBuffer;
  if (key instanceof Uint8Array) {
    keyBuffer = new Uint8Array(key).buffer;
  } else {
    keyBuffer = key;
  }
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const encoder = new TextEncoder();
  return await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

class S3StorageAdapter implements StoragePort {
  private config: S3StorageConfig;

  constructor(config: S3StorageConfig) {
    this.config = config;
  }

  private getEndpoint(): string {
    if (this.config.endpoint) {
      return this.config.endpoint;
    }
    return `https://s3.${this.config.region}.amazonaws.com`;
  }

  private getUrl(key: string): string {
    const endpoint = this.getEndpoint();
    if (this.config.forcePathStyle) {
      return `${endpoint}/${this.config.bucket}/${key}`;
    }
    return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
  }

  private async signRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    payloadHash: string,
  ): Promise<Record<string, string>> {
    const parsedUrl = new URL(url);
    const datetime = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const date = datetime.slice(0, 8);

    const host = parsedUrl.host;
    const urlPath = parsedUrl.pathname;
    const service = "s3";
    const region = this.config.region;

    const signedHeadersList = ["host", "x-amz-content-sha256", "x-amz-date"];
    const canonicalHeaders = [
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${datetime}`,
    ].join("\n");
    const signedHeaders = signedHeadersList.join(";");

    const canonicalRequest = [
      method,
      urlPath,
      "",
      `${canonicalHeaders  }\n`,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const canonicalRequestHash = await sha256(canonicalRequest);

    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      datetime,
      credentialScope,
      canonicalRequestHash,
    ].join("\n");

    const encoder = new TextEncoder();
    const kDate = await hmacSha256(
      encoder.encode(`AWS4${  this.config.secretAccessKey}`),
      date,
    );
    const kRegion = await hmacSha256(kDate, region);
    const kService = await hmacSha256(kRegion, service);
    const kSigning = await hmacSha256(kService, "aws4_request");

    const signature = arrayBufferToHex(
      await hmacSha256(kSigning, stringToSign),
    );

    const authorization = [
      `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(", ");

    return {
      ...headers,
      host,
      "x-amz-date": datetime,
      "x-amz-content-sha256": payloadHash,
      authorization,
    };
  }

  async put(
    key: string,
    data: Buffer,
    options?: PutObjectOptions,
  ): Promise<string> {
    const url = this.getUrl(key);
    const payloadHash = await sha256(data.toString("binary"));

    const headers: Record<string, string> = {
      "content-type": options?.contentType ?? "application/octet-stream",
    };

    if (options?.cacheControl) {
      headers["cache-control"] = options.cacheControl;
    }

    const signedHeaders = await this.signRequest("PUT", url, headers, payloadHash);

    const response = await fetch(url, {
      method: "PUT",
      headers: signedHeaders,
      body: new Uint8Array(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`S3 PUT failed: ${response.status} ${errorText}`);
    }

    return key;
  }

  async get(key: string): Promise<StorageObject | null> {
    const url = this.getUrl(key);
    const payloadHash = await sha256("");

    const signedHeaders = await this.signRequest("GET", url, {}, payloadHash);

    const response = await fetch(url, {
      method: "GET",
      headers: signedHeaders,
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`S3 GET failed: ${response.status} ${errorText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const mime =
      response.headers.get("content-type") ?? "application/octet-stream";

    return { buffer, mime, size: buffer.length };
  }

  async delete(key: string): Promise<boolean> {
    const url = this.getUrl(key);
    const payloadHash = await sha256("");

    const signedHeaders = await this.signRequest(
      "DELETE",
      url,
      {},
      payloadHash,
    );

    const response = await fetch(url, {
      method: "DELETE",
      headers: signedHeaders,
    });

    return response.ok || response.status === 404;
  }

  async exists(key: string): Promise<boolean> {
    const url = this.getUrl(key);
    const payloadHash = await sha256("");

    const signedHeaders = await this.signRequest("HEAD", url, {}, payloadHash);

    const response = await fetch(url, {
      method: "HEAD",
      headers: signedHeaders,
    });

    return response.ok;
  }

  async getMetadata(key: string): Promise<StorageObjectMetadata | null> {
    const url = this.getUrl(key);
    const payloadHash = await sha256("");

    const signedHeaders = await this.signRequest("HEAD", url, {}, payloadHash);

    const response = await fetch(url, {
      method: "HEAD",
      headers: signedHeaders,
    });

    if (response.status === 404 || !response.ok) {
      return null;
    }

    const size = parseInt(
      response.headers.get("content-length") ?? "0",
      10,
    );
    const mime =
      response.headers.get("content-type") ?? "application/octet-stream";
    const lastModified = response.headers.get("last-modified");

    return {
      key,
      mime,
      size,
      createdAt: lastModified ? new Date(lastModified) : new Date(),
    };
  }

  getPublicUrl(key: string): string {
    if (this.config.publicUrlPrefix) {
      return `${this.config.publicUrlPrefix}/${key}`;
    }
    return this.getUrl(key);
  }

  async list(_prefix: string): Promise<StorageObjectMetadata[]> {
    console.warn("S3StorageAdapter.list() not fully implemented");
    return [];
  }
}

// ─── Factory ─────────────────────────────────────────────────

let _s3Storage: S3StorageAdapter | null = null;

export function getS3Storage(): S3StorageAdapter {
  if (!_s3Storage) {
    const config: S3StorageConfig = {
      bucket: process.env.S3_BUCKET ?? "",
      region: process.env.S3_REGION ?? "us-east-1",
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      endpoint: process.env.S3_ENDPOINT,
      publicUrlPrefix: process.env.S3_PUBLIC_URL_PREFIX,
    };

    if (!config.bucket || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error(
        "S3 storage requires S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY",
      );
    }

    _s3Storage = new S3StorageAdapter(config);
  }
  return _s3Storage;
}
