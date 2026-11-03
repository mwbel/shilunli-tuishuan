"use client";

import { useEffect, useMemo, useState } from "react";
import CelestialSphere, { type SphereMarker, type SpherePoint } from "@/components/celestial-sphere/CelestialSphere";
import { appText } from "@/i18n/copy";
import { useLocale } from "@/i18n/LocaleProvider";
import { BODIES, CITIES, beijingNow, type BodyId, type SkyData, type SkyFrame } from "@/features/sky-view/model";
import { DEFAULT_VISIBLE_BODY_IDS, getVisibleBodies } from "@/features/sky-view/model";

const control = "rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 hover:border-cyan-300/50 disabled:opacity-40";
const point = (frame: SkyFrame, body: BodyId): SpherePoint => ({ longitude: frame.bodies[body].azimuth, latitude: frame.bodies[body].altitude });

export default function SevenStarsSpherePage() {
  const locale = useLocale();
  const t = (value: string) => appText(locale, value);
  const [city, setCity] = useState("lhasa");
  const [date, setDate] = useState(() => beijingNow().slice(0, 10));
  const [hour] = useState(20);
  const [index, setIndex] = useState(120);
  const [selected, setSelected] = useState<BodyId>("moon");
  const [visibleBodyIds, setVisibleBodyIds] = useState<Set<BodyId>>(() => new Set(DEFAULT_VISIBLE_BODY_IDS));
  const [data, setData] = useState<SkyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  useEffect(() => { const controller = new AbortController(); setLoading(true); fetch(`/api/astronomy/sky-view?city=${city}&mode=daily&date=${date}&hour=${hour}`, { signal: controller.signal }).then(async response => { const payload = await response.json(); if (!response.ok || !payload.success) throw new Error(payload.error?.message || "星历数据加载失败"); return payload.data as SkyData; }).then(result => { if (!controller.signal.aborted) { setData(result); setIndex(Math.min(120, result.frames.length - 1)); setError(""); } }).catch(reason => { if (!controller.signal.aborted) { setData(null); setError(reason instanceof Error ? reason.message : "星空加载失败"); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [city, date, hour]);
  useEffect(() => { if (!playing || !data) return; const timer = window.setInterval(() => setIndex(value => (value + 1) % data.frames.length), 180); return () => window.clearInterval(timer); }, [playing, data]);
  const frame = data?.frames[Math.min(index, Math.max(0, (data?.frames.length ?? 1) - 1))];
  const visibleBodies = useMemo(() => getVisibleBodies(visibleBodyIds), [visibleBodyIds]);
  const selectedBody = visibleBodyIds.has(selected) ? BODIES.find(body => body.id === selected) ?? null : null;
  const markers = useMemo<SphereMarker[]>(() => frame ? visibleBodies.map(body => ({ id: body.id, name: body.name, ...point(frame, body.id), color: body.color, kind: body.id === "sun" ? "sun" as const : body.id === "moon" ? "moon" as const : undefined })) : [], [frame, visibleBodies]);
  const trails = useMemo(() => data ? visibleBodies.map(body => ({ id: body.id, color: body.color, points: data.frames.map(item => point(item, body.id)), faint: body.id !== selected })) : [], [data, selected, visibleBodies]);
  const toggleBody = (bodyId: BodyId, checked: boolean) => {
    const next = new Set(visibleBodyIds);
    if (checked) next.add(bodyId);
    else next.delete(bodyId);
    setVisibleBodyIds(next);
    if (checked && !visibleBodyIds.has(selected)) setSelected(bodyId);
    if (!checked && selected === bodyId && next.size) setSelected(getVisibleBodies(next)[0].id);
  };
  return <main className="mx-auto max-h-[calc(100vh-170px)] w-full max-w-7xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/90 p-4 pb-20 text-slate-100 shadow-2xl sm:p-6">
    <header className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[.24em] text-cyan-300">{t("当地天球 · 七曜轨迹")}</p><h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{t("当地天球")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t("依据观测地点、日期和时刻，查看七曜在当地天球中的位置与当日轨迹。")}</p></div><div className="flex flex-wrap gap-2">{CITIES.map(item => <button key={item.id} type="button" className={`${control} ${city === item.id ? "border-cyan-300/70 text-cyan-100" : ""}`} onClick={() => setCity(item.id)}>{t(item.name)}</button>)}</div></header>
    <section className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><label className="text-xs text-slate-300">{t("日期")}<input type="date" value={date} onChange={event => setDate(event.target.value)} className="ml-2 rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white" /></label><div className="flex items-center gap-2"><button type="button" className={control} disabled={!data || index === 0} onClick={() => setIndex(value => Math.max(0, value - 1))}>{t("前一时刻")}</button><button type="button" className={control} disabled={!data} onClick={() => setPlaying(value => !value)}>{t(playing ? "暂停" : "播放")}</button><button type="button" className={control} disabled={!data} onClick={() => setIndex(value => data ? Math.min(data.frames.length - 1, value + 1) : value)}>{t("后一时刻")}</button></div></div><input type="range" min="0" max={Math.max(0, (data?.frames.length ?? 1) - 1)} value={index} disabled={!data} aria-label={t("每日时刻滑块")} onChange={event => { setIndex(Number(event.target.value)); setPlaying(false); }} className="mt-4 w-full accent-cyan-300" /><div className="mt-1 flex justify-between text-xs text-slate-400"><span>{data?.city.name ? t(data.city.name) : "—"}</span><span>{frame?.localTime ?? (loading ? t("查询中…") : t(error))}</span></div></section>
    <fieldset className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4"><legend className="px-2 text-xs tracking-[.16em] text-cyan-200">{t("显示天体及轨迹")}</legend><div className="flex flex-wrap gap-x-5 gap-y-3">{BODIES.map(body => <label key={body.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={visibleBodyIds.has(body.id)} onChange={event => toggleBody(body.id, event.target.checked)} className="accent-cyan-300" /><span style={{ color: body.color }}>{t(body.name)}</span></label>)}</div></fieldset>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(260px,.7fr)]"><CelestialSphere title={t("当地天球")} subtitle={t("球面总览")} note={t("当地天球位置采用地平坐标；勾选天体后显示其当前位置与当日轨迹。")} markers={markers} selected={selectedBody?.id ?? ""} onSelect={id => setSelected(id as BodyId)} trails={trails} starFrame={frame ? { matrix: frame.matrix, date: frame.localTime.slice(0, 10) } : undefined} t={t} /><aside className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-xs tracking-[.2em] text-cyan-300">{t("当前天体")}</p><h2 className="mt-2 text-xl font-semibold">{selectedBody ? t(selectedBody.name) : t("未选择天体")}</h2><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-400">{t("高度角")}</dt><dd>{frame && selectedBody ? `${frame.bodies[selectedBody.id].altitude.toFixed(1)}°` : "—"}</dd></div><div className="flex justify-between"><dt className="text-slate-400">{t("方位角")}</dt><dd>{frame && selectedBody ? `${frame.bodies[selectedBody.id].azimuth.toFixed(1)}°` : "—"}</dd></div><div className="flex justify-between"><dt className="text-slate-400">{t("观测地点")}</dt><dd>{data?.city.name ? t(data.city.name) : "—"}</dd></div></dl></aside></div>
  </main>;
}
