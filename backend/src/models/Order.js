import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  template: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null },
  itemType: { type: String, enum: ['project', 'template'], required: true },
  name: { type: String, default: '' },
  image: { type: String, default: null },
  quantity: { type: Number, default: 1, min: 1 },
  price: { type: Number, required: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: { type: String, default: '' },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'United States' },
  phone: { type: String, default: '' },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  method: { type: String, default: 'card' },
  last4: { type: String, default: '' },
  brand: { type: String, default: 'card' },
  cardName: { type: String, default: '' },
}, { _id: false });

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BA-${ts}-${rand}`;
}

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    guestId: { type: String, default: null, index: true, sparse: true },
    orderNumber: { type: String, unique: true, default: generateOrderNumber },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    shippingAddress: { type: addressSchema, required: true },
    payment: { type: paymentSchema, required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'paid',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
