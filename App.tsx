type Sale = {
  id: number
  date: string
  items: string
  total: number
  profit: number
}
import { useEffect, useState } from 'react'

type Product = {
  id: number
  name: string
  barcode: string
  category: string
  cost: number
  price: number
  stock: number
}

type Sale = {
  id: number
  date: string
  items: string
  total: number
  profit: number

}type CartItem = {
  productId: number
  quantity: number


const money = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 })

const initialProducts: Product[] = [
  { id: 1, name: 'Rice 5kg', barcode: '1001', category: 'Food', cost: 10000, price: 12500, stock: 24 },
  { id: 2, name: 'Peak Milk 400g', barcode: '1002', category: 'Food', cost: 2700, price: 3200, stock: 8 },
  { id: 3, name: 'Spaghetti', barcode: '1003', category: 'Food', cost: 900, price: 1200, stock: 42 },
  { id: 4, name: 'Vegetable Oil 1L', barcode: '1004', category: 'Food', cost: 2400, price: 2800, stock: 5 },
  { id: 5, name: 'Bottle Water', barcode: '1005', category: 'Drinks', cost: 200, price: 300, stock: 60 },
]

export default function App() {
  const [tab, setTab] = useState('Dashboard')
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('supermart-products')
      return saved ? JSON.parse(saved) : initialProducts
    } catch {
      return initialProducts
    }
  })
  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('supermart-sales') || '[]')
    } catch {
      return []
    }
  })
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [category, setCategory] = useState('General')
  const [cost, setCost] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [selected, setSelected] = useState('')
