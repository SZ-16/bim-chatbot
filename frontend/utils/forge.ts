import { API_URL, authHeaders } from "@/utils/api";

export const FORGE_EXTENSIONS = new Set([
  ".rvt", ".ifc", ".dwg", ".nwd", ".nwc", ".dxf",
  ".fbx", ".obj", ".3ds", ".step", ".stp", ".iges", ".igs",
]);

export function isForgeFile(filename: string): boolean {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return false;
  return FORGE_EXTENSIONS.has(filename.slice(dot).toLowerCase());
}

export type ForgeModelStatus = "pending" | "inprogress" | "success" | "failed";

export type ForgeModel = {
  urn: string;
  fileName: string;
  status: ForgeModelStatus;
  progress?: string;
};

export async function uploadForgeModel(file: File): Promise<ForgeModel> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/forge/models/upload`, {
    method: "POST",
    headers: await authHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = typeof err.detail === "string" ? err.detail : `Upload failed (${res.status})`;
    throw new Error(detail);
  }

  const data = await res.json();
  return {
    urn: data.urn,
    fileName: data.file_name,
    status: data.status,
    progress: data.progress,
  };
}
