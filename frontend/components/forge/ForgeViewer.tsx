"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL, authHeaders } from "@/utils/api";

declare global {
  interface Window {
    Autodesk?: {
      Viewing: {
        Initializer: (options: object, callback: () => void) => void;
        Document: {
          load: (
            urn: string,
            onSuccess: (doc: unknown) => void,
            onError: (code: number, message: string) => void
          ) => void;
        };
        GuiViewer3D: new (container: HTMLElement) => {
          start: () => number;
          finish: () => void;
          loadDocumentNode: (doc: unknown, node: unknown) => Promise<void>;
        };
      };
    };
  }
}

type ForgeViewerProps = {
  urn: string;
  height?: number;
};

let viewerScriptsPromise: Promise<void> | null = null;

function loadViewerScripts(): Promise<void> {
  if (viewerScriptsPromise) return viewerScriptsPromise;

  viewerScriptsPromise = new Promise((resolve, reject) => {
    if (window.Autodesk?.Viewing) {
      resolve();
      return;
    }

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://developer.api.autodesk.com/modelderivative/v2/viewers/style.min.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://developer.api.autodesk.com/modelderivative/v2/viewers/viewer3D.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Autodesk Viewer SDK"));
    document.body.appendChild(script);
  });

  return viewerScriptsPromise;
}

export default function ForgeViewer({ urn, height = 420 }: ForgeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<{ finish: () => void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadViewerScripts();
        if (cancelled || !containerRef.current || !window.Autodesk) return;

        const tokenRes = await fetch(`${API_URL}/forge/token`, {
          headers: await authHeaders(),
        });
        if (!tokenRes.ok) {
          throw new Error("Could not get Forge viewer token");
        }
        const { access_token, expires_in } = await tokenRes.json();

        await new Promise<void>((resolve, reject) => {
          window.Autodesk!.Viewing.Initializer(
            {
              env: "AutodeskProduction2",
              api: "streamingV2",
              getAccessToken: (callback: (token: string, expires: number) => void) => {
                callback(access_token, expires_in);
              },
            },
            () => {
              try {
                if (!containerRef.current) return;
                viewerRef.current?.finish();
                const viewer = new window.Autodesk!.Viewing.GuiViewer3D(containerRef.current);
                viewerRef.current = viewer;
                const started = viewer.start();
                if (started !== 0) {
                  reject(new Error("Viewer failed to start"));
                  return;
                }

                window.Autodesk!.Viewing.Document.load(
                  `urn:${urn}`,
                  (doc: { getRoot: () => { getDefaultGeometry: () => unknown } }) => {
                    const defaultModel = doc.getRoot().getDefaultGeometry();
                    viewer.loadDocumentNode(doc, defaultModel).then(() => resolve()).catch(reject);
                  },
                  (code: number, message: string) => reject(new Error(`${code}: ${message}`))
                );
              } catch (err) {
                reject(err);
              }
            }
          );
        });

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Viewer failed to load");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      viewerRef.current?.finish();
      viewerRef.current = null;
    };
  }, [urn]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-stone-700 bg-stone-900">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm z-10">
          Loading 3D viewer...
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-red-400 text-sm z-10 px-4 text-center">
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ height }} className="w-full" />
    </div>
  );
}
