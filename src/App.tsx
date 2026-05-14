import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isVideoFile,
  supabase,
  VIDEOS_BUCKET,
} from "./lib/supabase";

type VideoItem = {
  name: string;
  createdAt: string | null;
  url: string;
};

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function resolvePlayableUrl(path: string): Promise<string> {
  const { data: signed, error } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(path, 60 * 60 * 12);

  if (!error && signed?.signedUrl) return signed.signedUrl;

  const { data: pub } = supabase.storage
    .from(VIDEOS_BUCKET)
    .getPublicUrl(path);
  return pub.publicUrl;
}

type ListedFile = { fullPath: string; created_at: string | null };

async function listPrefixRecursive(prefix: string): Promise<ListedFile[]> {
  const pageSize = 1000;
  const collected: ListedFile[] = [];
  let offset = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .list(prefix, {
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      if (!row.name) continue;
      const fullPath = prefix ? `${prefix}/${row.name}` : row.name;
      if (isVideoFile(row.name)) {
        collected.push({
          fullPath,
          created_at: row.created_at ?? row.updated_at ?? null,
        });
        continue;
      }
      if (row.id == null) {
        const nested = await listPrefixRecursive(fullPath);
        collected.push(...nested);
      }
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return collected;
}

async function listAllVideos(): Promise<VideoItem[]> {
  const all = await listPrefixRecursive("");

  all.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });

  const withUrls = await Promise.all(
    all.map(async (f) => ({
      name: f.fullPath,
      createdAt: f.created_at,
      url: await resolvePlayableUrl(f.fullPath),
    }))
  );

  return withUrls;
}

function App() {
  const [items, setItems] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const list = await listAllVideos();
      setItems(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = useMemo(() => {
    if (loading) return "同步信号中…";
    if (err) return "链路异常";
    return `${items.length} 路信号在线`;
  }, [loading, err, items.length]);

  return (
    <div className="min-h-screen bg-grid-fade">
      <header className="border-b border-arena-edge/80 bg-arena-panel/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-arena-neon/90">
              Supabase Storage · LIVE FEED
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              视频监控
              <span className="ml-3 inline-block h-2 w-2 animate-pulse rounded-full bg-arena-lime shadow-lime" />
            </h1>
            <p className="mt-2 max-w-xl font-mono text-sm text-slate-400">
              Bucket{" "}
              <span className="text-arena-neon">{VIDEOS_BUCKET}</span>
              <span className="mx-2 text-slate-600">|</span>
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="group relative overflow-hidden rounded border border-arena-neon/50 bg-arena-panel px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-arena-neon shadow-neon transition hover:border-arena-neon hover:bg-arena-neon/10 disabled:opacity-50"
            >
              <span className="relative z-10">刷新画面</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-arena-neon/20 to-transparent transition group-hover:translate-x-full" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {err && (
          <div className="mb-8 rounded-lg border border-arena-alert/40 bg-arena-alert/10 px-4 py-3 font-mono text-sm text-arena-alert">
            {err}
          </div>
        )}

        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-arena-edge/50 bg-arena-panel/40 p-3"
              >
                <div className="aspect-video rounded-lg bg-slate-800/80" />
                <div className="mt-4 h-4 w-2/3 rounded bg-slate-800" />
                <div className="mt-2 h-3 w-1/2 rounded bg-slate-800/80" />
              </div>
            ))}
          </div>
        )}

        {!loading && !err && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-arena-edge bg-arena-panel/30 px-6 py-16 text-center">
            <p className="font-display text-lg text-slate-300">暂无视频文件</p>
            <p className="mt-2 font-mono text-sm text-slate-500">
              请确认 Bucket「{VIDEOS_BUCKET}」中已上传常见格式（mp4 / webm / mov 等）。
            </p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((v) => (
              <article
                key={v.name}
                className="group relative overflow-hidden rounded-xl border border-arena-edge/80 bg-arena-panel/70 shadow-[0_0_0_1px_rgba(0,240,255,0.06)] transition hover:border-arena-neon/40 hover:shadow-neon"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-arena-neon/10 blur-2xl transition group-hover:bg-arena-neon/20" />
                <div className="relative p-3">
                  <div className="relative overflow-hidden rounded-lg border border-slate-800/80 bg-black">
                    <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-arena-lime ring-1 ring-arena-lime/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-arena-lime shadow-lime" />
                      LIVE
                    </div>
                    <video
                      className="aspect-video w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                      src={v.url}
                    />
                  </div>
                  <div className="mt-4 space-y-1 px-1">
                    <h2 className="truncate font-display text-sm font-semibold uppercase tracking-wide text-white">
                      {v.name}
                    </h2>
                    <p className="font-mono text-xs text-slate-500">
                      上传时间{" "}
                      <span className="text-arena-neon/90">
                        {formatTime(v.createdAt)}
                      </span>
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-arena-edge/60 py-8 text-center font-mono text-[11px] text-slate-600">
        COMPETITION DEMO · DARK OPS UI
      </footer>
    </div>
  );
}

export default App;