const [cart, setCart] = useState<CartItem[]>([])
  const [quantity, setQuantity] = useState('1')
  const [cash, setCash] = useState('')

  useEffect(() => {
    localStorage.setItem('supermart-products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('supermart-sales', JSON.stringify(sales))
  }, [sales])

  const today = new Date().toDateString()
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === today)
  const revenue = todaySales.reduce((sum, s) => sum + s.total, 0)
  const profit = todaySales.reduce((sum, s) => sum + s.profit, 0)
  const lowStock = products.filter(p => p.stock <= 5).length

  const filtered = products.filter(p =>
    `${p.name} ${p.barcode} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  function addProduct() {
    if (!name.trim() || Number(price) <= 0 || Number(cost) < 0 ||
        !Number.isFinite(Number(stock)) || stock.trim() === '' ||
        Number(stock) < 0 || !Number.isInteger(Number(stock))) {
      alert('Enter a product name, valid prices and a whole stock quantity.')
      return
    }
    if (products.some(p => p.barcode && barcode.trim() && p.barcode === barcode.trim())) {
      alert('That barcode already exists.')
      return
    }
    setProducts(old => [...old, {
      id: Date.now(),
      name: name.trim(),
      barcode: barcode.trim(),
      category: category.trim() || 'General',
      cost: Number(cost),
      price: Number(price),
      stock: Number(stock),
    }])
    setName('')
    setBarcode('')
    setCost('')
    setPrice('')
    setStock('')
    setCategory('General')
    alert('Product saved!')
  }

  Stop immediately before function backup().{
    const product = products.find(p => p.id === Number(selected))
    const qty = Number(quantity)
    const paid = Number(cash)
    if (!product || !Number.isInteger(qty) || qty < 1) {
      alert('Select a product and enter a valid quantity.')
      return
    }
    if (qty > product.stock) {
      alert('Not enough stock available.')
      return
    }
    const total = product.price * qty
    if (cash.trim() === '' || !Number.isFinite(paid) || paid < total) {
      alert('Enter enough cash received to complete this sale.')
      return
    }
    const sale: Sale = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: `${product.name} × ${qty}`,
      total,
      profit: (product.price - product.cost) * qty,
    }
    setProducts(old => old.map(p =>
      p.id === product.id ? { ...p, stock: p.stock - qty } : p
    ))
    setSales(old => [sale, ...old])
    alert(
      `SUPERMART RECEIPT\n${product.name} × ${qty}\nTotal: ${money(total)}\nPaid: ${money(paid)}\nChange: ${money(paid - total)}`
    )
    setSelected('')
    setQuantity('1')
    setCash('')
  }

  function backup() {
    const data = JSON.stringify({ products, sales }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'supermart-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 14px',
    border: 'none',
    borderRadius: 8,
    background: active ? '#dff4e8' : 'white',
    color: '#176b49',
    textAlign: 'left',
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    width: '100%',
  })

  const field: React.CSSProperties = {
    padding: 11,
    border: '1px solid #d5ded9',
    borderRadius: 7,
    width: '100%',
    boxSizing: 'border-box',
    background: 'white',
    color: '#18352a',
    marginTop: 5,
  }

  const card: React.CSSProperties = {
    background: 'white',
    border: '1px solid #e4ebe7',
    borderRadius: 12,
    padding: 16,
    minWidth: 0,
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#20352c', background: '#f3f7f5', minHeight: '100vh' }}>
      <header style={{ background: '#11764e', color: 'white', padding: '18px 20px' }}>
        <div style={{ fontSize: 21, fontWeight: 800 }}>🏪 SuperMart</div>
        <div style={{ fontSize: 12, marginTop: 5 }}>POINT OF SALE & INVENTORY</div>
      </header>

      <nav style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: 10, background: 'white', borderBottom: '1px solid #e1e9e4' }}>
        {['Dashboard', 'Products', 'Checkout', 'Sales', 'Settings'].map(item => (
          <button key={item} onClick={() => setTab(item)} style={{ ...buttonStyle(tab === item), whiteSpace: 'nowrap', width: 'auto' }}>
           {item}
          </button>
        ))}
      </nav>

      <main style={{ padding: 16, maxWidth: 1050, margin: '0 auto' }}>
        {tab === 'Dashboard' && (
          <>
            <div style={{ ...card, background: '#11764e', color: 'white', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 12 }}>YOUR BUSINESS AT A GLANCE</div>
              <h2 style={{ margin: '12px 0' }}>Run your store smarter.</h2>
              <div style={{ fontSize: 13 }}>Manage products, sales and stock in one place.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
              <div style={card}><div>Today's sales</div><h2>{money(revenue)}</h2><small>{todaySales.length} transactions</small></div>
              <div style={card}><div>Estimated profit</div><h2>{money(profit)}</h2><small>Based on recorded sales</small></div>
              <div style={card}><div>Products</div><h2>{products.length}</h2><small>Saved in this browser</small></div>
              <div style={card}><div>Low-stock items</div><h2>{lowStock}</h2><small>Stock of 5 or fewer</small></div>
            </div>
            <section style={card}>
              <h3>Inventory overview</h3>
              {products.length === 0 ? <p>No products yet. Add your first product.</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
                    <thead><tr style={{ background: '#f3f7f5', textAlign: 'left' }}>
                      {['Product', 'Selling price', 'Stock', 'Status'].map(x => <th key={x} style={{ padding: 10 }}>{x}</th>)}
                    </tr></thead>
                    <tbody>{products.slice(0, 10).map(p => (
                      <tr key={p.id}>
                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{p.name}</td>
                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{money(p.price)}</td>
                        <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{p.stock}</td>
                        <td style={{ padding: 10, borderBottom: '1px solid #eee', color: p.stock <= 5 ? '#a45b00' : '#167448' }}>{p.stock <= 5 ? 'Low stock' : 'In stock'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </section>
            <p style={{ fontSize: 12, color: '#687970' }}>Sales totals are based on recorded transactions. Initial products are sample data.</p>
          </>
        )}

        {tab === 'Products' && (
          <>
            <h2>Products & Inventory</h2>
            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Add a product</h3>
              <label>Product name<input style={field} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Indomie carton" /></label>
              <label style={{ display: 'block', marginTop: 12 }}>Barcode / product code<input style={field} value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Optional product code" /></label>
              <label style={{ display: 'block', marginTop: 12 }}>Category<input style={field} value={category} onChange={e => setCategory(e.target.value)} /></label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                <label>Unit cost (₦)<input style={field} type="number" min="0" value={cost} onChange={e => setCost(e.target.value)} /></label>
                <label>Selling price (₦)<input style={field} type="number" min="0.01" value={price} onChange={e => setPrice(e.target.value)} /></label>
              </div>
              <label style={{ display: 'block', marginTop: 12 }}>Opening quantity<input style={field} type="number" min="0" step="1" value={stock} onChange={e => setStock(e.target.value)} /></label>
              <button onClick={addProduct} style={{ ...buttonStyle(true), background: '#11764e', color: 'white', textAlign: 'center', marginTop: 16 }}>Save product</button>
            </section>
            <input style={{ ...field, marginBottom: 12 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, code or category..." />
            <div style={card}>
              <h3>Product list ({filtered.length})</h3>
              {filtered.map(p => <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                <strong>{p.name}</strong><div style={{ fontSize: 13, marginTop: 5 }}>Code: {p.barcode || 'None'} · Stock: {p.stock}</div>
                <div style={{ marginTop: 5 }}>{money(p.price)} <button onClick={() => {
                  const next = prompt(`Add stock to ${p.name}. Current quantity: ${p.stock}`, '0')
                  if (next !== null && next.trim() !== '' && Number.isInteger(Number(next)) && Number(next) > 0) {
                    setProducts(old => old.map(x => x.id === p.id ? { ...x, stock: x.stock + Number(next) } : x))
                  } else if (next !== null) alert('Enter a whole number greater than zero.')
                }} style={{ marginLeft: 10, padding: 6 }}>Restock</button></div>
              </div>)}
            </div>
          </>
        )}

        {tab === 'Checkout' && (
          <>
            <h2>POS Checkout</h2>
            <section style={card}>
              <label>Select product
                <select style={field} value={selected} onChange={e => setSelected(e.target.value)}>
                  <option value="">Choose a product</option>
                  {products.filter(p => p.stock > 0).map(p => <option key={p.id} value={p.id}>{p.name} — {money(p.price)} (Stock: {p.stock})</option>)}
                </select>
              </label>
              <label style={{ display: 'block', marginTop: 14 }}>Quantity<input style={field} type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></label>
              <div style={{ marginTop: 18, fontSize: 20, fontWeight: 700 }}>
                Total: {money((products.find(p => p.id === Number(selected))?.price || 0) * Math.max(0, Number(quantity) || 0))}7
              </div>
              <label style={{ display: 'block', marginTop: 14 }}>Cash received (₦)<input style={field} type="number" min="0" value={cash} onChange={e => setCash(e.target.value)} placeholder="Amount customer paid" /></label>
              <button onClick=Stop immediately before function backup(). style={{ ...buttonStyle(true), background: '#11764e', color: 'white', textAlign: 'center', marginTop: 18 }}>Complete sale & show receipt</button>
              <p style={{ fontSize: 12, color: '#687970' }}>This first version sells one product per transaction.</p>
            </section>
          </>
        )}

        {tab === 'Sales' && (
          <>
            <h2>Sales History</h2>
            <section style={card}>
              <h3>Recorded transactions: {sales.length}</h3>
              {sales.length === 0 ? <p>No sales recorded yet.</p> : sales.map(s => (
                <div key={s.id} style={{ padding: '13px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{s.items}</strong><div style={{ marginTop: 5 }}>{money(s.total)}</div>
                  <small>{new Date(s.date).toLocaleString()}</small>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'Settings' && (
          <>
            <h2>Settings & Data Protection</h2>
            <section style={card}>
              <h3>Local data</h3>
              <p>Products and sales are saved in this browser on this device.</p>
              <p>Products: {products.length} · Sales: {sales.length}</p>
              <button onClick={backup} style={{ ...buttonStyle(true), background: '#11764e', color: 'white', textAlign: 'center' }}>Download data backup</button>
              <p style={{ fontSize: 12, color: '#687970' }}>Keep your backup file safe. Browser data can be lost if site storage is cleared. This is local storage, not cloud storage or a secure multi-user database.</p>
            </section>
          </>
        )}
      </main>
    </div>
  )

