import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import AuthModal from '../app/components/ui/AuthModal';

const STYLES = [
  { key: '', label: 'All Templates' },
  { key: 'classic', label: 'Classic Baby' },
  { key: 'modern', label: 'Modern Minimal' },
  { key: 'floral', label: 'Floral Garden' },
  { key: 'woodland', label: 'Woodland Adventure' },
  { key: 'bright', label: 'Bright & Bold' },
];

function LayoutMini({ layout, bg, accent }) {
  const border = `1px solid ${accent || '#d1d5db'}`;
  if (layout === 'double') {
    return (
      <div className="w-full h-full flex gap-[2px] p-[3px]" style={{ backgroundColor: bg }}>
        <div className="flex-1 rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
        <div className="flex-1 rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
      </div>
    );
  }
  if (layout === 'collage') {
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] p-[3px]" style={{ backgroundColor: bg }}>
        <div className="rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
        <div className="rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
        <div className="rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
        <div className="rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
      </div>
    );
  }
  // single
  return (
    <div className="w-full h-full flex p-[3px]" style={{ backgroundColor: bg }}>
      <div className="flex-1 rounded-sm" style={{ border, backgroundColor: accent + '22' }} />
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [activeStyle, setActiveStyle] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favs, setFavs] = useState(new Set());
  const [showAuth, setShowAuth] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [activeStyle]);

  useEffect(() => {
    if (user?.favorites) {
      setFavs(new Set(user.favorites.map(f => typeof f === 'string' ? f : f._id)));
    }
  }, [user]);

  async function fetchTemplates() {
    setLoading(true);
    try {
      let query = '?category=Baby';
      if (activeStyle) query += `&style=${activeStyle}`;
      const data = await api.get(`/templates${query}`);
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFav(templateId) {
    if (isGuest) {
      setShowAuth(true);
      return;
    }
    try {
      const data = await api.post(`/favorites/${templateId}`);
      setFavs(new Set(data.favorites));
    } catch {}
  }

  function useTemplate(template) {
    navigate(`/design?templateId=${template._id}`);
  }

  async function addToCart(template) {
    try {
      await api.post('/cart', {
        templateId: template._id,
        itemType: 'template',
        price: template.price,
      });
      navigate('/cart');
    } catch {
      alert('Failed to add to cart');
    }
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Baby Album Templates
        </h1>
        <p className="text-gray-500 mb-8">Choose a style to get started, then customize with your own photos and captions</p>

        {/* Style Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {STYLES.map(s => (
            <button key={s.key} onClick={() => setActiveStyle(s.key)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={activeStyle === s.key
                ? { backgroundColor: '#808a65', color: 'white' }
                : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }
              }>
              {s.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        )}

        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {templates.map(t => {
              const colors = t.theme?.colorPalette || [];
              const bg = colors[0] || '#ffffff';
              const accent = colors[2] || '#d1d5db';

              return (
                <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-gray-200 transition-all duration-200">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <button onClick={() => toggleFav(t._id)}
                      className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                      style={{ backdropFilter: 'blur(4px)' }}>
                      <Heart size={16} className={favs.has(t._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{t.name}</h3>
                      <span className="text-lg font-semibold text-gray-900">${t.price.toFixed(2)}</span>
                    </div>

                    {/* Color palette */}
                    {colors.length > 0 && (
                      <div className="flex gap-1.5 mb-3">
                        {colors.slice(0, 5).map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                        ))}
                        <span className="text-xs text-gray-400 ml-1 self-center">{t.theme?.fontFamily}</span>
                      </div>
                    )}

                    {/* Visual page layout preview */}
                    <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
                      {t.pages?.slice(0, 6).map((pg, i) => (
                        <div key={i} className="w-10 h-12 rounded border border-gray-200 flex-shrink-0 overflow-hidden">
                          <LayoutMini layout={pg.layout} bg={bg} accent={accent} />
                        </div>
                      ))}
                      {(t.pages?.length || 0) > 6 && (
                        <div className="w-10 h-12 rounded border border-gray-200 flex-shrink-0 flex items-center justify-center text-xs text-gray-400">
                          +{t.pages.length - 6}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mb-4">{t.description}</p>
                    <div className="flex gap-2">
                      <button onClick={() => useTemplate(t)}
                        className="flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ backgroundColor: '#808a65' }}>
                        Use Template
                      </button>
                      <button onClick={() => setPreviewTemplate(t)}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => addToCart(t)}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && templates.length === 0 && (
          <p className="text-center text-gray-400 py-20">No templates found.</p>
        )}
      </div>

      {/* Template Preview Modal */}
      {previewTemplate && (() => {
        const t = previewTemplate;
        const colors = t.theme?.colorPalette || [];
        const bg = colors[0] || '#ffffff';
        const accent = colors[2] || '#d1d5db';

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center">
            <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setPreviewTemplate(null)} />
            <div className="relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#fefdf9' }}>
              <img src={t.image} alt={t.name} className="w-full aspect-[16/9] object-cover" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{t.name}</h2>
                  <span className="text-2xl font-bold text-gray-900">${t.price.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 mb-4">{t.description}</p>

                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  <span>{t.pages?.length || 0} pages</span>
                  {t.theme?.fontFamily && <span>Font: {t.theme.fontFamily}</span>}
                  {t.theme?.borderStyle && t.theme.borderStyle !== 'none' && (
                    <span>Border: {t.theme.borderStyle}</span>
                  )}
                </div>

                {/* Color palette */}
                {colors.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Color Palette</h4>
                    <div className="flex gap-2">
                      {colors.map((c, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg border border-gray-200 relative group" style={{ backgroundColor: c }}>
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Full page layout preview */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Page Layouts</h4>
                  <div className="grid grid-cols-6 gap-2">
                    {t.pages?.map((pg, i) => (
                      <div key={i} className="aspect-[5/6] rounded-lg border border-gray-200 overflow-hidden relative">
                        <LayoutMini layout={pg.layout} bg={bg} accent={accent} />
                        <span className="absolute bottom-0.5 right-1 text-[9px] text-gray-400">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent elements */}
                {t.theme?.accentElements?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Decorative Elements</h4>
                    <div className="flex flex-wrap gap-2">
                      {t.theme.accentElements.map((el, i) => (
                        <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full capitalize">{el}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { useTemplate(t); setPreviewTemplate(null); }}
                    className="flex-1 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
                    Use This Template
                  </button>
                  <button onClick={() => setPreviewTemplate(null)}
                    className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
