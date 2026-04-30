# Baby Albums — Senior Project Documentation

A photo album design and ordering platform. Users can pick a pre-designed template or design their own album from scratch with full creative control, then check out and place an order.

This document walks through the entire project from the ground up: what it does, how it's built, why each technology was chosen, and the harder problems that needed solving. The end of the document has common defense questions and how to answer them.

---

## 1. Project Overview

**What it is:** A web application where parents and family members can create custom baby photo albums and order them as digital downloads or physical prints.

**Core user flows:**
1. Browse 5 pre-designed templates → load one → fill it with photos → buy
2. Start from scratch → upload photos → place them anywhere with full drag/resize/rotate → add text and stickers → buy
3. Save in-progress projects → return later to keep editing → preview the final book → check out

**Three "modes" the user can be in:**
- **Guest** — no account, identified by a UUID stored in their browser's localStorage. Can do everything except check out.
- **Logged in (email + password)** — full account, projects and orders tied to it.
- **Logged in (Google OAuth)** — same as above but signed in via Google's "Sign in with Google".

When a guest creates an account, their guest projects and cart get migrated to the new user.

---

## 2. Tech Stack and Why

### Frontend
| Choice | Why |
|---|---|
| **React 18 + Vite** | Component model handles the highly interactive design page well. Vite is much faster than Webpack for dev iteration. |
| **TailwindCSS** | Utility-first CSS — no jumping between files for styling. Keeps every component self-contained. |
| **React Router** | Standard for SPA routing. Clean URL-driven navigation. |
| **Lucide React** | Icon library — small footprint, consistent visual style. |

### Backend
| Choice | Why |
|---|---|
| **Node.js + Express** | Same language (JavaScript) on both sides means no context-switching. Express is minimal — I add only the middleware I actually need. |
| **MongoDB + Mongoose** | The data is document-shaped — a project page has a list of images with positions, a list of captions with positions. That maps poorly to relational tables but perfectly to MongoDB documents. Mongoose adds typed schemas on top. |
| **JWT auth** | Stateless — no server-side session storage. The token contains the user ID; the server just verifies the signature. |
| **bcrypt** | Industry-standard password hashing. Slow by design, salt-per-password. |
| **Multer** | Handles `multipart/form-data` for image uploads. |
| **Supabase Storage** | Hosted file storage with public URLs. Free tier is enough for a senior project. Avoids me having to run S3 or set up disk-based file storage. |
| **Google Auth Library** | Verifies Google OAuth ID tokens server-side so I can trust the user's email. |

### What's NOT used (and why)
- **No Redux / Zustand** — React Context is enough for auth state; everything else is page-local.
- **No Stripe (yet)** — Real payment requires merchant verification, business address, etc. The checkout has a fully working "simulated" payment path with the right schema, so swapping in Stripe later is a small change.
- **No SSR / Next.js** — This is an interactive editor, not a content site. No SEO needs. Plain SPA is simpler.

---

## 3. Architecture

```
┌─────────────────────┐         HTTP/JSON          ┌─────────────────────┐
│   Frontend (React)  │  ◄───────────────────────► │  Backend (Express)  │
│   localhost:5173    │                            │   localhost:3001    │
└─────────────────────┘                            └─────────┬───────────┘
                                                             │
                                                  ┌──────────┴──────────┐
                                                  │                     │
                                            ┌─────▼──────┐      ┌──────▼──────┐
                                            │  MongoDB   │      │  Supabase   │
                                            │   Atlas    │      │   Storage   │
                                            │ (cluster)  │      │  (bucket)   │
                                            └────────────┘      └─────────────┘
```

- **Frontend** sends JSON to the backend over `fetch`. It carries either a JWT (`Authorization: Bearer ...`) or a guest ID header (`x-guest-id: <uuid>`).
- **Backend** validates auth, talks to MongoDB for structured data and Supabase Storage for file blobs.
- **MongoDB Atlas** holds users, templates, projects, cart items, favorites, and orders.
- **Supabase Storage** holds the actual JPEG/PNG bytes — MongoDB only stores the public URL.

This separation matters: photos can be megabytes each. Putting them in MongoDB would be slow and expensive. Putting URLs in MongoDB and bytes in object storage is the standard pattern.

---

## 4. Database Schema (MongoDB Collections)

