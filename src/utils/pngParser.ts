// src/utils/pngParser.ts

export interface ComfyRawData {
  workflow?: any;
  prompt?: any;
  extraMetadata?: Record<string, string>;
}

/**
 * 纯前端解析 PNG 的 tEXt 与 iTXt 数据块
 */
export async function extractComfyMetadata(file: File): Promise<ComfyRawData> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);

  // 验证 PNG 头部签名: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  for (let i = 0; i < 8; i++) {
    if (view.getUint8(i) !== pngSignature[i]) {
      throw new Error("不是有效的 PNG 图像文件。");
    }
  }

  let offset = 8;
  const metadata: Record<string, string> = {};
  const decoder = new TextDecoder("utf-8");

  while (offset < buffer.byteLength) {
    if (offset + 8 > buffer.byteLength) break;
    const length = view.getUint32(offset);
    offset += 4;

    const chunkType = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    offset += 4;

    if (chunkType === "tEXt") {
      const chunkData = new Uint8Array(buffer, offset, length);
      let nullIndex = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }
      if (nullIndex !== -1) {
        const key = decoder.decode(chunkData.slice(0, nullIndex));
        const val = decoder.decode(chunkData.slice(nullIndex + 1));
        metadata[key] = val;
      }
    } else if (chunkType === "iTXt") {
      const chunkData = new Uint8Array(buffer, offset, length);
      let nullIndex = -1;
      for (let i = 0; i < chunkData.length; i++) {
        if (chunkData[i] === 0) {
          nullIndex = i;
          break;
        }
      }
      if (nullIndex !== -1) {
        const key = decoder.decode(chunkData.slice(0, nullIndex));
        let cursor = nullIndex + 3; // 跳过 null, flag, method
        while (cursor < chunkData.length && chunkData[cursor] !== 0) cursor++; // 跳过 language tag
        cursor++;
        while (cursor < chunkData.length && chunkData[cursor] !== 0) cursor++; // 跳过 translated keyword
        cursor++;
        if (cursor < chunkData.length) {
          const val = decoder.decode(chunkData.slice(cursor));
          metadata[key] = val;
        }
      }
    }

    offset += length + 4; // 跳过数据区与 4 字节 CRC
    if (chunkType === "IEND") break;
  }

  let workflow = null;
  let prompt = null;

  if (metadata["workflow"]) {
    try {
      workflow = JSON.parse(metadata["workflow"]);
    } catch {}
  }
  if (metadata["prompt"]) {
    try {
      prompt = JSON.parse(metadata["prompt"]);
    } catch {}
  }

  return { workflow, prompt, extraMetadata: metadata };
}