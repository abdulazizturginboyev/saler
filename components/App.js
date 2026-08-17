'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const UNITS = ['dona', 'kg', 'metr', 'qop', 'litr', 'm²', 'm³', 'tonna'];

function money(n) {
  return Math.round(n || 0).toLocaleString('ru-RU').replace(/,/g, ' ') + " so'm";
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStr() {
  return new Date().toISOString().slice(0, 7);
}

const ICONS = {
  home: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
    </svg>
  ),
  products: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" />
    </svg>
  ),
  sale: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" />
      <path d="M2 3h3l2.4 12.2a2 2 0 002 1.8h8.2a2 2 0 002-1.6L21 7H6" />
    </svg>
  ),
  debts: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="3.3" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  ),
  report: (
    <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V10M12 20V4M20 20v-7" />
    </svg>
  ),
};

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = logged out
  const [toast, setToast] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1700);
  }, []);

  if (session === undefined) {
    return <div className="loading">Yuklanmoqda...</div>;
  }
  if (!session) {
    return <LoginScreen onError={showToast} />;
  }
  return <MainApp session={session} showToast={showToast} toast={toast} />;
}

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErr("Email yoki parol noto'g'ri");
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-mark">S</div>
        <h1>Saler</h1>
        <p>Magazin hisobiga kirish uchun email va parolingizni kiriting.</p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Parol</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="save-btn" type="submit" disabled={loading}>
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
          {err && <div className="login-error">{err}</div>}
        </form>
        <p className="hint">
          Hisobingiz yo'qmi? Supabase loyihangizdagi Authentication → Users bo'limidan o'zingiz uchun foydalanuvchi yarating.
        </p>
      </div>
    </div>
  );
}

function MainApp({ session, showToast, toast }) {
  const ownerId = session.user.id;
  const [view, setView] = useState('home');
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [debts, setDebts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cart, setCart] = useState({});
  const [modal, setModal] = useState(null); // {type, payload}

  const loadAll = useCallback(async () => {
    setLoadingData(true);
    const [p, s, d, e] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false }),
      supabase.from('debts').select('*').order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.data) setProducts(p.data);
    if (s.data) setSales(s.data);
    if (d.data) setDebts(d.data);
    if (e.data) setExpenses(e.data);
    setLoadingData(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  if (loadingData) return <div className="loading">Ma'lumotlar yuklanmoqda...</div>;

  return (
    <div id="shell">
      {toast && <div className="toast show">{toast}</div>}
      <header>
        <div className="brand">
          <div className="mark">S</div>
          <div>
            <h1>Saler</h1>
            <div className="date">
              {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>
        <button className="logout" onClick={logout}>Chiqish</button>
      </header>

      <main>
        {view === 'home' && (
          <HomeView products={products} sales={sales} expenses={expenses} debts={debts}
            onQuick={(v) => (v === 'sale' ? setView('sale') : setModal({ type: v }))} />
        )}
        {view === 'products' && (
          <ProductsView products={products} onAdd={() => setModal({ type: 'add-product' })}
            onOpen={(p) => setModal({ type: 'edit-product', payload: p })} />
        )}
        {view === 'sale' && (
          <SaleView products={products} cart={cart} setCart={setCart}
            onSold={async (items, total, profit) => {
              const { data: saleRow, error: saleErr } = await supabase
                .from('sales').insert({ owner_id: ownerId, total, profit }).select().single();
              if (saleErr) { showToast('Xatolik: sotuv saqlanmadi'); return; }
              const itemsPayload = items.map((it) => ({
                owner_id: ownerId, sale_id: saleRow.id, product_id: it.productId,
                name: it.name, qty: it.qty, price: it.price, buy_price: it.buyPrice, total: it.total,
              }));
              await supabase.from('sale_items').insert(itemsPayload);
              for (const it of items) {
                const p = products.find((x) => x.id === it.productId);
                if (p) await supabase.from('products').update({ stock: Math.max(0, p.stock - it.qty) }).eq('id', p.id);
              }
              setCart({});
              showToast('Sotuv saqlandi: ' + money(total));
              loadAll();
            }} />
        )}
        {view === 'debts' && (
          <DebtsView debts={debts} onAdd={() => setModal({ type: 'add-debt' })}
            onOpen={(d) => setModal({ type: 'debt-detail', payload: d })} />
        )}
        {view === 'report' && <ReportView sales={sales} expenses={expenses} />}
      </main>

      <nav>
        {['home', 'products', 'sale', 'debts', 'report'].map((v) => (
          <button key={v} className={view === v ? 'active' : ''} onClick={() => { setCart({}); setView(v); }}>
            {ICONS[v]}
            <span className="lb">
              {{ home: 'Bosh sahifa', products: 'Tovarlar', sale: 'Sotuv', debts: 'Qarzlar', report: 'Hisobot' }[v]}
            </span>
          </button>
        ))}
      </nav>

      {modal?.type === 'add-product' && (
        <AddProductModal ownerId={ownerId} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast("Tovar qo'shildi"); loadAll(); }} />
      )}
      {modal?.type === 'edit-product' && (
        <EditProductModal ownerId={ownerId} product={modal.payload} onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); showToast(msg); loadAll(); }} />
      )}
      {modal?.type === 'income' && (
        <IncomeModal ownerId={ownerId} products={products} onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); showToast(msg); loadAll(); }} />
      )}
      {modal?.type === 'expense' && (
        <ExpenseModal ownerId={ownerId} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast("Xarajat qo'shildi"); loadAll(); }} />
      )}
      {modal?.type === 'add-debt' && (
        <AddDebtModal ownerId={ownerId} onClose={() => setModal(null)}
          onSaved={() => { setModal(null); showToast("Qarzdor qo'shildi"); loadAll(); }} />
      )}
      {modal?.type === 'debt-detail' && (
        <DebtDetailModal ownerId={ownerId} debt={modal.payload} onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); showToast(msg); loadAll(); }} />
      )}
    </div>
  );
}