### `users`
```js
{
  _id, name, email, passwordHash (or null for Google-only),
  googleId (or null), avatar, createdAt, updatedAt
}
```

### `templates`
```js
{
  _id, name, category, style, price, description, image,
  theme: { colorPalette, fontFamily, accentFont, borderStyle, ... },
  pages: [{ layout, placeholders, rotations: [Number] }]
}
```
The `rotations` array is what makes templates feel hand-made — each photo slot has a tilt angle, so the page looks like scattered polaroids instead of a perfect grid.

### `projects`
```js
{
  _id, user (or null), guestId (or null),
  title, bookSize, bookType, templateId (or null), status,
  pages: [{
    layout: 'single'|'double'|'collage'|'free',
    backgroundColor,
    images: [{ url, x, y, width, height, rotation, zIndex, position }],
    captions: [{ text, x, y, width, rotation, zIndex, fontSize, fontFamily, color, align }]
  }]
}
```
A project is owned by either a `user` OR a `guestId` — never both. This is what enables the guest-to-user migration. The `pages` array is what the user actually designs.

### `cartItems`
```js
{ _id, user (or null), guestId (or null), project, template, itemType, quantity, price }
```

### `favorites`
```js
{ _id, user (or null), guestId (or null), template }
```

### `orders`
```js
{
  _id, user (or null), guestId (or null), orderNumber,
  items: [{ itemType, name, image, quantity, price, snapshot }],
  subtotal, shipping, tax, total,
  shippingAddress: {...},
  payment: { method, last4, brand, cardName },
  status: 'pending'|'paid'|'shipped'|'delivered'|'cancelled'
}
```

The `snapshot` field is important: when you order a project, the entire project state (pages, images, layout) is copied into the order. That way if you later edit or delete the project, the order still shows what was actually purchased.

---

## 5. Authentication and User Management

### Three identity states

1. **Pure guest** — no token, no `guestId`. First time visitors. The app immediately generates a UUID and saves it in `localStorage` as `guestId`.

2. **Guest with data** — has a `guestId` but no token. All API requests include the header `x-guest-id: <uuid>`. Cart, projects, and favorites get attributed to this guest ID.

3. **Logged-in user** — has a JWT token in `localStorage`. Requests include `Authorization: Bearer <jwt>`. The `optionalAuth` middleware decodes the token and sets `req.userId`.

### Middleware
- `requireAuth` — rejects requests without a valid JWT.
- `optionalAuth` — accepts both signed-in users and guests; sets either `req.userId` or `req.guestId`.

Most routes use `optionalAuth` so guests can use the app freely; only checkout enforces auth.

### Google OAuth flow
1. User clicks "Sign in with Google" → Google's button triggers a popup.
2. Google returns an ID token (JWT signed by Google) to the frontend.
3. Frontend POSTs the token to `/api/auth/google`.
4. Backend uses `google-auth-library` to verify the token's signature against Google's public keys, extract the email and Google ID.
5. Backend either creates a new user or signs in an existing one, then issues its own JWT.

### Password flow
1. Register: POST `/api/auth/register` with `name, email, password`.
2. Backend hashes the password with bcrypt (10 rounds), stores `passwordHash`.
3. Login: POST `/api/auth/login` → bcrypt-compare, issue JWT.

### Guest-to-user migration
When a guest signs up or logs in, the backend:
1. Looks up any cart items, projects, and favorites where `guestId` matches the request header.
2. Reassigns them: sets `user = newUserId`, clears `guestId`.

So nothing the user did as a guest is lost when they create an account.

---

## 6. Photo Album Templates

Five hand-designed templates: Classic Baby, Modern Minimal, Floral Garden, Woodland Adventure, Bright & Bold. Each defines:
- A color palette (5 hues)
- A font family + accent font
- A border style
- A list of pages, each with a layout (`single`, `double`, `collage`) and a `rotations` array

The `rotations` is the key visual touch — instead of every photo sitting in a perfect rectangle, each one is tilted. Bright & Bold uses ±10° for a chaotic playful look; Modern Minimal uses 0° for clean lines.

When a user loads a template, the project page is created with empty image *placeholders* — one per slot, each carrying the slot's rotation. As the user uploads photos and clicks them, they fill the empty placeholders in order, inheriting the tilt.

