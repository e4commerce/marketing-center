"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive, ArrowLeft, Check, ChevronDown, ChevronRight, CircleAlert, Cloud, Download, FileImage, Folder,
  FolderInput, FolderPlus, Grid2X2, HardDrive, Image as ImageIcon, LayoutDashboard, List, LoaderCircle,
  Menu, MoreHorizontal, MoveRight, Play, Plus, RefreshCw, Search, Settings, ShieldCheck, SlidersHorizontal,
  Sparkles, Tag, Trash2, UploadCloud, Video, WandSparkles, X,
} from "lucide-react";
import type { BootstrapData, HubFolder, MediaAsset } from "@/lib/types";

type View = "home" | "library" | "folders" | "review" | "settings";
type Notice = { text: string; tone: "success" | "error" };

const NAV: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "home", label: "Início", icon: LayoutDashboard },
  { id: "library", label: "Biblioteca", icon: Grid2X2 },
  { id: "folders", label: "Pastas", icon: Folder },
  { id: "review", label: "Revisão", icon: CircleAlert },
  { id: "settings", label: "Configurações", icon: Settings },
];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/hub/${path}`, init);
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a ação.");
  return data;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function relativeDate(value: string) {
  const hours = Math.round((Date.now() - Date.parse(value)) / 3_600_000);
  if (hours < 1) return "agora";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.round(hours / 24);
  return `há ${days} dia${days === 1 ? "" : "s"}`;
}

function Status({ status }: { status: MediaAsset["status"] }) {
  const labels = { uploading: "Enviando", processing: "Analisando", ready: "Pronto", review: "Revisar", error: "Erro", archived: "Arquivado" };
  return <span className={`status status-${status}`}>{status === "processing" && <LoaderCircle size={12} className="spin" />}{labels[status]}</span>;
}

function MediaVisual({ asset }: { asset: MediaAsset }) {
  return <div className="media-visual">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={asset.previewUrl} alt={asset.descriptionShort || asset.name} />
    {asset.kind === "video" && <span className="play"><Play size={18} fill="currentColor" /></span>}
    {asset.duration && <span className="duration">0:{String(asset.duration).padStart(2, "0")}</span>}
    <div className="card-status"><Status status={asset.status} /></div>
  </div>;
}

function MediaCard({ asset, onOpen, list }: { asset: MediaAsset; onOpen: () => void; list?: boolean }) {
  return <button className={`media-card ${list ? "media-card-list" : ""}`} onClick={onOpen}>
    <MediaVisual asset={asset} />
    <div className="media-copy">
      <div className="media-name-row"><strong>{asset.name}</strong><MoreHorizontal size={17} /></div>
      <p>{asset.descriptionShort}</p>
      <div className="tag-row">{asset.tags.slice(0, list ? 5 : 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="media-meta"><span>{asset.kind === "video" ? "Vídeo" : asset.kind === "image" ? "Imagem" : "Documento"}</span><span>{formatBytes(asset.size)}</span><span>{relativeDate(asset.updatedAt)}</span></div>
    </div>
  </button>;
}

function Empty({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty"><div className="empty-icon"><ImageIcon size={25} /></div><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function MediaHub() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [view, setView] = useState<View>("home");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | MediaAsset["kind"]>("all");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [display, setDisplay] = useState<"grid" | "list">("grid");
  const [notice, setNotice] = useState<Notice | null>(null);

  const load = useCallback(async (quiet = false) => {
    try {
      const next = await api<BootstrapData>("bootstrap", { cache: "no-store" });
      setData(next); setAuthRequired(false);
    } catch (error) {
      if ((error as Error).message.includes("Autenticação")) setAuthRequired(true);
      else if (!quiet) setNotice({ text: (error as Error).message, tone: "error" });
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!data?.jobs.some((job) => job.status === "queued" || job.status === "running") && !data?.media.some((item) => item.status === "processing")) return;
    const timer = window.setInterval(() => void load(true), 2200);
    return () => window.clearInterval(timer);
  }, [data, load]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 4200); return () => window.clearTimeout(timer); }, [notice]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const stopWords = new Set(["a", "o", "as", "os", "de", "da", "do", "em", "na", "no", "com", "foto", "imagem", "material"]);
    const words = query.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter((word) => word && !stopWords.has(word));
    let items = data.media.filter((asset) => kind === "all" || asset.kind === kind);
    if (selectedFolder) items = items.filter((asset) => asset.folderId === selectedFolder || asset.folderPath.startsWith(data.folders.find((folder) => folder.id === selectedFolder)?.path + "/"));
    if (view === "review") items = items.filter((asset) => asset.status === "review" || asset.status === "error");
    if (words.length) items = items.filter((asset) => {
      const haystack = `${asset.name} ${asset.descriptionShort} ${asset.descriptionFull} ${asset.tags.join(" ")} ${asset.products.join(" ")} ${asset.contexts.join(" ")} ${asset.folderPath}`.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return words.every((word) => haystack.includes(word) || (word === "mao" && /pulso|mão/.test(haystack)) || (word === "agua" && /piscina|água/.test(haystack)));
    });
    return items.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [data, query, kind, selectedFolder, view]);

  const notify = (text: string, tone: Notice["tone"] = "success") => setNotice({ text, tone });
  if (authRequired) return <Login onDone={() => void load()} />;
  if (!data) return <div className="boot"><div className="brand-mark">M</div><LoaderCircle className="spin" /><span>Preparando seu acervo</span></div>;

  const reviewCount = data.media.filter((asset) => asset.status === "review" || asset.status === "error").length;
  const activeJobs = data.jobs.filter((job) => job.status === "queued" || job.status === "running");

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark">M</div><div><strong>Murano</strong><span>Media Hub</span></div></div>
      <button className="primary wide" onClick={() => { setUploadOpen(true); setMobileNav(false); }}><Plus size={18} /> Enviar arquivos</button>
      <nav>{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => { setView(id); setSelectedFolder(null); setMobileNav(false); }}><Icon size={18} /><span>{label}</span>{id === "review" && reviewCount > 0 && <em>{reviewCount}</em>}</button>)}</nav>
      <div className="sidebar-space" />
      <div className="storage-card"><div><HardDrive size={17} /><span>Drive Murano</span></div><strong>{data.connections.destination ? "Conectado" : "Modo local"}</strong><p>{data.connections.destination ? "Arquivos sincronizados" : "Conecte em Configurações"}</p></div>
      <div className="account"><div className="avatar">TM</div><div><strong>{data.user.name}</strong><span>Administrador</span></div><ChevronDown size={16} /></div>
    </aside>
    {mobileNav && <button aria-label="Fechar menu" className="scrim nav-scrim" onClick={() => setMobileNav(false)} />}

    <main>
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="global-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setView("library")} placeholder="Busque por cena, produto, ambiente..." />{query && <button onClick={() => setQuery("")}><X size={15} /></button>}<kbd>⌘ K</kbd></div>
        <button className="icon-button" onClick={() => void load()} aria-label="Atualizar"><RefreshCw size={18} /></button>
        <button className="top-upload" onClick={() => setUploadOpen(true)}><UploadCloud size={17} /><span>Enviar</span></button>
      </header>

      <div className="content">
        {view === "home" && <Home data={data} reviewCount={reviewCount} onSearch={(value) => { setQuery(value); setView("library"); }} onOpen={setSelected} onUpload={() => setUploadOpen(true)} onReview={() => setView("review")} />}
        {view === "library" && <Library title="Biblioteca" subtitle={`${data.media.length} materiais catalogados`} items={filtered} query={query} kind={kind} setKind={setKind} display={display} setDisplay={setDisplay} onOpen={setSelected} onUpload={() => setUploadOpen(true)} />}
        {view === "review" && <Library title="Revisão" subtitle={`${reviewCount} item${reviewCount === 1 ? "" : "s"} precisam de atenção`} items={filtered} query={query} kind={kind} setKind={setKind} display={display} setDisplay={setDisplay} onOpen={setSelected} onUpload={() => setUploadOpen(true)} review />}
        {view === "folders" && <Folders data={data} selectedFolder={selectedFolder} setSelectedFolder={setSelectedFolder} items={filtered} onOpen={setSelected} onCreate={() => setFolderOpen(true)} />}
        {view === "settings" && <SettingsView data={data} notify={notify} reload={load} />}
      </div>
      {activeJobs.length > 0 && <div className="job-toast"><LoaderCircle size={17} className="spin" /><div><strong>{activeJobs[0].message || "Processando materiais"}</strong><span>{activeJobs[0].progress}% concluído</span></div><div className="job-progress"><i style={{ width: `${activeJobs[0].progress}%` }} /></div></div>}
    </main>

    {selected && <Detail asset={data.media.find((item) => item.id === selected.id) || selected} folders={data.folders} onClose={() => setSelected(null)} onSaved={(media) => { setSelected(media); void load(true); notify("Material atualizado."); }} notify={notify} />}
    {uploadOpen && <UploadModal folders={data.folders} onClose={() => setUploadOpen(false)} onDone={() => { setUploadOpen(false); void load(); notify("Arquivos recebidos. A análise começou."); }} />}
    {folderOpen && <FolderModal folders={data.folders} selectedParent={selectedFolder} onClose={() => setFolderOpen(false)} onDone={() => { setFolderOpen(false); void load(); notify("Pasta criada."); }} />}
    {notice && <div className={`notice ${notice.tone}`}><span>{notice.tone === "success" ? <Check size={17} /> : <CircleAlert size={17} />}</span>{notice.text}</div>}
  </div>;
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) { event.preventDefault(); setBusy(true); setError(""); try { await api("session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) }); onDone(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <div className="login-page"><div className="login-card"><div className="brand-mark large">M</div><p className="eyebrow">MURANO JOIAS</p><h1>Seu acervo, finalmente encontrável.</h1><p>Entre para organizar, pesquisar e reutilizar todos os materiais de marketing.</p><form onSubmit={submit}><label>Senha de acesso</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus placeholder="Digite sua senha" />{error && <span className="form-error">{error}</span>}<button className="primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18} /> : <ArrowLeft className="login-arrow" size={18} />} Entrar</button></form></div><div className="login-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-card art-a"><Tag size={19} /><span>água</span><span>verão</span></div><div className="art-card art-b"><Sparkles size={19} /><strong>94%</strong><span>catalogado</span></div><div className="art-card art-c"><Search size={22} /><span>mão na água</span></div></div></div>;
}

function Home({ data, reviewCount, onSearch, onOpen, onUpload, onReview }: { data: BootstrapData; reviewCount: number; onSearch: (q: string) => void; onOpen: (asset: MediaAsset) => void; onUpload: () => void; onReview: () => void }) {
  const [localQuery, setLocalQuery] = useState("");
  const ready = data.media.filter((item) => item.status === "ready").length;
  const videos = data.media.filter((item) => item.kind === "video").length;
  return <>
    <section className="hero"><div><span className="eyebrow"><Sparkles size={14} /> BIBLIOTECA INTELIGENTE</span><h1>O material certo,<br /><em>sem perder tempo.</em></h1><p>Descreva o que você precisa. A Murano IA encontra no acervo.</p><form className="hero-search" onSubmit={(e) => { e.preventDefault(); onSearch(localQuery); }}><Search size={22} /><input value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} placeholder="Ex: foto de mão na água, colar em casa..." /><button>Buscar</button></form><div className="search-suggestions"><span>Tente:</span>{["mão na água", "verão", "produto dourado"].map((item) => <button key={item} onClick={() => onSearch(item)}>{item}</button>)}</div></div><div className="hero-collage"><div className="collage-main"><img src="/demo/water.svg" alt="Mão com anéis na água" /></div><div className="collage-small top"><img src="/demo/earring.svg" alt="Brinco" /></div><div className="collage-small bottom"><img src="/demo/necklace.svg" alt="Colar" /></div><div className="ai-badge"><WandSparkles size={16} /><span>Organizado pela IA</span></div></div></section>
    <section className="stats-grid">
      <div><span className="stat-icon lilac"><FileImage size={19} /></span><p>Materiais</p><strong>{data.media.length}</strong><small>no acervo</small></div>
      <div><span className="stat-icon mint"><ShieldCheck size={19} /></span><p>Catalogados</p><strong>{ready}</strong><small>{data.media.length ? Math.round(ready / data.media.length * 100) : 0}% do acervo</small></div>
      <button onClick={onReview}><span className="stat-icon peach"><CircleAlert size={19} /></span><p>Para revisar</p><strong>{reviewCount}</strong><small>ver pendências <MoveRight size={13} /></small></button>
      <div><span className="stat-icon blue"><Video size={19} /></span><p>Vídeos</p><strong>{videos}</strong><small>analisados</small></div>
    </section>
    <section className="section-block"><div className="section-title"><div><h2>Adicionados recentemente</h2><p>Os últimos materiais que entraram no acervo</p></div><button onClick={() => onSearch("")}>Ver biblioteca <ChevronRight size={16} /></button></div><div className="media-grid compact">{data.media.slice(0, 4).map((asset) => <MediaCard key={asset.id} asset={asset} onOpen={() => onOpen(asset)} />)}</div></section>
    <section className="quick-actions"><button onClick={onUpload}><span><UploadCloud size={21} /></span><div><strong>Enviar materiais</strong><p>Fotos, vídeos e documentos</p></div><ChevronRight size={18} /></button><button onClick={onReview}><span><WandSparkles size={21} /></span><div><strong>Revisar sugestões</strong><p>Confirme tags e destinos da IA</p></div><ChevronRight size={18} /></button></section>
  </>;
}

function Library({ title, subtitle, items, query, kind, setKind, display, setDisplay, onOpen, onUpload, review }: { title: string; subtitle: string; items: MediaAsset[]; query: string; kind: "all" | MediaAsset["kind"]; setKind: (kind: "all" | MediaAsset["kind"]) => void; display: "grid" | "list"; setDisplay: (display: "grid" | "list") => void; onOpen: (asset: MediaAsset) => void; onUpload: () => void; review?: boolean }) {
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">ACERVO MURANO</span><h1>{title}</h1><p>{subtitle}</p></div>{!review && <button className="primary" onClick={onUpload}><Plus size={18} /> Enviar arquivos</button>}</div><div className="toolbar"><div className="segmented">{[["all", "Todos"], ["image", "Fotos"], ["video", "Vídeos"], ["document", "Documentos"]].map(([id, label]) => <button key={id} className={kind === id ? "active" : ""} onClick={() => setKind(id as typeof kind)}>{label}</button>)}</div><div className="toolbar-right"><button><SlidersHorizontal size={16} /> Filtros</button><div className="view-toggle"><button className={display === "grid" ? "active" : ""} onClick={() => setDisplay("grid")}><Grid2X2 size={16} /></button><button className={display === "list" ? "active" : ""} onClick={() => setDisplay("list")}><List size={17} /></button></div></div></div>{query && <div className="results-copy">Resultados para <strong>“{query}”</strong><span>{items.length} encontrado{items.length === 1 ? "" : "s"}</span></div>}{items.length ? <div className={display === "grid" ? "media-grid" : "media-list"}>{items.map((asset) => <MediaCard key={asset.id} asset={asset} list={display === "list"} onOpen={() => onOpen(asset)} />)}</div> : <Empty title={review ? "Tudo organizado" : "Nenhum material encontrado"} text={review ? "Não há arquivos aguardando sua revisão." : "Tente outros termos ou remova alguns filtros."} />}</section>;
}

function Folders({ data, selectedFolder, setSelectedFolder, items, onOpen, onCreate }: { data: BootstrapData; selectedFolder: string | null; setSelectedFolder: (id: string | null) => void; items: MediaAsset[]; onOpen: (asset: MediaAsset) => void; onCreate: () => void }) {
  const root = data.folders.find((folder) => folder.id === "root");
  const current = data.folders.find((folder) => folder.id === selectedFolder) || root;
  const children = (parentId: string | null, depth = 0): React.ReactNode => data.folders.filter((folder) => folder.parentId === parentId).map((folder) => <div key={folder.id}><button className={selectedFolder === folder.id ? "active" : ""} style={{ paddingLeft: 13 + depth * 17 }} onClick={() => setSelectedFolder(folder.id)}><ChevronRight size={14} /><Folder size={17} fill="currentColor" /><span>{folder.name}</span><em>{data.media.filter((asset) => asset.folderId === folder.id).length}</em></button>{children(folder.id, depth + 1)}</div>);
  return <section className="page-section"><div className="page-heading"><div><span className="eyebrow">GOOGLE DRIVE</span><h1>Pastas</h1><p>A estrutura oficial do acervo, sem sair da plataforma.</p></div><button className="primary" onClick={onCreate}><FolderPlus size={18} /> Nova pasta</button></div><div className="folder-layout"><aside className="folder-tree"><div className="tree-head"><strong>Estrutura</strong><button onClick={onCreate}><Plus size={16} /></button></div><button className={!selectedFolder ? "active" : ""} onClick={() => setSelectedFolder(null)}><HardDrive size={17} /><span>{root?.name || "Murano Marketing"}</span><em>{data.media.length}</em></button>{children("root")}</aside><div className="folder-content"><div className="folder-breadcrumb"><HardDrive size={15} /><span>Murano Marketing</span>{current && current.id !== "root" && <><ChevronRight size={14} /><strong>{current.name}</strong></>}</div><div className="folder-summary"><div><span className="folder-large"><Folder size={24} fill="currentColor" /></span><div><h2>{current?.name || "Murano Marketing"}</h2><p>{items.length} materiais nesta visualização</p></div></div><button className="secondary" onClick={onCreate}><FolderPlus size={16} /> Criar pasta</button></div>{items.length ? <div className="media-grid folder-grid">{items.map((asset) => <MediaCard key={asset.id} asset={asset} onOpen={() => onOpen(asset)} />)}</div> : <Empty title="Pasta vazia" text="Envie materiais ou mova arquivos existentes para esta pasta." />}</div></div></section>;
}

function Detail({ asset, folders, onClose, onSaved, notify }: { asset: MediaAsset; folders: HubFolder[]; onClose: () => void; onSaved: (media: MediaAsset) => void; notify: (text: string, tone?: Notice["tone"]) => void }) {
  const [description, setDescription] = useState(asset.descriptionFull); const [tags, setTags] = useState(asset.tags.join(", ")); const [folderId, setFolderId] = useState(asset.folderId); const [busy, setBusy] = useState(false);
  async function save() { setBusy(true); try { const result = await api<{ media: MediaAsset }>(`media/${asset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ descriptionFull: description, tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean), folderId, status: "ready" }) }); onSaved(result.media); } catch (e) { notify((e as Error).message, "error"); } finally { setBusy(false); } }
  async function reanalyze() { try { await api(`media/${asset.id}/reanalyze`, { method: "POST" }); notify("Nova análise adicionada à fila."); onClose(); } catch (e) { notify((e as Error).message, "error"); } }
  async function archive() { if (!window.confirm("Enviar este material para a lixeira?")) return; try { await api(`media/${asset.id}`, { method: "DELETE" }); notify("Material arquivado."); onClose(); } catch (e) { notify((e as Error).message, "error"); } }
  return <><button className="scrim" aria-label="Fechar" onClick={onClose} /><aside className="detail-panel"><div className="detail-head"><div><span>Detalhes do material</span><Status status={asset.status} /></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div><div className="detail-preview"><MediaVisual asset={asset} /></div><div className="detail-body"><div className="detail-name"><div className="kind-icon">{asset.kind === "video" ? <Video size={18} /> : <ImageIcon size={18} />}</div><div><h2>{asset.name}</h2><p>{asset.width && asset.height ? `${asset.width} × ${asset.height} · ` : ""}{formatBytes(asset.size)}</p></div></div>{asset.statusNote && <div className="attention"><CircleAlert size={17} /><span>{asset.statusNote}</span></div>}<label>Descrição completa<textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} /></label><label>Tags<input value={tags} onChange={(e) => setTags(e.target.value)} /><small>Separe as tags por vírgula.</small></label><label>Pasta<select value={folderId} onChange={(e) => setFolderId(e.target.value)}>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select></label><div className="ai-analysis"><div><WandSparkles size={17} /><strong>Análise da IA</strong></div><dl><div><dt>Confiança</dt><dd>{Math.round(asset.confidence * 100)}%</dd></div><div><dt>Orientação</dt><dd>{asset.orientation}</dd></div><div><dt>Modelo</dt><dd>{asset.aiModel || "—"}</dd></div></dl><button onClick={reanalyze}><RefreshCw size={15} /> Analisar novamente</button></div><div className="detail-actions"><a className="secondary" href={`/api/file/${asset.id}`}><Download size={16} /> Baixar</a><button className="danger-ghost" onClick={archive}><Trash2 size={16} /> Arquivar</button><button className="primary" disabled={busy} onClick={save}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />} Salvar</button></div></div></aside></>;
}

