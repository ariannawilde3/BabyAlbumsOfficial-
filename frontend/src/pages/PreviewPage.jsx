import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Edit3, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../lib/api';

// TEST MODE: all prices zeroed for checkout testing — restore real values for production
const PRICES = {
  physical: { small: 0, medium: 0, large: 0 },
  digital: { small: 0, medium: 0, large: 0 },
};

export default function PreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const proj = await api.get(`/projects/${id}`);
        setProject(proj);
        if (proj.templateId) {
          try {
            const t = await api.get(`/templates/${proj.templateId}`);
            setTemplate(t);
          } catch { /* no template */ }
        }
      } catch {
        alert('Failed to load project');
        navigate('/design');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!project) return null;

  const base = PRICES[project.bookType]?.[project.bookSize] || 0;
  const extra = project.bookType === 'physical' ? Math.max(0, project.pages.length - 1) * 2.50 : 0;
  const total = (base + extra).toFixed(2);
  const themeColors = template?.theme?.colorPalette || [];
  const themeFont = template?.theme?.fontFamily || '"Playfair Display", Georgia, serif';

  async function addToCart() {
    try {
      await api.post('/cart', {
        projectId: project._id,
        itemType: 'project',
        price: parseFloat(total),
      });
      navigate('/cart');
    } catch {
      alert('Failed to add to cart');
    }
  }

  return (
    <div style={{ backgroundColor: '#f6f7f4' }}>
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-700">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                {project.title}
              </h1>
              <p className="text-sm text-gray-500">{project.pages.length} pages &middot; {project.bookSize} &middot; {project.bookType}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/design?projectId=${project._id}`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">
              <Edit3 size={16} /> Edit
            </button>
            <button onClick={addToCart}
              className="flex items-center gap-2 px-4 py-2 text-white font-medium rounded-xl"
              style={{ backgroundColor: '#808a65' }}>
              <ShoppingCart size={16} /> Add to Cart — ${total}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {project.pages.map((page, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-400">
              Page {i + 1} of {project.pages.length}
            </div>
            <div
              className="relative"
              style={{
                aspectRatio: '1/1.2',
                backgroundColor: page.backgroundColor || themeColors[0] || '#ffffff',
              }}
            >
              {page.layout === 'free'
                ? <FreePagePreview page={page} themeFont={themeFont} />
                : <GridPagePreview page={page} themeFont={themeFont} />
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridPagePreview({ page, themeFont }) {
  const filledImages = page.images.filter(i => i.url);
  return (
    <>
      {filledImages.length > 0 ? (
        <div className={`absolute inset-0 grid gap-3 p-4 ${
          page.layout === 'double' ? 'grid-cols-2' :
          page.layout === 'collage' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-1'
        }`}>
          {page.images.map((img, j) => (
            img?.url ? (
              <div key={j} className="rounded-lg overflow-hidden bg-gray-100 shadow-sm"
                style={{ transform: `rotate(${img.rotation || 0}deg)`, transformOrigin: 'center center' }}>
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ) : <div key={j} />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
          <ImageIcon size={40} strokeWidth={1} className="mb-2" />
          <p className="text-sm">Empty page</p>
        </div>
      )}
      {page.captions?.map((cap, ci) => (
        <div key={ci}
          style={{
            position: 'absolute',
            left: `${cap.x ?? 25}%`,
            top: `${cap.y}%`,
            width: `${cap.width || 50}%`,
            transform: `rotate(${cap.rotation || 0}deg)`,
            transformOrigin: 'center center',
            zIndex: cap.zIndex || 0,
            fontSize: cap.fontSize,
            fontFamily: cap.fontFamily || themeFont,
            color: cap.color,
            textAlign: cap.align || 'center',
            textShadow: '0 1px 3px rgba(0,0,0,0.15)',
            padding: '4px 8px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
          {cap.text}
        </div>
      ))}
    </>
  );
}

function FreePagePreview({ page, themeFont }) {
  const items = [
    ...(page.images || []).map((it, i) => ({ kind: 'image', i, item: it })),
    ...(page.captions || []).map((it, i) => ({ kind: 'caption', i, item: it })),
  ];
  items.sort((a, b) => (a.item.zIndex || 0) - (b.item.zIndex || 0));

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
        <ImageIcon size={40} strokeWidth={1} className="mb-2" />
        <p className="text-sm">Empty page</p>
      </div>
    );
  }

  return items.map(({ kind, i, item }) => {
    if (kind === 'image') {
      return (
        <div key={`img-${i}`}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            width: `${item.width || 40}%`,
            height: `${item.height || 40}%`,
            transform: `rotate(${item.rotation || 0}deg)`,
            transformOrigin: 'center center',
            zIndex: item.zIndex || 0,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      );
    }
    return (
      <div key={`cap-${i}`}
        style={{
          position: 'absolute',
          left: `${item.x}%`,
          top: `${item.y}%`,
          width: `${item.width || 50}%`,
          transform: `rotate(${item.rotation || 0}deg)`,
          transformOrigin: 'center center',
          zIndex: item.zIndex || 0,
          fontSize: item.fontSize,
          fontFamily: item.fontFamily || themeFont,
          color: item.color,
          textAlign: item.align || 'center',
          textShadow: '0 1px 3px rgba(0,0,0,0.15)',
          padding: '4px 8px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
        {item.text}
      </div>
    );
  });
}