Templates are seeded into MongoDB with `npm run seed` from the backend. The seed script wipes existing templates and re-inserts the 5, so it's safe to re-run anytime.

---

## 7. The Design Page

This is the most complex screen in the app. It supports two modes:

### Grid mode (templates)
The photos snap into pre-defined slots arranged in CSS Grid. Each slot has a rotation. You can pick photos from your uploaded library and they fill the next empty slot.

### Free mode (Design Your Own)
There's no grid. Photos and stickers float on the page at any (x, y, width, height, rotation) you want. They can overlap, layer, tilt, anything.

### Both modes share
- **Captions / stickers** — these are free-positioned in *both* modes. Even on a template, you can drag a sticker on top of a tilted photo.
- **Auto-save** — every change debounces a save to the backend after 2 seconds. There's also a manual Save button.
- **Page management** — add, delete, reorder pages.
- **Background color** — every page has a custom color (full hex picker).

### Stickers
A library of 48 emojis (hearts, baby items, animals, flowers, balloons, etc.). Clicking one drops it on the page as a free-positioned text element. Internally a sticker is just a "caption" with a giant font size.

---

## 8. Free-form Editor: Drag, Resize, Rotate

This was the hardest part of the app to get right. The math behind resizing a *rotated* image is non-obvious.

### The data model
Each free-form item stores `{ x, y, width, height, rotation }` as percentages of the canvas (0–100). Storing percentages instead of pixels makes the design responsive — it looks the same on any screen size.

### Drag (move)
Easy. Capture pointer-down position, listen for pointer-move, compute pixel delta, convert to percentage, update `x` and `y`. Works at any rotation because we're just translating the whole element.

### Rotate
A round handle sits 28px above the item. Drag it. Compute the angle from the item's center to the pointer with `Math.atan2(dy, dx)`. Add 90° (because the handle starts at top, not right). Update `rotation`.

### Resize (the hard part)
When the item is rotated, you can't just add the pointer delta to `width` and `height` — that resizes in screen space, not in the item's own (rotated) frame. The visual effect is wrong: dragging the bottom-right handle of a 45° rotated photo would make it skew oddly.

The right behavior: the *opposite corner* should stay pinned in place while the dragged corner follows the pointer.

The math:
1. Find the world-space position of the opposite corner before drag — this stays fixed.
2. Find the pointer position in canvas pixel coordinates.
3. The vector from opposite corner to pointer, *de-rotated* by `-rotation`, gives the new width and height in the item's local frame.
4. Compute the new center as `opposite + R(rotation) × (newWidth/2, newHeight/2)`.
5. Convert back to top-left + width + height in percentage.

That code lives in `frontend/src/pages/DesignPage.jsx` inside the `FreeItem` component, in the `onMove` handler under `s.mode === 'resize'`.

### Selection and layering
Click any item to select it. Selected items show:
- A colored outline
- 4 corner resize handles (or 2 for captions, since they auto-size by content)
- A rotation handle on top
- A toolbar with bring-forward / send-backward / delete

Layering uses a `zIndex` property on each item. Bring-forward / send-back swaps the zIndex of the selected item with the item directly above/below it in the z-order.

### Why pointer events instead of `react-dnd` or a library
Pointer events are native, work for both mouse and touch, and give precise control over the drag math. A library would add bundle size and constrain the rotated-resize math.

---

## 9. Photo Upload Pipeline

1. User picks files in the `<input type="file">`.
2. Frontend POSTs to `/api/uploads` as `multipart/form-data`.
3. Backend (Multer + memory storage) receives the buffers — never writes to local disk.
4. For each file, the backend generates a UUID-based filename (`uploads/<uuid>.jpg`) and uploads to Supabase Storage's `album-photos` bucket.
5. Supabase returns a public URL.
6. Backend returns `[{ url, filename, size }, ...]`.
7. Frontend adds those URLs to the user's image library; the user clicks them to add to a page.

If Supabase is unavailable, the frontend falls back to `URL.createObjectURL(file)` — a blob URL that works in the current tab session only. Useful for offline dev but the URLs die when the tab closes.

---

## 10. Cart and Checkout

### Cart
- A `CartItem` is one row pointing at either a project or a template, with a quantity and a price.
- Same guest/user ownership model as everything else.
- The cart page lists items, lets you change quantities or remove, and shows a subtotal.