/* ---------------- HOME ---------------- */
function HomeView({ products, sales, expenses, debts, onQuick }) {
  const t = todayStr();
  const todaySales = sales.filter((s) => s.created_at.slice(0, 10) === t);
  const todayTotal = todaySales.reduce((a, s) => a + Number(s.total), 0);
  const todayProfit = todaySales.reduce((a, s) => a + Number(s.profit), 0);
  const todayExpenses = expenses.filter((e) => e.created_at.slice(0, 10) === t).reduce((a, e) => a + Number(e.amount), 0);
  const totalDebt = debts.reduce((a, d) => a + Number(d.amount), 0);
  const low = products.filter((p) => p.min_stock != null && p.stock <= p.min_stock);

  return (
    <>
      <h2 className="title">Bosh sahifa</h2>
      <div className="grid2">
        <div className="card"><div className="stat-label">Bugungi savdo</div><div className="stat-value">{money(todayTotal)}</div></div>
        <div className="card"><div className="stat-label">Bugungi foyda</div><div className="stat-value green">{money(todayProfit)}</div></div>
        <div className="card"><div className="stat-label">Bugungi xarajat</div><div className="stat-value red">{money(todayExpenses)}</div></div>
        <div className="card"><div className="stat-label">Umumiy qarz</div><div className="stat-value red">{money(totalDebt)}</div></div>
      </div>

      <div className="section-label">Tezkor amallar</div>
      <div className="qbtn-row">
        <button className="qbtn" onClick={() => onQuick('sale')}><span className="plus">+</span>Sotuv</button>
        <button className="qbtn" onClick={() => onQuick('add-product')}><span className="plus">+</span>Tovar</button>
        <button className="qbtn" onClick={() => onQuick('income')}><span className="plus">+</span>Tovar kirimi</button>
        <button className="qbtn" onClick={() => onQuick('expense')}><span className="plus">+</span>Xarajat</button>
      </div>

      <div className="section-label">Kam qolgan tovarlar</div>
      <div className="card">
        {low.length ? low.map((p) => (
          <div className="low-item" key={p.id}><span><b>{p.name}</b></span><span className="tag">{p.stock} {p.unit} qoldi</span></div>
        )) : <div className="empty">Kam qolgan tovar yo'q</div>}
      </div>
    </>
  );
}

/* ---------------- PRODUCTS ---------------- */
function ProductThumb({ product, size }) {
  const style = size ? { width: size, height: size } : undefined;
  if (product.image_url) {
    return <div className="prod-ic" style={style}><img src={product.image_url} alt={product.name} /></div>;
  }
  return <div className="prod-ic" style={style}>{(product.name[0] || '?').toUpperCase()}</div>;
}

function ProductsView({ products, onAdd, onOpen }) {
  const [q, setQ] = useState('');
  const list = products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <>
      <h2 className="title">Tovarlar</h2>
      <div className="searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        <input placeholder="Tovar qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {list.length ? list.map((p) => (
          <div className="prod-row" key={p.id} onClick={() => onOpen(p)}>
            <ProductThumb product={p} />
            <div className="prod-info">
              <div className="prod-name">{p.name}</div>
              <div className="prod-sub">{p.category || 'Kategoriyasiz'}</div>
            </div>
            <div>
              <div className="prod-price">{money(p.sell_price)}</div>
              <div className={'prod-stock' + (p.min_stock != null && p.stock <= p.min_stock ? ' low' : '')}>{p.stock} {p.unit}</div>
            </div>
          </div>
        )) : <div className="empty">Tovar topilmadi</div>}
      </div>
      <button className="fab" onClick={onAdd}>+</button>
    </>
  );
}

