import { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

const CATEGORIES = ['All', 'Family', 'Wedding', 'Travel', 'Baby', 'Graduation', 'Birthday'];

const TEMPLATES = [
  { id: '1', name: 'Family Memories', category: 'Family', price: 49.99, description: 'Perfect for capturing family moments and celebrations', image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop' },
  { id: '2', name: 'Wedding Album', category: 'Wedding', price: 89.99, description: 'Elegant wedding album with premium layouts', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop' },
  { id: '3', name: 'Travel Journal', category: 'Travel', price: 39.99, description: 'Document your adventures in style', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop' },
  { id: '4', name: "Baby's First Year", category: 'Baby', price: 44.99, description: 'Capture every precious milestone', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop' },
  { id: '5', name: 'Graduation Day', category: 'Graduation', price: 34.99, description: 'Celebrate academic achievements', image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=400&fit=crop' },
  { id: '6', name: 'Birthday Bash', category: 'Birthday', price: 29.99, description: 'Make birthday memories last forever', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop' },
];

export default function TemplatesPage() {
  const [active, setActive] = useState('All');
  const [favs, setFavs] = useState(new Set());
  const filtered = active === 'All' ? TEMPLATES : TEMPLATES.filter(t => t.category === active);

  function toggleFav(id) {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Photobook Templates
        </h1>
        <p className="text-gray-500 mb-8">Choose from our professionally designed templates and customize them with your photos</p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActive(cat)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={active === cat
                ? { backgroundColor: '#808a65', color: 'white' }
                : { backgroundColor: 'white', color: '#4b5563', border: '1px solid #e5e7eb' }
              }>
              {cat}
            </button>
          ))}
        </div>

        {/* Template Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button onClick={() => toggleFav(t.id)}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                  style={{ backdropFilter: 'blur(4px)' }}>
                  <Heart size={16} className={favs.has(t.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{t.name}</h3>
                  <span className="text-lg font-semibold text-gray-900">${t.price.toFixed(2)}</span>
                </div>
                <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mb-2">{t.category}</span>
                <p className="text-sm text-gray-500 mb-4">{t.description}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2.5 text-white text-sm font-medium rounded-xl transition-colors" style={{ backgroundColor: '#808a65' }}>
                    Use Template
                  </button>
                  <button className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors">
                    <ShoppingCart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}