### Checkout (`/checkout`)
- Requires login. Guests get prompted to create an account.
- Shipping address form (name, email, two address lines, city, state, ZIP, optional phone).
- Payment form (account holder, account number, valid through, security code) — labeled generically to avoid Chrome's "this connection is not secure" warning, since localhost is HTTP. The fields still validate as a real card would (13–19 digits, expiry not in past, 3–4 digit CVC).
- Frontend validates → POSTs to `/api/orders` with `{ shippingAddress, payment: { cardName, cardNumber } }`.

### Order creation (server-side)
1. Verify shipping fields are present.
2. Verify card number is 13–19 digits.
3. Pull the user's cart from MongoDB.
4. Build order items with snapshots of each project's pages.
5. Compute totals (currently subtotal + shipping + tax — all set to 0 in test mode).
6. Detect card brand from BIN (4xxx = Visa, 5xxx = Mastercard, 3[47]xx = Amex).
7. Save the order with `status: 'paid'` and store last 4 digits + brand only — never the full card number.
8. Mark the linked projects as `status: 'ordered'`.
9. Empty the cart.
10. Return the order.

### Test mode
Right now all prices are zeroed (`subtotal = 0, shipping = 0, tax = 0, total = $0.00`) so the checkout flow can be exercised end-to-end without real money. Search the codebase for `TEST MODE` to find the four spots to revert.

### Order history
`/orders` lists every order placed by the current user (or guest), sorted newest first, with status badges. Click one to see the full receipt.

---

## 11. Frontend Routes

| Route | Page |
|---|---|
| `/` | Home page (marketing) |
| `/templates` | Browse the 5 templates |
| `/design` | Design Your Own (free mode) |
| `/design?templateId=...` | Edit a project from a template |
| `/design?projectId=...` | Re-open an existing project |
| `/ai-create` | (placeholder for future AI-arrange feature) |
| `/preview/:id` | Read-only preview of a project |
| `/cart` | Shopping cart |
| `/checkout` | Shipping + payment form |
| `/order/:id` | Order confirmation |
| `/orders` | Order history |
| `/favorites` | Saved templates |

---

## 12. File Structure

```
backend/
  src/
    index.js                ← Express app + Mongo connection
    middleware/
      auth.js               ← requireAuth, optionalAuth
    models/
      User.js, Template.js, Project.js,
      CartItem.js, Order.js, Favorite.js
    routes/
      auth.js, templates.js, projects.js,
      uploads.js, cart.js, favorites.js, orders.js
    scripts/
      seed.js               ← Populates 5 templates

frontend/
  src/
    main.jsx                ← React entry
    App.jsx                 ← Routes + AuthProvider + Footer
    context/
      AuthContext.jsx       ← Auth state, login/register/logout
    lib/
      api.js                ← fetch wrapper that injects auth headers
    pages/
      HomePage.jsx, TemplatesPage.jsx, DesignPage.jsx,
      PreviewPage.jsx, CartPage.jsx, FavoritesPage.jsx,
      CheckoutPage.jsx, OrderConfirmationPage.jsx, OrdersPage.jsx
    app/
      components/ui/        ← Navbar, AuthModal
      ui/                   ← Button, Card primitives
    styles/index.css        ← Tailwind directives

PROJECT_DOCUMENTATION.md    ← This file
README.md
```

---

## 13. Setup and Run

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster (free M0 tier is fine — but it auto-pauses after 7 days of inactivity)
- A Supabase project with a public `album-photos` bucket
- A Google Cloud OAuth client ID (for "Sign in with Google")

### Backend `.env`
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<random-long-string>
GOOGLE_CLIENT_ID=...
SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
CLIENT_URL=http://localhost:5173
PORT=3001
```

### Commands
```bash
# One-time
cd backend && npm install
cd frontend && npm install
cd backend && npm run seed   # Populate templates

