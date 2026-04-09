import { Link } from 'react-router-dom';
import { ArrowRight, Palette, FileImage, Sparkles, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-28" style={{ background: 'linear-gradient(to bottom, #f5f2e6, #faf8f0, #fefdf9)' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Create Beautiful Albums<br />Your Way
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Design your own, use our templates, or let AI create one for you. Digital or physical — it's your choice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/design" className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-medium rounded-xl text-base" style={{ backgroundColor: '#808a65' }}>
              Start Creating <ArrowRight size={18} />
            </Link>
            <Link to="/templates" className="inline-flex items-center gap-2 px-8 py-3.5 border border-gray-300 text-gray-700 font-medium rounded-xl text-base hover:bg-gray-50">
              Browse Templates
            </Link>
          </div>
        </div>
      </section>

      {/* Three Ways to Create */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-14" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Three Ways to Create
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <CreationCard icon={<Palette size={22} />} title="Design Your Own" description="Full creative control with our intuitive drag-and-drop designer. Add photos, text, and customize every detail." linkText="Start designing" linkTo="/design" />
            <CreationCard icon={<FileImage size={22} />} title="Use a Template" description="Choose from professionally designed templates for weddings, travel, family, and more. Just add your photos." linkText="Browse templates" linkTo="/templates" />
            <CreationCard icon={<Sparkles size={22} />} title="AI-Generated" description="Let our AI create a beautiful album for you. Just upload your photos and we'll handle the rest." linkText="Try AI creator" linkTo="/ai-create" />
          </div>
        </div>
      </section>

      {/* Choose Your Format */}
      <section className="py-20 md:py-24" style={{ backgroundColor: '#faf8f0' }}>
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-14" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Choose Your Format
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <FormatCard title="Digital Album" features={['Instant delivery', 'Share via link or social media', 'View on any device', 'Starting at $19.99']} buttonText="Create Digital" linkTo="/design?type=digital" />
            <FormatCard title="Physical Album" features={['Premium quality printing', 'Multiple size options', 'Hardcover or softcover', 'Starting at $34.99']} buttonText="Create Physical" linkTo="/design?type=physical" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Ready to Start?
          </h2>
          <p className="text-gray-500 text-lg mb-8">Create stunning albums in minutes. No design experience needed.</p>
          <Link to="/design" className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-medium rounded-xl text-base" style={{ backgroundColor: '#808a65' }}>
            Get Started Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function CreationCard({ icon, title, description, linkText, linkTo }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: '#e8ebe2', color: '#6b7455' }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{description}</p>
      <Link to={linkTo} className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: '#6b7455' }}>
        {linkText} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function FormatCard({ title, features, buttonText, linkTo }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-6" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{title}</h3>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-600">
            <Star size={14} style={{ color: '#97a17e' }} className="flex-shrink-0" />{f}
          </li>
        ))}
      </ul>
      <Link to={linkTo} className="block w-full text-center px-6 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
        {buttonText}
      </Link>
    </div>
  );
}