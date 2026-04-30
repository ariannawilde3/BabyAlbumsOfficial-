import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Image as ImageIcon, Type, Plus, ShoppingCart, Save,
  Upload, Trash2, ChevronUp, ChevronDown, Eye, X, Loader2,
  RotateCw, ArrowUp, ArrowDown, Smile,
} from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const LAYOUTS = [
  { key: 'free', label: 'Free', hint: 'Place anywhere' },
  { key: 'single', label: 'Single' },
  { key: 'double', label: 'Double' },
  { key: 'collage', label: 'Collage' },
];

const STICKERS = [
  '❤️','💕','💖','💗','💛','💙','💚','💜',
  '⭐','🌟','✨','💫','🌈','☁️','☀️','🌙',
  '👶','🍼','🧸','🎀','👼','🐣','🍭','🎂',
  '🎈','🎉','🎁','🎊','🪅','🎵','🎶','📷',
  '🌸','🌺','🌼','🌷','🌻','🌹','🦋','🌿',
  '🐻','🐰','🐱','🐶','🦊','🐼','🦄','🐝',
];
const SIZES = [
  { key: 'small', label: 'Small (8×8")' },
  { key: 'medium', label: 'Medium (11×11")' },
  { key: 'large', label: 'Large (13×11")' },
];
const TYPES = [
  { key: 'physical', label: 'Physical' },
  { key: 'digital', label: 'Digital' },
];
// TEST MODE: all prices zeroed for checkout testing — restore real values for production
const PRICES = {
  physical: { small: 0, medium: 0, large: 0 },
  digital: { small: 0, medium: 0, large: 0 },
};

function newImageItem(url, zIndex = 0) {
  return {
    url,
    x: 15 + Math.random() * 10,
    y: 15 + Math.random() * 10,
    width: 40,
    height: 40,
    rotation: 0,
    zIndex,
  };
}

function newCaptionItem(font, color, zIndex = 0) {
  return {
    text: 'Add caption',
    x: 25, y: 75, width: 50,
    rotation: 0, zIndex,
    fontSize: 20,
    fontFamily: font,
    color,
    align: 'center',
  };
}