async function extractVideoFrames(file: File) {
  if (!file.type.startsWith("video/")) return [] as File[];
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("O navegador não conseguiu gerar prévias deste vídeo."));
    });
    if (!Number.isFinite(video.duration) || video.duration <= 0) return [];
    const positions = [0.12, 0.5, 0.88].map((ratio) => Math.min(Math.max(video.duration * ratio, 0.08), Math.max(video.duration - 0.08, 0.08)));
    const frames: File[] = [];
    for (const [index, position] of positions.entries()) {
      await new Promise<void>((resolve, reject) => {
        video.onseeked = () => resolve();
        video.onerror = () => reject(new Error("Não foi possível ler um quadro do vídeo."));
        video.currentTime = position;
      });
      const scale = Math.min(1, 960 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
      canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
      canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
      if (blob) frames.push(new File([blob], `${file.name}-frame-${index + 1}.jpg`, { type: "image/jpeg" }));
    }
    return frames;
  } catch {
    return [];
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}

function UploadModal({ folders, onClose, onDone }: { folders: HubFolder[]; onClose: () => void; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]); const [folderId, setFolderId] = useState("inbox"); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const inputRef = useRef<HTMLInputElement>(null);
  async function submit() { if (!files.length) return; setBusy(true); setError(""); try { const form = new FormData(); files.forEach((file) => form.append("files", file)); form.append("folderId", folderId); for (const [index, file] of files.entries()) for (const frame of await extractVideoFrames(file)) form.append(`frames_${index}`, frame); await api("upload", { method: "POST", body: form }); onDone(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }
  return <><button className="scrim" onClick={onClose} /><div className="modal upload-modal"><div className="modal-head"><div><span className="modal-icon"><UploadCloud size={20} /></span><div><h2>Enviar materiais</h2><p>A IA organiza tudo depois do upload.</p></div></div><button className="icon-button" onClick={onClose}><X size={19} /></button></div><input ref={inputRef} className="hidden-input" type="file" multiple accept="image/*,video/*,.pdf" onChange={(e) => setFiles(Array.from(e.target.files || []))} /><button className={`dropzone ${files.length ? "has-files" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)); }}><span><UploadCloud size={27} /></span><strong>{files.length ? `${files.length} arquivo${files.length === 1 ? "" : "s"} selecionado${files.length === 1 ? "" : "s"}` : "Arraste fotos e vídeos aqui"}</strong><p>{files.length ? files.map((file) => file.name).slice(0, 3).join(" · ") : "ou clique para selecionar do dispositivo"}</p><small>JPG, PNG, WEBP, HEIC, MP4, MOV, WEBM ou PDF · até 200 MB</small></button><div className="upload-options"><label><span>Destino inicial</span><select value={folderId} onChange={(e) => setFolderId(e.target.value)}>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select></label><div className="auto-rule"><span><WandSparkles size={17} /></span><div><strong>Organização automática ativada</strong><p>Fotos são analisadas integralmente; vídeos geram três quadros visuais. Itens incertos vão para revisão.</p></div><span className="switch on"><i /></span></div></div>{error && <div className="form-error box">{error}</div>}<div className="modal-actions"><button className="secondary" onClick={onClose}>Cancelar</button><button className="primary" onClick={submit} disabled={!files.length || busy}>{busy ? <LoaderCircle size={17} className="spin" /> : <UploadCloud size={17} />} Enviar {files.length ? `(${files.length})` : ""}</button></div></div></>;
}

function FolderModal({ folders, selectedParent, onClose, onDone }: { folders: HubFolder[]; selectedParent: string | null; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(""); const [parentId, setParentId] = useState(selectedParent || "root"); const [error, setError] = useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); try { await api("folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, parentId }) }); onDone(); } catch (err) { setError((err as Error).message); } }
  return <><button className="scrim" onClick={onClose} /><form className="modal small-modal" onSubmit={submit}><div className="modal-head"><div><span className="modal-icon"><FolderPlus size={20} /></span><div><h2>Nova pasta</h2><p>Crie dentro da estrutura oficial.</p></div></div><button type="button" className="icon-button" onClick={onClose}><X size={19} /></button></div><label>Nome<input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Campanha Dia das Mães" /></label><label>Dentro de<select value={parentId} onChange={(e) => setParentId(e.target.value)}>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.path}</option>)}</select></label>{error && <span className="form-error">{error}</span>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancelar</button><button className="primary" disabled={!name.trim()}><FolderPlus size={17} /> Criar pasta</button></div></form></>;
}

function SettingsView({ data, notify, reload }: { data: BootstrapData; notify: (text: string, tone?: Notice["tone"]) => void; reload: (quiet?: boolean) => Promise<void> }) {
  const [values, setValues] = useState({ openrouterApiKey: "", googleClientId: "", googleClientSecret: "", destinationRootId: data.connections.destinationRootId || "" }); const [busy, setBusy] = useState("");
  async function save() { setBusy("save"); try { await api("settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); setValues((current) => ({ ...current, openrouterApiKey: "", googleClientSecret: "" })); await reload(); notify("Configurações protegidas e salvas."); } catch (e) { notify((e as Error).message, "error"); } finally { setBusy(""); } }
  async function provision() { setBusy("provision"); try { await api("drive/provision", { method: "POST" }); await reload(); notify("Estrutura criada no Drive novo."); } catch (e) { notify((e as Error).message, "error"); } finally { setBusy(""); } }
  async function startImport(id: string) { setBusy(id); try { await api(`imports/${id}`, { method: "POST" }); await reload(); notify("Importação iniciada. As origens permanecerão intactas."); } catch (e) { notify((e as Error).message, "error"); } finally { setBusy(""); } }
  return <section className="page-section settings-page"><div className="page-heading"><div><span className="eyebrow">ADMINISTRAÇÃO</span><h1>Configurações</h1><p>Integrações e regras do acervo.</p></div></div>{data.demoMode && <div className="demo-banner"><Sparkles size={18} /><div><strong>Modo demonstração ativo</strong><p>Você pode testar todo o fluxo localmente. Conecte as integrações abaixo para operar com arquivos reais.</p></div></div>}<div className="settings-grid"><section className="settings-card"><div className="settings-title"><span className="google-icon">G</span><div><h2>Google Drive</h2><p>Destino novo e fontes protegidas</p></div><StatusPill ok={data.connections.destination} /></div><div className="connection-row"><div><strong>Drive novo da Murano</strong><p>{data.connections.destinationRootId ? `Raiz: ${data.connections.destinationRootId}` : "Ainda sem pasta raiz"}</p></div><a className="secondary" href="/api/hub/drive/connect?role=destination">{data.connections.destination ? "Reconectar" : "Conectar"}</a></div><div className="connection-row"><div><strong>Pastas de origem</strong><p>Acesso exclusivo para leitura</p></div><a className="secondary" href="/api/hub/drive/connect?role=source">{data.connections.source ? "Reconectar" : "Conectar"}</a></div><label>ID de uma raiz já criada (opcional)<input name="murano_destination_root" autoComplete="off" value={values.destinationRootId} onChange={(e) => setValues({ ...values, destinationRootId: e.target.value })} placeholder="Cole o ID da pasta do Drive novo" /></label><button className="secondary wide" disabled={!data.connections.destination || busy === "provision"} onClick={provision}>{busy === "provision" ? <LoaderCircle className="spin" size={17} /> : <FolderInput size={17} />} Criar estrutura oficial no Drive</button></section><section className="settings-card"><div className="settings-title"><span className="openrouter-icon"><WandSparkles size={19} /></span><div><h2>OpenRouter</h2><p>Análise visual e catalogação</p></div><StatusPill ok={data.connections.openrouter} /></div><label>API key<input name="murano_openrouter_key" autoComplete="new-password" type="password" value={values.openrouterApiKey} onChange={(e) => setValues({ ...values, openrouterApiKey: e.target.value })} placeholder={data.connections.openrouter ? "Chave configurada ••••••••" : "sk-or-v1-..."} /></label><div className="model-row"><span>Modelo atual</span><strong>{data.connections.model}</strong></div><p className="security-note"><ShieldCheck size={15} /> A chave é cifrada e nunca enviada ao navegador depois de salva.</p></section></div><section className="settings-card full"><div className="settings-title"><span className="source-icon"><Archive size={19} /></span><div><h2>Carga inicial</h2><p>Copie materiais para o Drive novo sem alterar as origens.</p></div></div><div className="source-list">{data.sources.map((source) => <div key={source.id}><span><Folder size={19} fill="currentColor" /></span><div><strong>{source.name}</strong><p>{source.folderId}</p></div><span className="readonly"><ShieldCheck size={13} /> Somente leitura</span><button className="secondary" disabled={!data.connections.source || !data.connections.destination || busy === source.id} onClick={() => startImport(source.id)}>{busy === source.id ? <LoaderCircle className="spin" size={16} /> : <Cloud size={16} />} Importar cópias</button></div>)}</div></section><section className="settings-card full credentials"><div className="settings-title"><span className="credential-icon"><Settings size={19} /></span><div><h2>Credenciais Google OAuth</h2><p>Necessárias apenas para ativar as conexões acima.</p></div></div><div className="form-grid"><label>Client ID<input name="murano_google_client_id" autoComplete="off" value={values.googleClientId} onChange={(e) => setValues({ ...values, googleClientId: e.target.value })} placeholder="...apps.googleusercontent.com" /></label><label>Client Secret<input name="murano_google_client_secret" autoComplete="new-password" type="password" value={values.googleClientSecret} onChange={(e) => setValues({ ...values, googleClientSecret: e.target.value })} placeholder="••••••••" /></label></div><div className="settings-save"><p>Callback: <code>{typeof window !== "undefined" ? `${window.location.origin}/api/hub/drive/callback` : "/api/hub/drive/callback"}</code></p><button className="primary" onClick={save} disabled={busy === "save"}>{busy === "save" ? <LoaderCircle className="spin" size={17} /> : <ShieldCheck size={17} />} Salvar com segurança</button></div></section></section>;
}

function StatusPill({ ok }: { ok: boolean }) { return <span className={`connection-pill ${ok ? "ok" : ""}`}><i />{ok ? "Conectado" : "Pendente"}</span>; }
