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
}

type CartItem = {
  productId: number
  quantity: number
}

const money = (n: number) =>
  '₦' + n.toLocaleString('en-NG', { minimumFractionDigits: 2 })

const initialProducts: Product[] = [
  { id: 1, name: 'USB-C Charger 25W', barcode: 'ACC1001', category: 'Chargers', cost: 3500, price: 5000, stock: 20 },
  { id: 2, name: 'USB-C Cable', barcode: 'ACC1002', category: 'Cables', cost: 800, price: 1500, stock: 30 },
  { id: 3, name: 'Phone Case', barcode: 'ACC1003', category: 'Phone Cases', cost: 700, price: 1500, stock: 25 },
  { id: 4, name: 'Tempered Glass Screen Protector', barcode: 'ACC1004', category: 'Screen Protectors', cost: 400, price: 1000, stock: 40 },
  { id: 5, name: 'Wired Earphones', barcode: 'ACC1005', category: 'Audio', cost: 1200, price: 2000, stock: 15 },
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
  const [checkoutSearch, setCheckoutSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [quantity, setQuantity] = useState('1')
  const [cash, setCash] = useState('')
  const [reportPeriod, setReportPeriod] = useState<'today' | '7days' | '30days' | 'all'>('today')

  useEffect(() => {
    localStorage.setItem('supermart-products', JSON.stringify(products))
  }, [products])

  useEffect(() => {
    localStorage.setItem('supermart-sales', JSON.stringify(sales))
  }, [sales])

  const reportSales = sales.filter(sale => {
    if (reportPeriod === 'all') return true
    const saleTime = new Date(sale.date).getTime()
    const now = new Date()
    if (reportPeriod === 'today') {
      return new Date(sale.date).toDateString() === now.toDateString()
    }
    const days = reportPeriod === '7days' ? 7 : 30
    return saleTime >= new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)).getTime()
      && saleTime <= now.getTime()
  })

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

  
  async function importCatalogue(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('The file must contain a non-empty product list.')
      }

      const valid = parsed.every((p: any) =>
        p && typeof p.name === 'string' && p.name.trim() &&
        typeof p.barcode === 'string' &&
        typeof p.category === 'string' &&
        Number.isFinite(p.cost) && p.cost >= 0 &&
        Number.isFinite(p.price) && p.price > 0 &&
        Number.isInteger(p.stock) && p.stock >= 0
      )
      if (!valid) throw new Error('One or more products have invalid fields.')

      const codes = parsed.map((p: any) => p.barcode.trim()).filter(Boolean)
      if (new Set(codes).size !== codes.length) {
        throw new Error('The catalogue contains duplicate product codes.')
      }

      if (!window.confirm(
        `Import ${parsed.length} products? Matching product codes will be updated; other products will be kept. Sales records will not be changed.`
      )) return

      setProducts(old => {
        const result = [...old]
        let nextId = Math.max(Date.now(), ...old.map(p => p.id + 1), 1)
        for (const item of parsed as Product[]) {
          const code = item.barcode.trim()
          const index = code ? result.findIndex(p => p.barcode.trim() === code) : -1
          if (index >= 0) {
            result[index] = { ...item, id: result[index].id, barcode: code }
          } else {
            result.push({ ...item, id: nextId++, barcode: code })
          }
        }
        return result
      })
      alert(`Catalogue imported: ${parsed.length} products checked. Your sales records were not changed.`)
    } catch (error) {
      alert('Import failed: ' + (error instanceof Error ? error.message : 'Invalid file'))
    } finally {
      event.target.value = ''
    }
  }

  function checkout() {
    if (cart.length === 0) {
      alert('Add at least one product to the cart.')
      return
    }

    const paid = Number(cash)
    const lines = cart.map(item => {
      const product = products.find(p => p.id === item.productId)
      return { product, quantity: item.quantity }
    })

    if (lines.some(line =>
      !line.product ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > (line.product?.stock ?? 0)
    )) {
      alert('One or more cart items have invalid quantities or insufficient stock.')
      return
    }

    const total = lines.reduce(
      (sum, line) => sum + line.product!.price * line.quantity, 0
    )

    if (cash.trim() === '' || !Number.isFinite(paid) || paid < total) {
      alert('Enter enough cash received to complete this sale.')
      return
    }

    const sale: Sale = {
      id: Date.now(),
      date: new Date().toISOString(),
      items: lines.map(line => `${line.product!.name} × ${line.quantity}`).join(', '),
      total,
      profit: lines.reduce(
        (sum, line) => sum + (line.product!.price - line.product!.cost) * line.quantity, 0
      ),
    }

    setProducts(old => old.map(product => {
      const item = cart.find(entry => entry.productId === product.id)
      return item ? { ...product, stock: product.stock - item.quantity } : product
    }))
    setSales(old => [sale, ...old])
    alert(
      `SUPERMART RECEIPT\n${sale.items}\nTotal: ${money(total)}\nPaid: ${money(paid)}\nChange: ${money(paid - total)}`
    )
    setCart([])
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
        <div style={{ fontSize: 21, fontWeight: 800 }}>📱 DANKASA GLOBAL COMMUNICATION</div>
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
              <h2 style={{ margin: '12px 0' }}>Manage your phone accessories business.</h2>
              <div style={{ fontSize: 13 }}>Track phone accessories, inventory, sales and profit in one place.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
              <div style={card}><div>Today's sales</div><h2>{money(revenue)}</h2><small>{todaySales.length} transactions</small></div>
              <div style={card}><div>Estimated profit</div><h2>{money(profit)}</h2><small>Based on recorded sales</small></div>
              <div style={card}><div>Products</div><h2>{products.length}</h2><small>Saved in this browser</small></div>
              <div style={card}><div>Low-stock items</div><h2>{lowStock}</h2><small>Stock of 5 or fewer</small></div>
            </div>
            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Products needing restock</h3>
              {products.filter(p => p.stock <= 5).length === 0 ? (
                <p>All products have sufficient stock.</p>
              ) : products.filter(p => p.stock <= 5).map(p => (
                <div key={p.id} style={{ padding: 10, borderBottom: '1px solid #eee' }}>
                  <strong>{p.name}</strong> — Only {p.stock} left. Restock needed.
                </div>
              ))}
            </section>
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
              <h3>Import accessory catalogue</h3>
              <p>Select your JSON catalogue file. Matching product codes will be updated, other products kept, and sales records left unchanged.</p>
              <label style={{ display: 'block', marginBottom: 10 }}>
                Choose catalogue file
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importCatalogue}
                  style={{ ...field, marginTop: 8 }}
                />
              </label>
            </section>
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
                <div style={{ marginTop: 5 }}>
                  {money(p.price)}
                  <button onClick={() => {
                    const next = prompt(`Enter barcode/product code for ${p.name}`, p.barcode || '')
                    if (next === null) return
                    const code = next.trim()
                    if (code && products.some(x => x.id !== p.id && x.barcode?.trim() === code)) {
                      alert('That barcode is already assigned to another product.')
                      return
                    }
                    setProducts(old => old.map(x => x.id === p.id ? { ...x, barcode: code } : x))
                  }} style={{ marginLeft: 10, padding: 6 }}>Edit barcode</button>
                  <button onClick={() => {
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
            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Add product to cart</h3>
              <label>Search by product name or barcode
                <input
                  style={field}
                  value={checkoutSearch}
                  onChange={e => {
                    setCheckoutSearch(e.target.value)
                    setSelected('')
                  }}
                  placeholder="Type a name or scan/enter a barcode"
                />
              </label>
              <label style={{ display: 'block', marginTop: 12 }}>Select matching product
                <select style={field} value={selected} onChange={e => setSelected(e.target.value)}>
                  <option value="">Choose a product</option>
                  {products.filter(p =>
                    p.stock > 0 &&
                    `${p.name} ${p.barcode} ${p.category}`
                      .toLowerCase()
                      .includes(checkoutSearch.trim().toLowerCase())
                  ).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — Code: {p.barcode || 'None'} — {money(p.price)} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'block', marginTop: 12 }}>
                Quantity
                <input style={field} type="number" min="1" step="1" value={quantity}
                  onChange={e => setQuantity(e.target.value)} />
              </label>
              <button onClick={() => {
                const product = products.find(p => p.id === Number(selected))
                const qty = Number(quantity)
                if (!product || !Number.isInteger(qty) || qty < 1) {
                  alert('Select a product and enter a valid whole quantity.')
                  return
                }
                const existing = cart.find(item => item.productId === product.id)
                const combinedQty = qty + (existing?.quantity ?? 0)
                if (combinedQty > product.stock) {
                  alert('Not enough stock available for that quantity.')
                  return
                }
                setCart(old => existing
                  ? old.map(item => item.productId === product.id
                    ? { ...item, quantity: combinedQty } : item)
                  : [...old, { productId: product.id, quantity: qty }])
                setSelected('')
                setQuantity('1')
              }} style={{ ...buttonStyle(true), background: '#11764e', color: 'white', textAlign: 'center', marginTop: 12 }}>
                Add to cart
              </button>
            </section>

            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Shopping cart ({cart.length} products)</h3>
              {cart.length === 0 ? <p>Your cart is empty.</p> : cart.map(item => {
                const product = products.find(p => p.id === item.productId)
                if (!product) return null
                return (
                  <div key={item.productId} style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}>
                    <strong>{product.name}</strong>
                    <div style={{ marginTop: 5 }}>{money(product.price)} each</div>
                    <label style={{ display: 'block', marginTop: 8 }}>
                      Quantity
                      <input style={field} type="number" min="1" step="1"
                        value={String(item.quantity)}
                        onChange={e => {
                          const qty = Number(e.target.value)
                          if (!Number.isInteger(qty) || qty < 1 || qty > product.stock) return
                          setCart(old => old.map(x => x.productId === item.productId
                            ? { ...x, quantity: qty } : x))
                        }} />
                    </label>
                    <div style={{ marginTop: 6 }}>
                      Subtotal: {money(product.price * item.quantity)}
                      <button onClick={() => setCart(old => old.filter(x => x.productId !== item.productId))}
                        style={{ marginLeft: 10, padding: 6 }}>Remove</button>
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 18, fontSize: 20, fontWeight: 700 }}>
                Total: {money(cart.reduce((sum, item) => {
                  const product = products.find(p => p.id === item.productId)
                  return sum + (product?.price ?? 0) * item.quantity
                }, 0))}
              </div>
              <label style={{ display: 'block', marginTop: 14 }}>
                Cash received (₦)
                <input style={field} type="number" min="0" value={cash}
                  onChange={e => setCash(e.target.value)} placeholder="Amount customer paid" />
              </label>
              <button onClick={checkout}
                style={{ ...buttonStyle(true), background: '#11764e', color: 'white', textAlign: 'center', marginTop: 18 }}>
                Complete sale & show receipt
              </button>
              <button onClick={() => { setCart([]); setCash('') }}
                style={{ ...buttonStyle(false), marginTop: 8 }}>
                Clear cart
              </button>
            </section>
          </>
        )}

        {tab === 'Sales' && (
          <>
            <h2>Sales Reports & History</h2>

            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Report period</h3>
              <p>Choose a period to calculate your sales and profit.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button onClick={() => setReportPeriod('today')}
                  style={buttonStyle(reportPeriod === 'today')}>Today</button>
                <button onClick={() => setReportPeriod('7days')}
                  style={buttonStyle(reportPeriod === '7days')}>Last 7 days</button>
                <button onClick={() => setReportPeriod('30days')}
                  style={buttonStyle(reportPeriod === '30days')}>Last 30 days</button>
                <button onClick={() => setReportPeriod('all')}
                  style={buttonStyle(reportPeriod === 'all')}>All time</button>
              </div>
            </section>

            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div style={card}>
                <div style={{ fontSize: 13 }}>Revenue</div>
                <strong style={{ fontSize: 20 }}>{money(reportSales.reduce((sum, sale) => sum + sale.total, 0))}</strong>
              </div>
              <div style={card}>
                <div style={{ fontSize: 13 }}>Recorded profit</div>
                <strong style={{ fontSize: 20 }}>{money(reportSales.reduce((sum, sale) => sum + sale.profit, 0))}</strong>
              </div>
              <div style={card}>
                <div style={{ fontSize: 13 }}>Transactions</div>
                <strong style={{ fontSize: 20 }}>{reportSales.length}</strong>
              </div>
              <div style={card}>
                <div style={{ fontSize: 13 }}>Average sale</div>
                <strong style={{ fontSize: 20 }}>{money(reportSales.length ? reportSales.reduce((sum, sale) => sum + sale.total, 0) / reportSales.length : 0)}</strong>
              </div>
            </section>

            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Daily summary</h3>
              {reportSales.length === 0 ? <p>No sales in this period.</p> : Object.entries(
                reportSales.reduce((groups, sale) => {
                  const day = new Date(sale.date).toLocaleDateString()
                  if (!groups[day]) groups[day] = { revenue: 0, profit: 0, count: 0 }
                  groups[day].revenue += sale.total
                  groups[day].profit += sale.profit
                  groups[day].count += 1
                  return groups
                }, {} as Record<string, { revenue: number; profit: number; count: number }>)
              ).map(([day, totals]) => (
                <div key={day} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <strong>{day}</strong>
                  <div>Revenue: {money(totals.revenue)} · Profit: {money(totals.profit)}</div>
                  <small>{totals.count} transaction(s)</small>
                </div>
              ))}
            </section>

            <section style={{ ...card, marginBottom: 16 }}>
              <h3>Best-selling products</h3>
              <p style={{ fontSize: 12, color: '#687970' }}>
                Ranked by quantity sold in the selected report period. Based on recorded sale descriptions.
              </p>
              {(() => {
                const totals: Record<string, number> = {}

                reportSales.forEach(sale => {
                  sale.items.split(', ').forEach(item => {
                    const match = item.match(/^(.*?)\s+×\s+(\d+)$/)
                    if (!match) return
                    const productName = match[1].trim()
                    const quantitySold = Number(match[2])
                    if (productName && Number.isFinite(quantitySold)) {
                      totals[productName] = (totals[productName] || 0) + quantitySold
                    }
                  })
                })

                const ranked = Object.entries(totals)
                  .sort((a, b) => b[1] - a[1])

                return ranked.length === 0
                  ? <p>No product quantity details are available for this period.</p>
                  : ranked.map(([productName, quantitySold], index) => (
                    <div key={productName} style={{
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12
                    }}>
                      <div>
                        <strong>{index + 1}. {productName}</strong>
                      </div>
                      <strong>{quantitySold} sold</strong>
                    </div>
                  ))
              })()}
            </section>

            <h3>Sales History</h3>
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

}
