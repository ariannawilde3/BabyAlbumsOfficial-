import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2, ArrowLeft, ShieldCheck, Hash } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

function formatCard(value) {
  return value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
}
function formatExpiry(value) {
  const v = value.replace(/\D/g, '').slice(0, 4);
  if (v.length < 3) return v;
  return `${v.slice(0, 2)}/${v.slice(2)}`;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'CA',
    postalCode: '',
    country: 'United States',
    phone: '',
  });
  const [card, setCard] = useState({
    cardName: user?.name || '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/cart');
        if (!data || data.length === 0) {
          navigate('/cart');
          return;
        }
        setItems(data);
      } catch {
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // TEST MODE: shipping + tax zeroed for checkout testing — restore for production
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = 0;
  const tax = 0;
  const total = +(subtotal + shippingFee + tax).toFixed(2);

  function validate() {
    const e = {};
    if (!shipping.fullName.trim()) e.fullName = 'Required';
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(shipping.email)) e.email = 'Valid email required';
    if (!shipping.addressLine1.trim()) e.addressLine1 = 'Required';
    if (!shipping.city.trim()) e.city = 'Required';
    if (!shipping.postalCode.trim()) e.postalCode = 'Required';

    const cardDigits = card.cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cardDigits)) e.cardNumber = 'Invalid card number';
    if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.expiry = 'MM/YY';
    else {
      const [mm, yy] = card.expiry.split('/').map(Number);
      if (mm < 1 || mm > 12) e.expiry = 'Invalid month';
      const now = new Date();
      const expDate = new Date(2000 + yy, mm);
      if (expDate <= now) e.expiry = 'Card expired';
    }
    if (!/^\d{3,4}$/.test(card.cvc)) e.cvc = '3–4 digits';
    if (!card.cardName.trim()) e.cardName = 'Required';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const order = await api.post('/orders', {
        shippingAddress: shipping,
        payment: {
          cardName: card.cardName,
          cardNumber: card.cardNumber,
        },
      });
      navigate(`/order/${order._id}`, { replace: true });
    } catch (err) {
      alert(err.message || 'Checkout failed');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => navigate('/cart')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={16} /> Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Checkout
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <Section title="Shipping Address">
              <Field label="Full Name" error={errors.fullName}>
                <input type="text" value={shipping.fullName}
                  onChange={e => setShipping({ ...shipping, fullName: e.target.value })}
                  className={inputClass(errors.fullName)} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input type="email" value={shipping.email}
                  onChange={e => setShipping({ ...shipping, email: e.target.value })}
                  className={inputClass(errors.email)} />
              </Field>
              <Field label="Address Line 1" error={errors.addressLine1}>
                <input type="text" value={shipping.addressLine1}
                  onChange={e => setShipping({ ...shipping, addressLine1: e.target.value })}
                  className={inputClass(errors.addressLine1)} placeholder="Street address" />
              </Field>
              <Field label="Address Line 2 (optional)">
                <input type="text" value={shipping.addressLine2}
                  onChange={e => setShipping({ ...shipping, addressLine2: e.target.value })}
                  className={inputClass()} placeholder="Apt, suite, etc." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City" error={errors.city}>
                  <input type="text" value={shipping.city}
                    onChange={e => setShipping({ ...shipping, city: e.target.value })}
                    className={inputClass(errors.city)} />
                </Field>
                <Field label="State">
                  <select value={shipping.state}
                    onChange={e => setShipping({ ...shipping, state: e.target.value })}
                    className={inputClass()}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ZIP / Postal Code" error={errors.postalCode}>
                  <input type="text" value={shipping.postalCode}
                    onChange={e => setShipping({ ...shipping, postalCode: e.target.value })}
                    className={inputClass(errors.postalCode)} />
                </Field>
                <Field label="Phone (optional)">
                  <input type="tel" value={shipping.phone}
                    onChange={e => setShipping({ ...shipping, phone: e.target.value })}
                    className={inputClass()} />
                </Field>
              </div>
            </Section>

            <Section title="Billing">
              <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-500">
                <ShieldCheck size={14} /> Sandbox mode — no real charge will occur
              </div>
              <Field label="Account Holder" error={errors.cardName}>
                <input type="text" value={card.cardName} name="account-holder-name"
                  autoComplete="off" data-lpignore="true"
                  onChange={e => setCard({ ...card, cardName: e.target.value })}
                  className={inputClass(errors.cardName)} />
              </Field>
              <Field label="Account Number" error={errors.cardNumber}>
                <div className="relative">
                  <input type="text" value={card.cardNumber} name="account-id"
                    autoComplete="off" data-lpignore="true"
                    onChange={e => setCard({ ...card, cardNumber: formatCard(e.target.value) })}
                    className={inputClass(errors.cardNumber) + ' pr-10'}
                    placeholder="1234 5678 9012 3456" />
                  <Hash size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valid Through (MM/YY)" error={errors.expiry}>
                  <input type="text" value={card.expiry} name="valid-through"
                    autoComplete="off" data-lpignore="true"
                    onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    className={inputClass(errors.expiry)} placeholder="12/27" />
                </Field>
                <Field label="Security Code" error={errors.cvc}>
                  <input type="text" value={card.cvc} name="security-code"
                    autoComplete="off" data-lpignore="true"
                    onChange={e => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className={inputClass(errors.cvc)} placeholder="123" />
                </Field>
              </div>
            </Section>
          </div>

          <aside className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
              <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
                Order Summary
              </h2>
              <div className="space-y-3 mb-4 max-h-[240px] overflow-y-auto pr-1">
                {items.map(item => (
                  <div key={item._id} className="flex items-start gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.itemType === 'template' ? item.template?.name : item.project?.title || 'Album'}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{item.itemType} &middot; Qty {item.quantity}</p>
                    </div>
                    <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                <Row label="Shipping" value={shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-xl disabled:opacity-60"
                style={{ backgroundColor: '#808a65' }}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                {submitting ? 'Processing...' : `Pay $${total.toFixed(2)}`}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Secure checkout &middot; Demo only
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">{label}</span>
      {children}
      {error && <span className="block text-xs text-red-500 mt-1">{error}</span>}
    </label>
  );
}

function inputClass(error) {
  return `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
    error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-[#b5bda2]'
  }`;
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
