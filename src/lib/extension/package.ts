import "server-only";

import { readFile } from "fs/promises";
import path from "path";

const extensionFiles = [
  "manifest.json",
  "README.md",
  "src/background.js",
  "src/content.css",
  "src/content.js",
  "src/offscreen.html",
  "src/offscreen.js",
  "src/popup.css",
  "src/popup.html",
  "src/popup.js",
] as const;

type ZipEntry = {
  name: string;
  data: Buffer;
  crc: number;
  localHeaderOffset: number;
};

const crcTable = createCrcTable();

export const extensionPackageFileName = "radar-live-assist-extension.zip";

export async function buildExtensionPackage() {
  const extensionDir = path.join(process.cwd(), "apps", "extension");
  const entries: ZipEntry[] = [];

  for (const file of extensionFiles) {
    const data = await readFile(path.join(extensionDir, file));
    entries.push({
      name: file,
      data,
      crc: crc32(data),
      localHeaderOffset: 0,
    });
  }

  return createZip(entries);
}

function createZip(entries: ZipEntry[]) {
  const now = new Date();
  const { dosDate, dosTime } = toDosTimestamp(now);
  const localParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    entry.localHeaderOffset = offset;
    const fileName = Buffer.from(entry.name, "utf8");
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(dosTime, 10);
    header.writeUInt16LE(dosDate, 12);
    header.writeUInt32LE(entry.crc, 14);
    header.writeUInt32LE(entry.data.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(fileName.length, 26);
    header.writeUInt16LE(0, 28);

    localParts.push(header, fileName, entry.data);
    offset += header.length + fileName.length + entry.data.length;
  }

  const centralDirectoryOffset = offset;
  const centralParts: Buffer[] = [];

  for (const entry of entries) {
    const fileName = Buffer.from(entry.name, "utf8");
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(0, 10);
    header.writeUInt16LE(dosTime, 12);
    header.writeUInt16LE(dosDate, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.data.length, 20);
    header.writeUInt32LE(entry.data.length, 24);
    header.writeUInt16LE(fileName.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(entry.localHeaderOffset, 42);
    centralParts.push(header, fileName);
    offset += header.length + fileName.length;
  }

  const centralDirectorySize = offset - centralDirectoryOffset;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectorySize, 12);
  end.writeUInt32LE(centralDirectoryOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function createCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function toDosTimestamp(date: Date) {
  const year = Math.max(1980, date.getFullYear());

  return {
    dosTime:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),
    dosDate: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}