export default function DesignPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isGuest } = useAuth();
  const isAi = location.pathname === '/ai-create';
  const templateId = searchParams.get('templateId');
  const existingProjectId = searchParams.get('projectId');
  const fileRef = useRef(null);

  const [projectId, setProjectId] = useState(null);
  const [title, setTitle] = useState('My Photobook');
  const [bookSize, setBookSize] = useState('medium');
  const [bookType, setBookType] = useState(searchParams.get('type') || 'physical');
  const [tab, setTab] = useState('layout');
  const [pages, setPages] = useState([
    { layout: templateId ? 'single' : 'free', images: [], captions: [], backgroundColor: '#ffffff' },
  ]);
  const [pageIdx, setPageIdx] = useState(0);
  const [template, setTemplate] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [selected, setSelected] = useState(null); // { type: 'image'|'caption', index }

  const page = pages[pageIdx];
  const base = PRICES[bookType]?.[bookSize] || 0;
  const extra = bookType === 'physical' ? Math.max(0, pages.length - 1) * 2.50 : 0;
  const total = (base + extra).toFixed(2);

  // Load existing project or template
  useEffect(() => {
    async function init() {
      if (existingProjectId) {
        try {
          const proj = await api.get(`/projects/${existingProjectId}`);
          setProjectId(proj._id);
          setTitle(proj.title);
          setBookSize(proj.bookSize);
          setBookType(proj.bookType);
          setPages(proj.pages.length ? proj.pages : [{ layout: 'free', images: [], captions: [], backgroundColor: '#ffffff' }]);
          if (proj.templateId) {
            try {
              const t = await api.get(`/templates/${proj.templateId}`);
              setTemplate(t);
            } catch { /* no template */ }
          }
        } catch { /* failed */ }
      } else if (templateId) {
        try {
          const t = await api.get(`/templates/${templateId}`);
          setTemplate(t);
          setTitle(t.name);
          setPages(t.pages.map(pg => {
            const slotCount = pg.layout === 'collage' ? 4 : pg.layout === 'double' ? 2 : 1;
            const rotations = pg.rotations?.length ? pg.rotations : new Array(slotCount).fill(0);
            return {
              layout: pg.layout,
              images: rotations.slice(0, slotCount).map((r, i) => ({
                url: '', position: i, rotation: r,
                x: 0, y: 0, width: 0, height: 0, zIndex: 0,
              })),
              captions: [],
              backgroundColor: t.theme?.colorPalette?.[0] || '#ffffff',
            };
          }));
        } catch { /* failed */ }
      }
      setInitialized(true);
    }
    init();
  }, [templateId, existingProjectId]);

  // Create project in backend once initialized (only if not loading existing)
  useEffect(() => {
    if (!initialized || projectId) return;
    async function createProject() {
      try {
        const proj = await api.post('/projects', {
          title, bookSize, bookType,
          templateId: templateId || undefined,
          pages,
        });
        setProjectId(proj._id);
      } catch { /* offline */ }
    }
    createProject();
  }, [initialized]);

  // Auto-save
  const saveTimeout = useRef(null);
  const autoSave = useCallback(() => {
    if (!projectId) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      try {
        await api.put(`/projects/${projectId}`, { title, bookSize, bookType, pages });
        setLastSaved(new Date());
      } catch { /* silent */ }
      finally { setSaving(false); }
    }, 2000);
  }, [projectId, title, bookSize, bookType, pages]);

  useEffect(() => {
    if (projectId) autoSave();
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [pages, title, bookSize, bookType, autoSave]);

  function addPage() {
    const bg = template?.theme?.colorPalette?.[0] || '#ffffff';
    const layout = templateId ? 'single' : 'free';
    setPages([...pages, { layout, images: [], captions: [], backgroundColor: bg }]);
    setPageIdx(pages.length);
    setSelected(null);
  }

  function removePage(idx) {
    if (pages.length <= 1) return;
    const next = pages.filter((_, i) => i !== idx);
    setPages(next);
    setPageIdx(Math.min(pageIdx, next.length - 1));
    setSelected(null);
  }

  function movePage(idx, dir) {
    const to = idx + dir;
    if (to < 0 || to >= pages.length) return;
    const next = [...pages];
    [next[idx], next[to]] = [next[to], next[idx]];
    setPages(next);
    setPageIdx(to);
  }

  function setLayout(l) {
    setPages(p => p.map((pg, i) => i === pageIdx ? { ...pg, layout: l } : pg));
    setSelected(null);
  }

  function updateCurrentPage(updater) {
    setPages(p => p.map((pg, i) => i === pageIdx ? updater(pg) : pg));
  }

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const results = await api.upload(files);
      const newImages = results.map((r, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: r.url,
        filename: r.filename,
      }));
      setUploadedImages(prev => [...prev, ...newImages]);
    } catch {
      const localImages = files.map((f, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: URL.createObjectURL(f),
        filename: f.name,
      }));
      setUploadedImages(prev => [...prev, ...localImages]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function addImageToPage(img) {
    updateCurrentPage(pg => {
      const maxZ = Math.max(0, ...pg.images.map(i => i.zIndex || 0), ...pg.captions.map(c => c.zIndex || 0));
      if (pg.layout === 'free') {
        return { ...pg, images: [...pg.images, newImageItem(img.url, maxZ + 1)] };
      }
      // Grid: fill first empty (url-less) placeholder, preserving its rotation
      const emptyIdx = pg.images.findIndex(i => !i.url);
      if (emptyIdx >= 0) {
        return {
          ...pg,
          images: pg.images.map((it, i) => i === emptyIdx ? { ...it, url: img.url } : it),
        };
      }
      return { ...pg, images: [...pg.images, { url: img.url, position: pg.images.length }] };
    });
    setSelected({ type: 'image', index: page.images.length });
  }

  function addSticker(emoji) {
    const font = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    updateCurrentPage(pg => {
      const maxZ = Math.max(0, ...pg.images.map(i => i.zIndex || 0), ...pg.captions.map(c => c.zIndex || 0));
      return {
        ...pg,
        captions: [...pg.captions, {
          text: emoji,
          x: 30 + Math.random() * 20,
          y: 30 + Math.random() * 20,
          width: 20,
          rotation: 0,
          zIndex: maxZ + 1,
          fontSize: 64,
          fontFamily: font,
          color: '#000000',
          align: 'center',
        }],
      };
    });
    setSelected({ type: 'caption', index: page.captions.length });
  }

  function rmImg(pos) {
    updateCurrentPage(pg => ({ ...pg, images: pg.images.filter((_, idx) => idx !== pos) }));
    setSelected(null);
  }

  function addCaption() {
    const font = template?.theme?.fontFamily || '"Playfair Display", Georgia, serif';
    const color = template?.theme?.colorPalette?.[3] || '#333333';
    updateCurrentPage(pg => {
      const maxZ = Math.max(0, ...pg.images.map(i => i.zIndex || 0), ...pg.captions.map(c => c.zIndex || 0));
      return { ...pg, captions: [...pg.captions, newCaptionItem(font, color, maxZ + 1)] };
    });
    setSelected({ type: 'caption', index: page.captions.length });
    setTab('text');
  }

  function updateCaption(capIdx, field, value) {
    updateCurrentPage(pg => ({
      ...pg,
      captions: pg.captions.map((c, ci) => ci === capIdx ? { ...c, [field]: value } : c),
    }));
  }

  function removeCaption(capIdx) {
    updateCurrentPage(pg => ({ ...pg, captions: pg.captions.filter((_, ci) => ci !== capIdx) }));
    setSelected(null);
  }

  function updateItem(type, idx, patch) {
    updateCurrentPage(pg => {
      const key = type === 'image' ? 'images' : 'captions';
      return { ...pg, [key]: pg[key].map((it, i) => i === idx ? { ...it, ...patch } : it) };
    });
  }

  function changeZ(type, idx, dir) {
    updateCurrentPage(pg => {
      const allItems = [
        ...pg.images.map((it, i) => ({ kind: 'image', idx: i, z: it.zIndex || 0 })),
        ...pg.captions.map((it, i) => ({ kind: 'caption', idx: i, z: it.zIndex || 0 })),
      ];
      const sorted = [...allItems].sort((a, b) => a.z - b.z);
      const target = type === 'image' ? 'image' : 'caption';
      const cur = sorted.findIndex(s => s.kind === target && s.idx === idx);
      const swap = dir === 'up' ? cur + 1 : cur - 1;
      if (swap < 0 || swap >= sorted.length) return pg;
      const a = sorted[cur], b = sorted[swap];
      const za = a.z, zb = b.z;
      const apply = (items, kind, currentIdx, newZ) =>
        items.map((it, i) => (kind === target && i === currentIdx) ? { ...it, zIndex: newZ } : it);
      let images = pg.images.map((it, i) => {
        if (a.kind === 'image' && i === a.idx) return { ...it, zIndex: zb };
        if (b.kind === 'image' && i === b.idx) return { ...it, zIndex: za };
        return it;
      });
      let captions = pg.captions.map((it, i) => {
        if (a.kind === 'caption' && i === a.idx) return { ...it, zIndex: zb };
        if (b.kind === 'caption' && i === b.idx) return { ...it, zIndex: za };
        return it;
      });
      return { ...pg, images, captions };
    });
  }

  async function handleSave() {
    if (!projectId) return;
    setSaving(true);
    try {
      await api.put(`/projects/${projectId}`, { title, bookSize, bookType, pages });
      setLastSaved(new Date());
    } catch {
      alert('Failed to save project');
    } finally { setSaving(false); }
  }

  async function handleAddToCart() {
    try {
      await api.post('/cart', {
        projectId, itemType: 'project',
        price: parseFloat(total),
      });
      navigate('/cart');
    } catch {
      alert('Failed to add to cart');
    }
  }

  const themeColors = template?.theme?.colorPalette || [];
  const themeFont = template?.theme?.fontFamily || '"Playfair Display", Georgia, serif';
  const isFree = page?.layout === 'free';

  return (
    <div style={{ backgroundColor: '#f6f7f4' }}>
      {isAi && (
        <div className="border-b px-4 py-3" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <p className="max-w-7xl mx-auto text-sm" style={{ color: '#92400e' }}>
            <strong>AI Mode:</strong> Upload your photos and our AI will automatically arrange them.
          </p>
        </div>
      )}

      {template && (
        <div className="border-b px-4 py-2" style={{ backgroundColor: themeColors[0] || '#fff' }}>
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <span className="font-medium" style={{ fontFamily: themeFont, color: themeColors[3] || '#333' }}>
              Template: {template.name}
            </span>
            {themeColors.map((c, i) => (
              <div key={i} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6">

          {/* Left Sidebar */}
          <aside className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Project Settings</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b5bda2]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Size</label>
                <select value={bookSize} onChange={e => setBookSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#b5bda2]">
                  {SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Type</label>
                <select value={bookType} onChange={e => setBookType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#b5bda2]">
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Pages Navigator */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Pages</h2>
              <div className="space-y-1.5 mb-4 max-h-[300px] overflow-y-auto">
                {pages.map((pg, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <button onClick={() => { setPageIdx(i); setSelected(null); }}
                      className="flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={i === pageIdx
                        ? { backgroundColor: '#dce4f5', color: '#545c43', fontWeight: 500 }
                        : { color: '#4b5563' }
                      }>
                      <span className="font-medium">Page {i + 1}</span>
                      <span className="text-xs text-gray-400 ml-1">({pg.layout})</span>
                      <span className="text-xs text-gray-400 ml-1">{pg.images.filter(i => i.url).length} img</span>
                    </button>
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => movePage(i, -1)} disabled={i === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => movePage(i, 1)} disabled={i === pages.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    {pages.length > 1 && (
                      <button onClick={() => removePage(i)} className="p-1 text-gray-400 hover:text-red-500">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addPage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl"
                style={{ backgroundColor: '#808a65' }}>
                <Plus size={16} /> Add Page
              </button>
            </div>
          </aside>

          {/* Center Canvas */}
          <main className="space-y-4">
            {/* Toolbar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-1">
              {[
                { k: 'layout', I: LayoutGrid, l: 'Layout' },
                { k: 'images', I: ImageIcon, l: 'Images' },
                { k: 'text', I: Type, l: 'Text' },
                { k: 'stickers', I: Smile, l: 'Stickers' },
              ].map(({ k, I, l }) => (
                <button key={k} onClick={() => setTab(k)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={tab === k
                    ? { backgroundColor: '#e8ebe2', color: '#545c43' }
                    : { color: '#6b7280' }
                  }>
                  <I size={16} /> {l}
                </button>
              ))}
            </div>

            {/* Layout Selector */}
            {tab === 'layout' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className={`grid gap-2 ${template ? 'grid-cols-3' : 'grid-cols-4'}`}>
                  {LAYOUTS.filter(l => template ? l.key !== 'free' : true).map(l => (
                    <button key={l.key} onClick={() => setLayout(l.key)}
                      className="px-3 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={page?.layout === l.key
                        ? { backgroundColor: '#808a65', color: 'white' }
                        : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                      }>
                      {l.label}
                      {l.hint && <div className="text-[10px] opacity-70 mt-0.5">{l.hint}</div>}
                    </button>
                  ))}
                </div>
                {themeColors.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-500 mb-2">Page Background</label>
                    <div className="flex gap-2">
                      {themeColors.map((c, i) => (
                        <button key={i} onClick={() => updateCurrentPage(pg => ({ ...pg, backgroundColor: c }))}
                          className="w-8 h-8 rounded-lg border-2 transition-all"
                          style={{ backgroundColor: c, borderColor: page?.backgroundColor === c ? '#808a65' : '#e5e7eb' }} />
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-500 mb-2">Custom Background</label>
                  <input type="color" value={page?.backgroundColor || '#ffffff'}
                    onChange={e => updateCurrentPage(pg => ({ ...pg, backgroundColor: e.target.value }))}
                    className="w-12 h-8 rounded border border-gray-200 cursor-pointer" />
                </div>
              </div>
            )}

            {/* Images Tab */}
            {tab === 'images' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                  disabled={uploading}>
                  {uploading
                    ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                    : <><Upload size={16} /> Click or drag to upload images</>
                  }
                </button>

                {uploadedImages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Your Images ({uploadedImages.length})</h4>
                    <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
                      {uploadedImages.map(img => (
                        <button key={img.id} onClick={() => addImageToPage(img)}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#808a65] transition-colors">
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Click to add to page{isFree ? ' — drag to position' : ''}</p>
                  </div>
                )}
              </div>
            )}

            {/* Stickers Tab */}
            {tab === 'stickers' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs text-gray-500 mb-3">Click a sticker to add — then drag, resize, and rotate.</p>
                <div className="grid grid-cols-8 gap-1.5">
                  {STICKERS.map(s => (
                    <button key={s} onClick={() => addSticker(s)}
                      className="aspect-square text-2xl rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Text Tab */}
            {tab === 'text' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                <button onClick={addCaption}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <Plus size={16} /> Add Text Caption
                </button>

                {page?.captions?.length > 0 && (
                  <div className="space-y-3">
                    {page.captions.map((cap, ci) => (
                      <div key={ci}
                        className="border rounded-lg p-3 space-y-2"
                        style={{ borderColor: selected?.type === 'caption' && selected.index === ci ? '#808a65' : '#e5e7eb' }}>
                        <div className="flex items-center justify-between">
                          <button onClick={() => setSelected({ type: 'caption', index: ci })}
                            className="text-xs font-medium text-gray-500 hover:text-gray-700">
                            Caption {ci + 1}
                          </button>
                          <button onClick={() => removeCaption(ci)} className="text-gray-400 hover:text-red-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <input type="text" value={cap.text}
                          onChange={e => updateCaption(ci, 'text', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#b5bda2]" />
                        <div className="flex gap-2 flex-wrap">
                          <select value={cap.fontSize} onChange={e => updateCaption(ci, 'fontSize', parseInt(e.target.value))}
                            className="px-2 py-1 border border-gray-200 rounded text-xs bg-white">
                            {[12, 14, 16, 18, 20, 24, 28, 32, 40, 48].map(s => <option key={s} value={s}>{s}px</option>)}
                          </select>
                          <select value={cap.align || 'center'} onChange={e => updateCaption(ci, 'align', e.target.value)}
                            className="px-2 py-1 border border-gray-200 rounded text-xs bg-white">
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                          <input type="color" value={cap.color}
                            onChange={e => updateCaption(ci, 'color', e.target.value)}
                            className="w-8 h-8 rounded border border-gray-200 cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Selection toolbar */}
            {selected && (isFree || selected.type === 'caption') && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center gap-2 text-sm">
                <span className="text-gray-500 capitalize">{selected.type} selected</span>
                <div className="flex-1" />
                <button onClick={() => changeZ(selected.type, selected.index, 'up')}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100" title="Bring forward">
                  <ArrowUp size={16} />
                </button>
                <button onClick={() => changeZ(selected.type, selected.index, 'down')}
                  className="p-1.5 rounded text-gray-500 hover:bg-gray-100" title="Send backward">
                  <ArrowDown size={16} />
                </button>
                <button onClick={() => {
                  if (selected.type === 'image') rmImg(selected.index);
                  else removeCaption(selected.index);
                }}
                  className="p-1.5 rounded text-red-500 hover:bg-red-50" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {/* Canvas */}
            <Canvas
              page={page}
              isFree={isFree}
              themeFont={themeFont}
              templateBorderStyle={template?.theme?.borderStyle}
              uploadedImages={uploadedImages}
              selected={selected}
              setSelected={setSelected}
              updateItem={updateItem}
              onEmptySlotClick={() => { setTab('images'); fileRef.current?.click(); }}
              onRemoveImage={rmImg}
            />

            <div className="flex items-center justify-between mt-1 text-sm text-gray-400">
              <span>Page {pageIdx + 1} of {pages.length}</span>
              <div className="flex gap-2">
                <button disabled={pageIdx === 0} onClick={() => { setPageIdx(pageIdx - 1); setSelected(null); }}
                  className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30">Prev</button>
                <button disabled={pageIdx === pages.length - 1} onClick={() => { setPageIdx(pageIdx + 1); setSelected(null); }}
                  className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30">Next</button>
              </div>
            </div>

            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
          </main>

          {/* Right Sidebar */}
          <aside>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Summary</h2>
              <div className="space-y-2.5 text-sm mb-6">
                <div className="flex justify-between"><span className="text-gray-500">Pages:</span><span className="font-medium">{pages.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Size:</span><span className="font-medium">{SIZES.find(s => s.key === bookSize)?.label.split(' ')[0]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type:</span><span className="font-medium capitalize">{bookType}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Images:</span><span className="font-medium">{uploadedImages.length} uploaded</span></div>
                <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-xl font-bold text-gray-900">${total}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <button onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-xl"
                  style={{ backgroundColor: '#808a65' }}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : 'Save Project'}
                </button>
                <button onClick={() => navigate(`/preview/${projectId}`)}
                  disabled={!projectId}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60">
                  <Eye size={16} /> Preview
                </button>
              </div>

              {lastSaved && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Last saved {lastSaved.toLocaleTimeString()}
                </p>
              )}

              {isFree && (
                <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Free layout:</strong> drag photos to move, corners to resize, top circle to rotate. Overlap and tilt freely.
                  </p>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}

/* ---------- Canvas ---------- */

function Canvas({ page, isFree, themeFont, templateBorderStyle, uploadedImages, selected, setSelected, updateItem, onEmptySlotClick, onRemoveImage }) {
  const wrapRef = useRef(null);
  const borderStyle =
    templateBorderStyle === 'decorative' ? 'double' :
    templateBorderStyle === 'illustrated' ? 'dotted' : 'dashed';

  function onCanvasPointerDown(e) {
    if (e.target === wrapRef.current) setSelected(null);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div
        ref={wrapRef}
        onPointerDown={onCanvasPointerDown}
        className="relative border-2 rounded-xl overflow-hidden select-none"
        style={{
          aspectRatio: '1/1.2',
          maxHeight: 600,
          backgroundColor: page?.backgroundColor || '#ffffff',
          borderStyle,
          borderColor: '#e5e7eb',
        }}
      >
        {isFree ? (
          <FreeLayout
            page={page}
            wrapRef={wrapRef}
            selected={selected}
            setSelected={setSelected}
            updateItem={updateItem}
            themeFont={themeFont}
          />
        ) : (
          <GridLayout
            page={page}
            uploadedImages={uploadedImages}
            onEmptySlotClick={onEmptySlotClick}
            onRemoveImage={onRemoveImage}
            themeFont={themeFont}
            wrapRef={wrapRef}
            selected={selected}
            setSelected={setSelected}
            updateItem={updateItem}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Grid layout (templates) ---------- */

function GridLayout({ page, uploadedImages, onEmptySlotClick, onRemoveImage, themeFont, wrapRef, selected, setSelected, updateItem }) {
  const slotCount = page?.layout === 'collage' ? 4 : page?.layout === 'double' ? 2 : 1;
  const slots = Array.from({ length: slotCount }, (_, i) => page?.images[i] || null);
  return (
    <>
      <div className={`absolute inset-0 grid gap-3 p-4 ${
        page?.layout === 'double' ? 'grid-cols-2' :
        page?.layout === 'collage' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'
      }`}>
        {slots.map((img, pos) => {
          const rotation = img?.rotation || 0;
          const cellStyle = {
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center center',
          };
          if (img?.url) {
            return (
              <div key={pos} className="relative group rounded-lg overflow-hidden bg-gray-100 shadow-sm" style={cellStyle}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => onRemoveImage(pos)}
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} />
                </button>
              </div>
            );
          }
          return (
            <button key={pos} onClick={onEmptySlotClick}
              className="rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#808a65] hover:text-[#808a65] transition-colors bg-gray-50/50"
              style={cellStyle}>
              <ImageIcon size={slotCount === 1 ? 40 : 28} strokeWidth={1} className="mb-2" />
              <span className="text-xs font-medium">
                {uploadedImages.length > 0 ? 'Click image from library' : 'Upload photo'}
              </span>
            </button>
          );
        })}
      </div>
      {/* Captions and stickers rendered as free items so they're draggable on templates too */}
      {page?.captions?.map((cap, ci) => (
        <FreeItem
          key={`cap-${ci}`}
          kind="caption" idx={ci} item={cap}
          wrapRef={wrapRef}
          isSelected={selected?.type === 'caption' && selected.index === ci}
          onSelect={() => setSelected({ type: 'caption', index: ci })}
          updateItem={updateItem}
          themeFont={themeFont}
        />
      ))}
    </>
  );
}

/* ---------- Free layout ---------- */

function FreeLayout({ page, wrapRef, selected, setSelected, updateItem, themeFont }) {
  if (!page) return null;
  const items = [
    ...(page.images || []).map((it, i) => ({ kind: 'image', idx: i, item: it })),
    ...(page.captions || []).map((it, i) => ({ kind: 'caption', idx: i, item: it })),
  ];
  items.sort((a, b) => (a.item.zIndex || 0) - (b.item.zIndex || 0));

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
        <ImageIcon size={48} strokeWidth={1} className="mb-3" />
        <p className="text-sm">Upload images and click to add them — then drag, resize, rotate</p>
      </div>
    );
  }

  return (
    <>
      {items.map(({ kind, idx, item }) => (
        <FreeItem
          key={`${kind}-${idx}`}
          kind={kind}
          idx={idx}
          item={item}
          wrapRef={wrapRef}
          isSelected={selected?.type === kind && selected?.index === idx}
          onSelect={() => setSelected({ type: kind, index: idx })}
          updateItem={updateItem}
          themeFont={themeFont}
        />
      ))}
    </>
  );
}

function FreeItem({ kind, idx, item, wrapRef, isSelected, onSelect, updateItem, themeFont }) {
  // Stable refs so listeners don't leak across re-renders
  const dragState = useRef(null);
  const updateItemRef = useRef(updateItem);
  const kindRef = useRef(kind);
  const idxRef = useRef(idx);
  useEffect(() => { updateItemRef.current = updateItem; }, [updateItem]);
  useEffect(() => { kindRef.current = kind; }, [kind]);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  const handlersRef = useRef(null);
  if (!handlersRef.current) {
    handlersRef.current = {
      onMove(e) {
        const s = dragState.current;
        if (!s) return;
        const dx = e.clientX - s.startPointer.x;
        const dy = e.clientY - s.startPointer.y;

        if (s.mode === 'move') {
          const nx = s.startItem.x + (dx / s.canvas.w) * 100;
          const ny = s.startItem.y + (dy / s.canvas.h) * 100;
          updateItemRef.current(kindRef.current, idxRef.current, {
            x: Math.max(-20, Math.min(120, nx)),
            y: Math.max(-20, Math.min(120, ny)),
          });
          return;
        }

        if (s.mode === 'rotate') {
          const w0 = (s.startItem.width / 100) * s.canvas.w;
          const h0 = ((s.startItem.height ?? 20) / 100) * s.canvas.h;
          const cx = s.canvas.left + (s.startItem.x / 100) * s.canvas.w + w0 / 2;
          const cy = s.canvas.top + (s.startItem.y / 100) * s.canvas.h + h0 / 2;
          const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
          updateItemRef.current(kindRef.current, idxRef.current, { rotation: Math.round(angle) });
          return;
        }

        if (s.mode === 'resize') {
          const r = (s.startItem.rotation || 0) * Math.PI / 180;
          const cos = Math.cos(r), sin = Math.sin(r);
          const w0 = (s.startItem.width / 100) * s.canvas.w;
          const h0 = ((s.startItem.height ?? 20) / 100) * s.canvas.h;
          const x0 = (s.startItem.x / 100) * s.canvas.w;
          const y0 = (s.startItem.y / 100) * s.canvas.h;
          const cx0 = x0 + w0 / 2, cy0 = y0 + h0 / 2;

          const cornerLocal = {
            nw: [-w0 / 2, -h0 / 2], ne: [w0 / 2, -h0 / 2],
            sw: [-w0 / 2,  h0 / 2], se: [w0 / 2,  h0 / 2],
          }[s.corner];
          const oppositeLocal = [-cornerLocal[0], -cornerLocal[1]];

          const ox = cx0 + cos * oppositeLocal[0] - sin * oppositeLocal[1];
          const oy = cy0 + sin * oppositeLocal[0] + cos * oppositeLocal[1];

          const px = e.clientX - s.canvas.left;
          const py = e.clientY - s.canvas.top;

          const vx = px - ox, vy = py - oy;
          const lx = cos * vx + sin * vy;
          const ly = -sin * vx + cos * vy;

          const signX = oppositeLocal[0] < 0 ? 1 : -1;
          const signY = oppositeLocal[1] < 0 ? 1 : -1;
          const newW = Math.max(20, lx * signX);
          const newH = Math.max(20, ly * signY);

          const ncLocal = [-oppositeLocal[0] * (newW / w0), -oppositeLocal[1] * (newH / h0)];
          const ncx = ox + cos * ncLocal[0] - sin * ncLocal[1];
          const ncy = oy + sin * ncLocal[0] + cos * ncLocal[1];
          const nx = ncx - newW / 2;
          const ny = ncy - newH / 2;

          const patch = {
            x: (nx / s.canvas.w) * 100,
            y: (ny / s.canvas.h) * 100,
            width: (newW / s.canvas.w) * 100,
          };
          if (s.startItem.height !== undefined) {
            patch.height = (newH / s.canvas.h) * 100;
          }
          updateItemRef.current(kindRef.current, idxRef.current, patch);
        }
      },
      onUp() {
        dragState.current = null;
        document.removeEventListener('pointermove', handlersRef.current.onMove);
        document.removeEventListener('pointerup', handlersRef.current.onUp);
      },
    };
  }

  // Cleanup on unmount
  useEffect(() => () => {
    if (handlersRef.current) {
      document.removeEventListener('pointermove', handlersRef.current.onMove);
      document.removeEventListener('pointerup', handlersRef.current.onUp);
    }
  }, []);

  function startDrag(e, mode, corner) {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    dragState.current = {
      mode, corner,
      startPointer: { x: e.clientX, y: e.clientY },
      startItem: { ...item },
      canvas: { w: r.width, h: r.height, left: r.left, top: r.top },
    };
    document.addEventListener('pointermove', handlersRef.current.onMove);
    document.addEventListener('pointerup', handlersRef.current.onUp);
  }

  const widthPct = item.width || 40;
  const heightPct = item.height; // undefined for captions
  const transform = `translate(-50%, -50%) rotate(${item.rotation || 0}deg)`;
  const baseStyle = {
    position: 'absolute',
    left: `calc(${item.x + widthPct / 2}% )`,
    top: heightPct !== undefined
      ? `calc(${item.y + heightPct / 2}%)`
      : `calc(${item.y}% + ${(item.fontSize || 20) / 2}px)`,
    width: `${widthPct}%`,
    transform,
    transformOrigin: 'center center',
    zIndex: item.zIndex || 0,
    cursor: 'move',
    touchAction: 'none',
  };

  if (kind === 'image') {
    return (
      <div
        onPointerDown={(e) => startDrag(e, 'move')}
        style={{ ...baseStyle, height: `${heightPct}%`, outline: isSelected ? '2px solid #808a65' : 'none', outlineOffset: 2, borderRadius: 4 }}
      >
        <img src={item.url} alt="" draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, display: 'block', pointerEvents: 'none' }} />
        {isSelected && <Handles startDrag={startDrag} hasHeight />}
      </div>
    );
  }

  // caption
  return (
    <div
      onPointerDown={(e) => startDrag(e, 'move')}
      style={{
        ...baseStyle,
        padding: '4px 8px',
        outline: isSelected ? '2px dashed #808a65' : 'none',
        outlineOffset: 2,
      }}
    >
      <div style={{
        fontSize: item.fontSize,
        fontFamily: item.fontFamily || themeFont,
        color: item.color,
        textAlign: item.align || 'center',
        lineHeight: 1.2,
        textShadow: '0 1px 3px rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {item.text || ' '}
      </div>
      {isSelected && <Handles startDrag={startDrag} hasHeight={false} />}
    </div>
  );
}

function Handles({ startDrag, hasHeight }) {
  // Each corner: position offsets (so the small box visually centers on the corner)
  const corners = hasHeight
    ? [
        { corner: 'nw', style: { left: -6, top: -6, cursor: 'nwse-resize' } },
        { corner: 'ne', style: { right: -6, top: -6, cursor: 'nesw-resize' } },
        { corner: 'sw', style: { left: -6, bottom: -6, cursor: 'nesw-resize' } },
        { corner: 'se', style: { right: -6, bottom: -6, cursor: 'nwse-resize' } },
      ]
    : [
        { corner: 'sw', style: { left: -6, bottom: -6, cursor: 'ew-resize' } },
        { corner: 'se', style: { right: -6, bottom: -6, cursor: 'ew-resize' } },
      ];

  return (
    <>
      {corners.map(({ corner, style }) => (
        <div
          key={corner}
          onPointerDown={(e) => startDrag(e, 'resize', corner)}
          style={{
            position: 'absolute',
            width: 12, height: 12,
            backgroundColor: 'white',
            border: '2px solid #808a65',
            borderRadius: 2,
            touchAction: 'none',
            ...style,
          }}
        />
      ))}
      <div style={{
        position: 'absolute',
        left: '50%', top: -22,
        width: 2, height: 16,
        backgroundColor: '#808a65',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
      }} />
      <div
        onPointerDown={(e) => startDrag(e, 'rotate')}
        style={{
          position: 'absolute',
          left: '50%', top: -34,
          width: 18, height: 18,
          backgroundColor: 'white',
          border: '2px solid #808a65',
          borderRadius: '50%',
          transform: 'translateX(-50%)',
          cursor: 'crosshair',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'none',
        }}
      >
        <RotateCw size={10} color="#808a65" />
      </div>
    </>
  );
}
