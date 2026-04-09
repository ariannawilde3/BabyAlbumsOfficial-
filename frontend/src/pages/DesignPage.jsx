import { useState, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { LayoutGrid, Image as ImageIcon, Type, Plus, ShoppingCart, Save, Upload, Trash2 } from 'lucide-react';

const LAYOUTS = [{ key: 'single', label: 'Single' }, { key: 'double', label: 'Double' }, { key: 'collage', label: 'Collage' }];
const SIZES = [{ key: 'small_8x8', label: 'Small (8×8")' }, { key: 'medium_11x11', label: 'Medium (11×11")' }, { key: 'large_13x11', label: 'Large (13×11")' }];
const TYPES = [{ key: 'physical', label: 'Physical' }, { key: 'digital', label: 'Digital' }];
const PRICES = { physical: { small_8x8: 34.99, medium_11x11: 52.48, large_13x11: 69.99 }, digital: { small_8x8: 19.99, medium_11x11: 29.99, large_13x11: 39.99 } };

export default function DesignPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isAi = location.pathname === '/ai-create';
  const fileRef = useRef(null);

  const [title, setTitle] = useState('My Photobook');
  const [bookSize, setBookSize] = useState('medium_11x11');
  const [bookType, setBookType] = useState(searchParams.get('type') || 'physical');
  const [tab, setTab] = useState('layout');
  const [pages, setPages] = useState([{ id: 1, layoutType: 'single', images: [] }]);
  const [pageIdx, setPageIdx] = useState(0);

  const page = pages[pageIdx];
  const base = PRICES[bookType]?.[bookSize] || 0;
  const extra = bookType === 'physical' ? Math.max(0, pages.length - 1) * 2.50 : 0;
  const total = (base + extra).toFixed(2);

  function addPage() {
    setPages([...pages, { id: pages.length + 1, layoutType: 'single', images: [] }]);
    setPageIdx(pages.length);
  }

  function setLayout(l) {
    setPages(p => p.map((pg, i) => i === pageIdx ? { ...pg, layoutType: l } : pg));
  }

  function onUpload(e) {
    const files = Array.from(e.target.files || []);
    const imgs = files.map((f, i) => ({ id: `img-${Date.now()}-${i}`, url: URL.createObjectURL(f), file: f }));
    setPages(p => p.map((pg, i) => i === pageIdx ? { ...pg, images: [...pg.images, ...imgs] } : pg));
  }

  function rmImg(id) {
    setPages(p => p.map((pg, i) => i === pageIdx ? { ...pg, images: pg.images.filter(img => img.id !== id) } : pg));
  }

  return (
    <div style={{ backgroundColor: '#f6f7f4' }}>
      {isAi && (
        <div className="border-b px-4 py-3" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
          <p className="max-w-7xl mx-auto text-sm" style={{ color: '#92400e' }}>
            <strong>AI Mode:</strong> Upload your photos and our AI will automatically arrange them in a beautiful layout.
          </p>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ focusRingColor: '#b5bda2' }} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Size</label>
                <select value={bookSize} onChange={e => setBookSize(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2">
                  {SIZES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Type</label>
                <select value={bookType} onChange={e => setBookType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2">
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Pages</h2>
              <div className="space-y-2 mb-4">
                {pages.map((pg, i) => (
                  <button key={pg.id} onClick={() => setPageIdx(i)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
                    style={i === pageIdx
                      ? { backgroundColor: '#dce4f5', color: '#545c43', fontWeight: 500 }
                      : { color: '#4b5563' }
                    }>
                    <span className="font-medium">Page {i + 1}</span>
                    <span className="text-xs text-gray-400 ml-2">{pg.images.length} images</span>
                  </button>
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
                <div className="flex gap-3">
                  {LAYOUTS.map(l => (
                    <button key={l.key} onClick={() => setLayout(l.key)}
                      className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                      style={page?.layoutType === l.key
                        ? { backgroundColor: '#808a65', color: 'white' }
                        : { backgroundColor: '#f3f4f6', color: '#4b5563' }
                      }>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button for Images Tab */}
            {tab === 'images' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  <Upload size={16} /> Click to upload images
                </button>
              </div>
            )}

            {/* Canvas */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="relative bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden" style={{ aspectRatio: '1/1.2', maxHeight: 600 }}>
                {page?.images.length > 0 ? (
                  <div className={`absolute inset-0 grid gap-2 p-3 ${
                    page.layoutType === 'double' ? 'grid-cols-2' :
                    page.layoutType === 'collage' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'
                  }`}>
                    {page.images.map(img => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden bg-gray-100">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => rmImg(img.id)}
                          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={48} strokeWidth={1} className="mb-3 text-gray-300" />
                    <p className="text-base font-medium mb-1">No images yet</p>
                    <p className="text-sm mb-4">Upload images to get started</p>
                    <button onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-xl"
                      style={{ backgroundColor: '#808a65' }}>
                      <Upload size={14} /> Upload Photos
                    </button>
                  </div>
                )}
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
                <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                  <span className="text-gray-900 font-medium">Total:</span>
                  <span className="text-xl font-bold text-gray-900">${total}</span>
                </div>
              </div>
              <div className="space-y-2.5">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-xl"
                  style={{ backgroundColor: '#808a65' }}>
                  <ShoppingCart size={16} /> Add to Cart
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                  <Save size={16} /> Save Project
                </button>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}