/* ---------------- SALE ---------------- */
function SaleView({ products, cart, setCart, onSold }) {
  const [q, setQ] = useState('');
  const list = products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const cartIds = Object.keys(cart).filter((id) => cart[id] > 0);
  let total = 0;
  cartIds.forEach((id) => {
    const p = products.find((x) => x.id === id);
    if (p) total += p.sell_price * cart[id];
  });

  const inc = (p) => {
    const cur = cart[p.id] || 0;
    if (cur < p.stock) setCart({ ...cart, [p.id]: cur + 1 });
  };
  const dec = (id) => setCart({ ...cart, [id]: Math.max(0, (cart[id] || 0) - 1) });

  const sell = () => {
    const items = cartIds.map((id) => {
      const p = products.find((x) => x.id === id);
      return { productId: id, name: p.name, qty: cart[id], price: p.sell_price, buyPrice: p.buy_price, total: p.sell_price * cart[id] };
    });
    if (!items.length) return;
    let profit = 0;
    items.forEach((it) => { profit += (it.price - it.buyPrice) * it.qty; });
    onSold(items, total, profit);
  };

  return (
    <>
      <h2 className="title">Sotuv</h2>
      <div className="searchbar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" /></svg>
        <input placeholder="Tovar qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="card" style={{ padding: '4px 12px', maxHeight: 340, overflowY: 'auto' }}>
        {list.length ? list.map((p) => {
          const qty = cart[p.id] || 0;
          return (
            <div className="sale-item" key={p.id}>
              <ProductThumb product={p} />
              <div className="prod-info">
                <div className="prod-name">{p.name}</div>
                <div className="prod-sub">{money(p.sell_price)} / {p.unit} &middot; qoldiq: {p.stock}</div>
              </div>
              <div className="stepper">
                <button onClick={() => dec(p.id)}>−</button>
                <span>{qty}</span>
                <button onClick={() => inc(p)}>+</button>
              </div>
            </div>
          );
        }) : <div className="empty">Tovar yo'q</div>}
      </div>
      <div className="cart-total">
        <button className="sell-btn" disabled={!cartIds.length} onClick={sell}>
          <span>Sotish</span><span>{money(total)}</span>
        </button>
      </div>
    </>
  );
}

/* ---------------- DEBTS ---------------- */
function DebtsView({ debts, onAdd, onOpen }) {
  const total = debts.reduce((a, d) => a + Number(d.amount), 0);
  return (
    <>
      <h2 className="title">Qarzlar</h2>
      <div className="card"><div className="stat-label">Umumiy qarzdorlik</div><div className="stat-value red">{money(total)}</div></div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {debts.length ? debts.map((d) => (
          <div className="debt-row" key={d.id} onClick={() => onOpen(d)}>
            <div>
              <div className="debt-name">{d.name}</div>
              {d.phone && <div className="debt-phone">{d.phone}</div>}
            </div>
            <div className="debt-amt">{money(d.amount)}</div>
          </div>
        )) : <div className="empty">Qarzdorlar yo'q</div>}
      </div>
      <button className="fab" onClick={onAdd}>+</button>
    </>
  );
}

/* ---------------- REPORT ---------------- */
function ReportView({ sales, expenses }) {
  const [tab, setTab] = useState('today');
  const t = todayStr(), m = monthStr();
  const todaySales = sales.filter((s) => s.created_at.slice(0, 10) === t);
  const monthSales = sales.filter((s) => s.created_at.slice(0, 7) === m);
  const todayExp = expenses.filter((e) => e.created_at.slice(0, 10) === t).reduce((a, e) => a + Number(e.amount), 0);
  const monthExp = expenses.filter((e) => e.created_at.slice(0, 7) === m).reduce((a, e) => a + Number(e.amount), 0);

  const data = tab === 'today'
    ? { savdo: todaySales.reduce((a, s) => a + Number(s.total), 0), foyda: todaySales.reduce((a, s) => a + Number(s.profit), 0), xarajat: todayExp, soni: todaySales.length }
    : { savdo: monthSales.reduce((a, s) => a + Number(s.total), 0), foyda: monthSales.reduce((a, s) => a + Number(s.profit), 0), xarajat: monthExp, soni: monthSales.length };

  return (
    <>
      <h2 className="title">Hisobot</h2>
      <div className="tabbar">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>Bugungi</button>
        <button className={tab === 'month' ? 'active' : ''} onClick={() => setTab('month')}>Oylik</button>
      </div>
      <div className="grid2">
        <div className="card"><div className="stat-label">Savdo</div><div className="stat-value">{money(data.savdo)}</div></div>
        <div className="card"><div className="stat-label">Foyda</div><div className="stat-value green">{money(data.foyda)}</div></div>
        <div className="card"><div className="stat-label">Xarajat</div><div className="stat-value red">{money(data.xarajat)}</div></div>
        <div className="card"><div className="stat-label">Sotuvlar soni</div><div className="stat-value">{data.soni}</div></div>
      </div>
      <div className="section-label">So'nggi xarajatlar</div>
      <div className="card">
        {expenses.slice(0, 6).length ? expenses.slice(0, 6).map((e) => (
          <div className="low-item" key={e.id}><span><b>{e.name}</b> &middot; {e.created_at.slice(0, 10)}</span><span>{money(e.amount)}</span></div>
        )) : <div className="empty">Xarajatlar yo'q</div>}
      </div>
    </>
  );
}

/* ---------------- MODALS ---------------- */
function ModalShell({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head"><h3>{title}</h3><button onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}

async function uploadProductImage(ownerId, productId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${ownerId}/${productId}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

function ImagePicker({ file, setFile, currentUrl }) {
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
      <div className="prod-ic" style={{ width: 56, height: 56 }}>
        {previewUrl ? <img src={previewUrl} alt="" /> : '📷'}
      </div>
      <label style={{ margin: 0, flex: 1 }}>
        <span className="save-btn" style={{ margin: 0, display: 'inline-block', width: '100%', textAlign: 'center', boxSizing: 'border-box', background: 'var(--surface)', color: 'var(--fg)', fontWeight: 700, cursor: 'pointer' }}>
          {previewUrl ? 'Rasmni almashtirish' : 'Rasm tanlash'}
        </span>
        <input type="file" accept="image/*" style={{ display: 'none' }}
          onChange={(e) => setFile(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}

function AddProductModal({ ownerId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [minStock, setMinStock] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { data: row, error } = await supabase.from('products').insert({
      owner_id: ownerId, name: name.trim(), category: category.trim(),
      buy_price: Number(buyPrice) || 0, sell_price: Number(sellPrice) || 0,
      stock: Number(stock) || 0, unit, min_stock: minStock === '' ? null : Number(minStock),
    }).select().single();

    if (!error && row && file) {
      try {
        const url = await uploadProductImage(ownerId, row.id, file);
        await supabase.from('products').update({ image_url: url }).eq('id', row.id);
      } catch (e) {
        // Tovar saqlandi, lekin rasm yuklanmadi — foydalanuvchi keyinroq tahrirlab qo'sha oladi
      }
    }
    setSaving(false);
    onSaved();
  };

  return (
    <ModalShell title="Tovar qo'shish" onClose={onClose}>
      <label>Tovar rasmi</label>
      <ImagePicker file={file} setFile={setFile} currentUrl={null} />
      <label>Tovar nomi</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Sement M500" />
      <label>Kategoriya</label><input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Masalan: Qurilish aralashmalari" />
      <div className="row2">
        <div><label>Kelish narxi</label><input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" /></div>
        <div><label>Sotish narxi</label><input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="0" /></div>
      </div>
      <div className="row2">
        <div><label>Boshlang'ich qoldiq</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" /></div>
        <div><label>O'lchov birligi</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <label>Minimal qoldiq (ogohlantirish uchun)</label><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
      <button className="save-btn" disabled={saving} onClick={save}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
    </ModalShell>
  );
}

function EditProductModal({ ownerId, product, onClose, onSaved }) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState(product.category || '');
  const [buyPrice, setBuyPrice] = useState(product.buy_price);
  const [sellPrice, setSellPrice] = useState(product.sell_price);
  const [stock, setStock] = useState(product.stock);
  const [unit, setUnit] = useState(product.unit);
  const [minStock, setMinStock] = useState(product.min_stock ?? '');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    let image_url = product.image_url;
    if (file) {
      try { image_url = await uploadProductImage(ownerId, product.id, file); }
      catch (e) { /* rasm yuklanmadi, qolgan maydonlar baribir saqlanadi */ }
    }
    await supabase.from('products').update({
      name: name.trim(), category: category.trim(),
      buy_price: Number(buyPrice) || 0, sell_price: Number(sellPrice) || 0,
      stock: Number(stock) || 0, unit, min_stock: minStock === '' ? null : Number(minStock),
      image_url,
    }).eq('id', product.id);
    setSaving(false);
    onSaved("Tovar yangilandi");
  };

  const remove = async () => {
    setSaving(true);
    await supabase.from('products').delete().eq('id', product.id);
    setSaving(false);
    onSaved("Tovar o'chirildi");
  };

  return (
    <ModalShell title="Tovarni tahrirlash" onClose={onClose}>
      <label>Tovar rasmi</label>
      <ImagePicker file={file} setFile={setFile} currentUrl={product.image_url} />
      <label>Tovar nomi</label><input value={name} onChange={(e) => setName(e.target.value)} />
      <label>Kategoriya</label><input value={category} onChange={(e) => setCategory(e.target.value)} />
      <div className="row2">
        <div><label>Kelish narxi</label><input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} /></div>
        <div><label>Sotish narxi</label><input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} /></div>
      </div>
      <div className="row2">
        <div><label>Qoldiq</label><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
        <div><label>O'lchov birligi</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <label>Minimal qoldiq (ogohlantirish uchun)</label><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
      <button className="save-btn" disabled={saving} onClick={save}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
      <button className="save-btn" disabled={saving} onClick={remove}
        style={{ background: '#fff', color: 'var(--red)', border: '1.5px solid var(--red)', marginTop: 8 }}>
        Tovarni o'chirish
      </button>
    </ModalShell>
  );
}

function IncomeModal({ ownerId, products, onClose, onSaved }) {
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState(products[0]?.buy_price || '');
  const [saving, setSaving] = useState(false);

  if (!products.length) {
    return (
      <ModalShell title="Tovar kirimi" onClose={onClose}>
        <div className="empty">Avval tovar qo'shing</div>
      </ModalShell>
    );
  }

  const onProductChange = (id) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    setPrice(p?.buy_price || '');
  };

  const save = async () => {
    const q = Number(qty) || 0;
    if (q <= 0) return;
    const p = products.find((x) => x.id === productId);
    setSaving(true);
    await supabase.from('incomes').insert({ owner_id: ownerId, product_id: p.id, qty: q, buy_price: Number(price) || 0 });
    await supabase.from('products').update({ stock: p.stock + q, buy_price: Number(price) || p.buy_price }).eq('id', p.id);
    setSaving(false);
    onSaved(`Qoldiq yangilandi: ${p.stock + q} ${p.unit}`);
  };

  return (
    <ModalShell title="Tovar kirimi" onClose={onClose}>
      <label>Tovar</label>
      <select value={productId} onChange={(e) => onProductChange(e.target.value)}>
        {products.map((p) => <option key={p.id} value={p.id}>{p.name} (qoldiq: {p.stock} {p.unit})</option>)}
      </select>
      <div className="row2">
        <div><label>Miqdor</label><input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0" /></div>
        <div><label>Kelish narxi</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" /></div>
      </div>
      <button className="save-btn" disabled={saving} onClick={save}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
    </ModalShell>
  );
}

function ExpenseModal({ ownerId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = Number(amount) || 0;
    if (!name.trim() || amt <= 0) return;
    setSaving(true);
    await supabase.from('expenses').insert({ owner_id: ownerId, name: name.trim(), amount: amt, note: note.trim() });
    setSaving(false);
    onSaved();
  };

  return (
    <ModalShell title="Xarajat qo'shish" onClose={onClose}>
      <label>Nomi</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Transport" />
      <label>Summasi</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <label>Izoh</label><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ixtiyoriy" />
      <button className="save-btn" disabled={saving} onClick={save}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
    </ModalShell>
  );
}

function AddDebtModal({ ownerId, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = Number(amount) || 0;
    if (!name.trim() || amt <= 0) return;
    setSaving(true);
    await supabase.from('debts').insert({ owner_id: ownerId, name: name.trim(), phone: phone.trim(), amount: amt, note: note.trim() });
    setSaving(false);
    onSaved();
  };

  return (
    <ModalShell title="Qarzdor qo'shish" onClose={onClose}>
      <label>Ism</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mijoz ismi" />
      <label>Telefon raqami</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 000 00 00" />
      <label>Qarz summasi</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      <label>Izoh</label><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ixtiyoriy" />
      <button className="save-btn" disabled={saving} onClick={save}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
    </ModalShell>
  );
}

function DebtDetailModal({ ownerId, debt, onClose, onSaved }) {
  const [pay, setPay] = useState('');
  const [saving, setSaving] = useState(false);

  const addPayment = async () => {
    const amt = Number(pay) || 0;
    if (amt <= 0) return;
    setSaving(true);
    const newAmount = Math.max(0, Number(debt.amount) - amt);
    await supabase.from('debt_payments').insert({ owner_id: ownerId, debt_id: debt.id, amount: amt });
    await supabase.from('debts').update({ amount: newAmount }).eq('id', debt.id);
    setSaving(false);
    onSaved("To'lov qabul qilindi");
  };

  const remove = async () => {
    setSaving(true);
    await supabase.from('debts').delete().eq('id', debt.id);
    setSaving(false);
    onSaved("Qarzdor o'chirildi");
  };

  return (
    <ModalShell title={debt.name} onClose={onClose}>
      {debt.phone && <div className="hint" style={{ marginTop: -6 }}>{debt.phone}</div>}
      <div className="card" style={{ marginTop: 12 }}>
        <div className="stat-label">Joriy qarz</div>
        <div className="stat-value red">{money(debt.amount)}</div>
      </div>
      <label>To'lov summasi</label><input type="number" value={pay} onChange={(e) => setPay(e.target.value)} placeholder="0" />
      <button className="save-btn" disabled={saving} onClick={addPayment}>To'lov qo'shish</button>
      <button className="save-btn" disabled={saving} onClick={remove}
        style={{ background: '#fff', color: 'var(--red)', border: '1.5px solid var(--red)', marginTop: 8 }}>
        Qarzdorni o'chirish
      </button>
    </ModalShell>
  );
}