# Run (two terminals)
cd backend && npm run dev    # http://localhost:3001
cd frontend && npm run dev   # http://localhost:5173
```

---

## 14. What's Done vs. Not Done

### Done
- Full auth (guest, email/password, Google)
- 5 templates with rotated photo slots
- Design page with both grid mode and free mode
- Drag, resize, rotate, layer for photos and stickers
- 48-emoji sticker library
- Per-page custom background colors (full picker)
- Auto-save (2s debounce) + manual save
- Photo upload to Supabase
- Project preview
- Cart + favorites
- Checkout with validation (simulated payment)
- Order creation, confirmation page, order history
- Guest-to-user data migration on signup

### Not done (intentional scope cuts)
- **Real payment processing** — Stripe integration is a single API call away but requires merchant onboarding.
- **AI auto-arrange** (`/ai-create` route) — placeholder banner; no actual AI logic.
- **Admin / fulfillment dashboard** — orders go in, but there's no operator side to mark them shipped or generate the printable PDF.
- **Email notifications** — confirmation page says one was sent, but no SMTP integration.
- **Album PDF generation** — for physical printing, the design would need to be exported to a print-ready PDF.

---

## 15. Common Defense Questions and How to Answer

### "Walk me through what happens when a user uploads a photo."
1. They click the file input on the Design page.
2. The frontend POSTs the file as `multipart/form-data` to `/api/uploads`, with their guest ID or JWT in the headers.
3. The Express server uses Multer to receive the file in memory (no temp disk write).
4. The server generates a UUID filename and uploads the file buffer to Supabase Storage's `album-photos` bucket using the service-role key.
5. Supabase returns a public URL.
6. The server returns `{ url, filename, size }` to the frontend.
7. The frontend adds that URL to the user's image library.
8. When the user clicks the image to place it on a page, the URL is saved into the project's `pages[].images[]` in MongoDB.

### "Why did you choose MongoDB over a relational database?"
The data is naturally document-shaped. A project page has a variable-length list of images, each with positional data, plus a list of captions. Modeling that in SQL would mean a `pages` table, an `images` table joined to pages, a `captions` table joined to pages, and a lot of JOINs to read one project. In MongoDB, a project is a single document — one query gets everything needed to render the editor. There's no concept of "schema migration when I add a field to an image" because the schema is in Mongoose, not the database.

### "How do you handle the case where the same person uses your app as a guest and then signs up — do they lose their data?"
No. While they're a guest, every cart item, project, and favorite gets a `guestId` from their browser's localStorage. When they register or log in, the backend looks up everything tied to that `guestId` and reassigns it to their new `user` ID. The next page load shows them all their guest data, now permanently in their account.

### "How does authentication work? Are you using sessions?"
JWT, not sessions. After login, the server signs a token containing the user ID and returns it. The frontend stores it in localStorage. Every subsequent request includes it as `Authorization: Bearer <token>`. The server only needs to verify the signature (no database lookup, no session store). For guests, there's no token — instead a `x-guest-id` header carries a UUID generated on first visit.

### "How do you store passwords?"
With bcrypt, 10 rounds. Bcrypt is slow on purpose (computationally expensive) which makes brute-force attacks impractical. Each password gets a unique salt baked into the stored hash. Plain passwords never touch the database.

### "What happens if someone changes their browser, do they lose their guest data?"
Yes — the `guestId` only lives in that browser's localStorage. This is by design: guest data is intentionally ephemeral; if you want it permanent, you make an account. The "Sign in to save your work" prompt in the cart page nudges them toward that.

### "Walk me through the math for resizing a rotated image."
You can't just add pointer delta to width and height when the image is rotated — the result skews. The proper way: keep the *opposite corner* fixed in world space. Compute its world position before the drag. During the drag, take the vector from that fixed corner to the pointer, de-rotate it by the negative of the image's rotation, and the resulting vector's components are the new width and height in the image's local frame. Then compute the new center so the fixed corner stays put, and convert back to top-left + width + height. The code is in `DesignPage.jsx` in the `FreeItem` component's `onMove` handler.

### "Why do you store positions as percentages instead of pixels?"
So the design is responsive. The canvas might be 600px wide on desktop and 320px wide on mobile, but if a photo is at `x: 25%`, it stays in the same proportional spot on every screen. The free-form editor converts pointer pixel deltas to percentages on the fly.

### "Why is the payment form not real Stripe?"
Two reasons. First, real Stripe requires a verified merchant account with business address, tax ID, etc., which doesn't apply here. Second, the abstraction is already in place: the backend's `routes/orders.js` accepts a payment object, validates the card number format, detects the brand, and stores the last 4 digits — exactly what a Stripe webhook handler would do. Replacing the simulated branch with a `stripe.charges.create()` call is a one-function change.

### "What are the security risks here and how have you mitigated them?"
- **Password storage:** bcrypt-hashed, never stored or logged in plaintext.
- **JWT secrets:** stored in `.env`, not committed to git.
- **CORS:** backend only accepts requests from `CLIENT_URL`.
- **File uploads:** restricted by MIME type to images, 10MB limit per file, max 20 files per request.
- **Card data:** only the last 4 digits are stored. Never the full PAN, never the CVC.
- **Authorization:** every protected resource checks ownership before responding (cart, projects, orders all verify the requester owns the resource).
- **NoSQL injection:** Mongoose schemas validate types, so passing `{$ne: null}` as a username won't bypass auth.

### "What would you do differently if you started over?"
- Use TypeScript end-to-end. The image and caption schemas have many optional fields, and TS would have caught a few bugs at compile time instead of runtime.
- Use a real component library for form inputs. The shipping/payment form has hand-rolled validation; libraries like React Hook Form would be cleaner.
- Build the order/admin side earlier. Right now orders go in but there's no operator UI to fulfill them.

### "How would this scale to a million users?"
- MongoDB Atlas can shard horizontally if needed; projects collection would shard on `user`.
- Photo uploads already go to object storage (Supabase / could swap to S3 + CloudFront), which scales independently.
- The backend is stateless (JWT auth, no sessions), so horizontal scaling is just spinning up more Express instances behind a load balancer.
- The auto-save endpoint is the highest-frequency write — would benefit from request coalescing (one save per project per N seconds enforced server-side).

### "What's the biggest technical challenge you faced?"
The free-form editor — specifically resizing rotated images correctly while keeping the opposite corner pinned. The naive approach (adding pointer delta to width/height) causes the image to skew when rotated. Working out the right math meant computing in the rotated local frame and converting back. The same challenge applied to making the rotation handle feel intuitive — using `atan2` from item center to pointer, with a 90° offset because the handle sits above the item.

### "How do you handle a user editing a project after they ordered it?"
The order stores a snapshot (`order.items[].snapshot`) of the project at purchase time — including all pages, image URLs, and captions. Even if the user later deletes or modifies the project, the order's confirmation page renders from the snapshot, not the live project. This is why orders are immutable from the user's perspective.

### "What happens if MongoDB goes down?"
Backend `mongoose.connect` fails on startup → `process.exit(1)`. In a hosted setup, the orchestrator would restart it. For runtime failures, individual route handlers catch errors and return 500s; the frontend shows error states. There's no offline mode for writes — the frontend would need to queue them and replay, which is out of scope.

### "Why React Router and not Next.js?"
Next.js shines for content-heavy sites that benefit from server-side rendering and SEO. This app is an interactive editor — most of the value is on the design page, which is purely client-side anyway. SSR would add complexity (special handling for `localStorage`, hydration mismatches with the editor's pointer event handlers) without any user-facing benefit.

### "Why did you put captions and stickers in the same backend field?"
A sticker is a caption with an emoji as its `text` and a large `fontSize`. Both are free-positioned text elements — same drag/rotate/resize behavior, same render code. Splitting them would be duplicating the schema and the renderer. The frontend has a separate "Stickers" tab for UX but the underlying data is unified.

### "Why are some templates more tilted than others?"
Each template has a different design language. Modern Minimal uses 0° rotation across all slots — clean, contemporary look. Classic Baby uses ±2° — barely-noticeable tilts that feel hand-placed. Bright & Bold uses ±10° — chaotic and playful. The seed file (`backend/src/scripts/seed.js`) defines the rotation arrays per template.

---

## 16. What I Learned

- **Closure traps in React event handlers** — when adding `pointermove` listeners to `document` from inside a component, you have to be careful about stale references. I used refs to keep stable handler identities.
- **Math beats libraries for niche problems** — there were drag/resize libraries available, but writing the rotated-resize math by hand gave better results and saved bundle size.
- **Schema decisions pay compound interest** — storing positions as percentages from day one made everything responsive for free. Storing them as pixels would have caused weeks of rework later.
- **Guest mode is a real UX feature** — making the app fully usable without an account, then offering migration on signup, is a bigger user-experience win than gating everything behind login.
- **"Test mode" flags are worth keeping clean** — the four `TEST MODE` comments make it trivial to grep and revert when going live.

---
