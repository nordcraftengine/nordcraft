/**
 * Realistic fixtures shared by the std-lib benchmarks.
 *
 * The benchmark harness copies this file into the base worktree so the base and
 * head revisions are always measured with byte-identical input data.
 */

export type ProductDimensions = {
  width: number
  height: number
  depth: number
  unit: 'cm' | 'mm' | 'in'
}

export type Product = {
  id: string
  sku: string
  title: string
  description: string
  price: number
  discountPrice: number
  currency: string
  category: string
  tags: string[]
  inStock: boolean
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
  metadata: {
    warehouse: string
    supplier: { id: string; name: string; country: string }
    dimensions: ProductDimensions
  }
}

export type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'customer'
  age: number
  active: boolean
  verifiedAt: Date | null
  lastLogin: Date
  address: { street: string; city: string; postalCode: string; country: string }
  tags: string[]
  preferences: {
    newsletter: boolean
    theme: 'light' | 'dark' | 'system'
    locale: string
  }
}

export type Order = {
  id: string
  userId: string
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  lines: { productId: string; quantity: number; unitPrice: number }[]
  total: number
  currency: string
  createdAt: Date
  deliveredAt: Date | null
  shipping: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  notes: string
}

export type Cart = {
  id: string
  currency: string
  updatedAt: string
  customer: { id: string; email: string }
  lines: {
    productId: string
    title: string
    quantity: number
    unitPrice: number
  }[]
  totals: { subtotal: number; shipping: number; total: number }
  discounts: { code: string; amount: number }[]
}

export const BENCHMARK_URL =
  'https://shop.example.com/collections/new-arrivals?sort=price-desc&page=2#featured'

export const BENCHMARK_ORIGIN = 'https://shop.example.com'

const PRODUCT_CATEGORIES = [
  'Lighting',
  'Furniture',
  'Kitchen',
  'Outdoor',
  'Textiles',
  'Storage',
] as const

const PRODUCT_ADJECTIVES = [
  'Minimalist',
  'Scandinavian',
  'Handcrafted',
  'Modular',
  'Recycled',
  'Foldable',
  'Stackable',
  'Waterproof',
] as const

const PRODUCT_NOUNS = [
  'Pendant Lamp',
  'Oak Shelf',
  'Cast Iron Pan',
  'Linen Duvet',
  'Storage Crate',
  'Ceramic Mug',
  'Wool Rug',
  'Garden Chair',
  'Wall Clock',
  'Knife Block',
  'Bookend Set',
  'Floor Lamp',
] as const

const PRODUCT_COLORS = [
  'black',
  'white',
  'oak',
  'walnut',
  'sage',
  'terracotta',
  'navy',
  'sand',
] as const

const PRODUCT_TAGS = [
  'new',
  'bestseller',
  'clearance',
  'eco',
  'made-in-eu',
  'gift',
  'bulky',
  'fragile',
] as const

const SUPPLIERS = [
  { id: 'sup-1001', name: 'Nordic Woodworks', country: 'DK' },
  { id: 'sup-1002', name: 'Lumen Atelier', country: 'DE' },
  { id: 'sup-1003', name: 'Casa Ceramica', country: 'ES' },
  { id: 'sup-1004', name: 'Textile Mills', country: 'PT' },
] as const

const WAREHOUSES = [
  'copenhagen-1',
  'aarhus-2',
  'hamburg-1',
  'barcelona-3',
] as const

const CITIES = [
  {
    street: 'Strandvejen 12',
    city: 'Copenhagen',
    postalCode: '1050',
    country: 'DK',
  },
  { street: 'Nørregade 44', city: 'Aarhus', postalCode: '8000', country: 'DK' },
  { street: 'Torstraße 7', city: 'Berlin', postalCode: '10115', country: 'DE' },
  {
    street: 'Rua da Prata 91',
    city: 'Lisbon',
    postalCode: '1000',
    country: 'PT',
  },
] as const

const FIRST_NAMES = [
  'Ida',
  'Marius',
  'Sofie',
  'Emil',
  'Freja',
  'Noah',
  'Alma',
  'Viktor',
  'Clara',
  'Henrik',
] as const

const LAST_NAMES = [
  'Nielsen',
  'Johansen',
  'Schmidt',
  'Ferreira',
  'Lindqvist',
  'Bakker',
] as const

const ORDER_STATUSES = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
] as const

const ORDER_NOTES = [
  'Leave the parcel with the concierge',
  'Gift wrapping requested',
  'Call before delivery',
  '',
  'Fragile - handle with care',
] as const

const BASE_TIMESTAMP = Date.UTC(2026, 0, 15, 9, 30, 0)
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Deterministic pseudo random generator so every benchmark run - and every
 * revision - works with exactly the same fixture data.
 */
const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(1_664_525, state) + 1_013_904_223) >>> 0
    return state / 0x1_0000_0000
  }
}

const pick = <T>(random: () => number, values: readonly T[]): T => {
  const index = Math.min(
    values.length - 1,
    Math.floor(random() * values.length),
  )
  return values[index] as T
}

const pickMany = <T>(
  random: () => number,
  values: readonly T[],
  count: number,
): T[] => Array.from({ length: count }, () => pick(random, values))

const dateAfter = (days: number, hours = 0) =>
  new Date(BASE_TIMESTAMP + days * DAY_MS + hours * 60 * 60 * 1000)

const createProducts = (count = 200): Product[] => {
  const random = createSeededRandom(42)
  return Array.from({ length: count }, (_, index) => {
    const noun = pick(random, PRODUCT_NOUNS)
    const title = `${pick(random, PRODUCT_ADJECTIVES)} ${pick(random, PRODUCT_COLORS)} ${noun}`
    const price = Number((15 + random() * 480).toFixed(2))
    const inStock = random() > 0.2
    return {
      id: `product-${index + 1}`,
      sku: `SKU-${String(index + 1).padStart(5, '0')}`,
      title,
      description: `${title} from ${pick(random, SUPPLIERS).name}. ${
        inStock
          ? 'In stock and ready to ship from our European warehouse.'
          : 'Currently sold out - join the waitlist for a restock notification.'
      }`,
      price,
      discountPrice: Number((price * (0.7 + random() * 0.25)).toFixed(2)),
      currency: pick(random, ['DKK', 'EUR', 'SEK'] as const),
      category: pick(random, PRODUCT_CATEGORIES),
      tags: pickMany(random, PRODUCT_TAGS, 1 + Math.floor(random() * 3)),
      inStock,
      rating: Number((2.5 + random() * 2.5).toFixed(2)),
      reviewCount: Math.floor(random() * 850),
      createdAt: dateAfter(-Math.floor(random() * 900)),
      updatedAt: dateAfter(-Math.floor(random() * 30)),
      metadata: {
        warehouse: pick(random, WAREHOUSES),
        supplier: pick(random, SUPPLIERS),
        dimensions: {
          width: Number((5 + random() * 180).toFixed(1)),
          height: Number((5 + random() * 180).toFixed(1)),
          depth: Number((2 + random() * 90).toFixed(1)),
          unit: pick(random, ['cm', 'mm', 'in'] as const),
        },
      },
    }
  })
}

const createUsers = (count = 120): User[] => {
  const random = createSeededRandom(7)
  return Array.from({ length: count }, (_, index) => {
    const firstName = pick(random, FIRST_NAMES)
    const lastName = pick(random, LAST_NAMES)
    const location = pick(random, CITIES)
    const active = random() > 0.15
    return {
      id: `user-${index + 1}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLocaleLowerCase()}.${lastName.toLocaleLowerCase()}${index + 1}@example.com`,
      role: pick(random, ['admin', 'editor', 'customer'] as const),
      age: 18 + Math.floor(random() * 60),
      active,
      verifiedAt: dateAfter(-Math.floor(random() * 700)),
      lastLogin: dateAfter(
        -Math.floor(random() * 45),
        Math.floor(random() * 12),
      ),
      address: {
        street: location.street,
        city: location.city,
        postalCode: location.postalCode,
        country: location.country,
      },
      tags: pickMany(
        random,
        ['vip', 'newsletter', 'beta', 'b2b'],
        1 + Math.floor(random() * 2),
      ),
      preferences: {
        newsletter: random() > 0.4,
        theme: pick(random, ['light', 'dark', 'system'] as const),
        locale: pick(random, ['da-DK', 'de-DE', 'pt-PT', 'en-GB'] as const),
      },
    }
  })
}

const createOrders = (products: readonly Product[], count = 150): Order[] => {
  const random = createSeededRandom(1337)
  return Array.from({ length: count }, (_, index) => {
    const lineCount = 1 + Math.floor(random() * 4)
    const lines = Array.from({ length: lineCount }, () => {
      const product = pick(random, products)
      return {
        productId: product.id,
        quantity: 1 + Math.floor(random() * 4),
        unitPrice: product.price,
      }
    })
    const total = lines.reduce(
      (sum, line) => sum + line.unitPrice * line.quantity,
      0,
    )
    const status = pick(random, ORDER_STATUSES)
    const location = pick(random, CITIES)
    return {
      id: `order-${100_000 + index}`,
      userId: `user-${1 + Math.floor(random() * 120)}`,
      status,
      lines,
      total: Number(total.toFixed(2)),
      currency: 'DKK',
      createdAt: dateAfter(-Math.floor(random() * 120)),
      deliveredAt:
        status === 'delivered' ? dateAfter(-Math.floor(random() * 60)) : null,
      shipping: {
        street: location.street,
        city: location.city,
        postalCode: location.postalCode,
        country: location.country,
      },
      notes: pick(random, ORDER_NOTES),
    }
  })
}

export const PRODUCTS = createProducts()
export const USERS = createUsers()
export const ORDERS = createOrders(PRODUCTS)

export const PRODUCT_BY_ID = Object.fromEntries(
  PRODUCTS.map((product) => [product.id, product]),
)

export const CART: Cart = {
  id: 'cart-8f21',
  currency: 'DKK',
  updatedAt: '2026-01-15T09:30:00.000Z',
  customer: { id: USERS[41]?.id ?? 'user-42', email: USERS[41]?.email ?? '' },
  lines: PRODUCTS.slice(0, 4).map((product, index) => ({
    productId: product.id,
    title: product.title,
    quantity: index + 1,
    unitPrice: product.price,
  })),
  totals: {
    subtotal: Number(
      PRODUCTS.slice(0, 4)
        .reduce((sum, product) => sum + product.price, 0)
        .toFixed(2),
    ),
    shipping: 49,
    total: 0,
  },
  discounts: [{ code: 'SPRING10', amount: 100 }],
}
CART.totals.total = Number(
  (CART.totals.subtotal + CART.totals.shipping - 100).toFixed(2),
)

export const PRICES = PRODUCTS.map(({ price }) => price)
export const RATINGS = PRODUCTS.map(({ rating }) => rating)
export const TITLES = PRODUCTS.map(({ title }) => title)
export const DESCRIPTIONS = PRODUCTS.map(({ description }) => description)
export const SKUS = PRODUCTS.map(({ sku }) => sku)
export const DIMENSIONS = PRODUCTS.map(
  ({ metadata }) => metadata.dimensions.width * metadata.dimensions.height,
)
export const PRODUCT_DATES = PRODUCTS.map(({ createdAt }) => createdAt)
export const PRODUCT_TIMESTAMPS = PRODUCTS.map(({ createdAt }) =>
  createdAt.getTime(),
)
export const ISO_DATES = PRODUCTS.map(({ createdAt }) =>
  createdAt.toISOString(),
)
export const TAG_LISTS = PRODUCTS.map(({ tags }) => tags)
export const ORDER_TOTALS = ORDERS.map(({ total }) => total)

/** Deep copies so deep-equality formulas have to walk the whole object. */
export const PRODUCT_COPIES = PRODUCTS.map((product) => ({
  ...product,
  tags: [...product.tags],
  metadata: {
    ...product.metadata,
    supplier: { ...product.metadata.supplier },
    dimensions: { ...product.metadata.dimensions },
  },
}))

export const PRODUCT_LABELS = PRODUCTS.map((product) => ({
  key: product.id,
  value: { title: product.title, sku: product.sku },
}))

export const NESTED_TAGS = Array.from({ length: 50 }, (_, group) =>
  Array.from(
    { length: 8 },
    (_, index) => PRODUCT_TAGS[(group + index) % PRODUCT_TAGS.length] as string,
  ),
)

export const TAGS_WITH_DUPLICATES = Array.from(
  { length: 128 },
  (_, index) => PRODUCT_TAGS[index % PRODUCT_TAGS.length] as string,
)

const PARAGRAPH = [
  'Nordcraft is a visual development platform for building production ready web apps.',
  'Designers assemble pages from reusable components without leaving the canvas, while engineers keep full control over the underlying code.',
  'Every formula and action is documented, versioned and benchmarked, which makes it safe to adopt the platform in an existing codebase.',
  'Our editors run the same runtime as the server, so what you preview is what you ship.',
].join(' ')

const SENTENCES = PARAGRAPH.split('. ').map((sentence) =>
  sentence.endsWith('.') ? sentence : `${sentence}.`,
)

export const ARTICLE_BODY = SENTENCES.concat(SENTENCES, SENTENCES).join(' ')

export const CSV_ROWS = [
  'orderId,customer,status,total,currency',
  'order-100000,ida.nielsen1@example.com,delivered,1249.00,DKK',
  'order-100001,marius.johansen2@example.com,pending,389.50,DKK',
  'order-100002,sofie.schmidt3@example.com,shipped,2044.75,DKK',
  'order-100003,emil.ferreira4@example.com,cancelled,79.00,DKK',
]

export const PADDED_TITLES = TITLES.map((title) => `\n  \t${title}\t  `)

export const BASE64_TITLES = TITLES.map((title) => btoa(title))
export const ENCODED_QUERIES = TITLES.map((title) => encodeURIComponent(title))
export const JSON_PRODUCTS = PRODUCTS.map((product) => JSON.stringify(product))
export const COLLECTION_URLS = Array.from({ length: 200 }, (_, index) => {
  const product = PRODUCTS[index % PRODUCTS.length] as Product
  return `${BENCHMARK_ORIGIN}/products/${product.sku.toLocaleLowerCase()}?page=${(index % 24) + 1}&sort=${product.category.toLocaleLowerCase()}`
})

export const MIXED_VALUES: unknown[] = [
  0,
  1,
  -1,
  2.5,
  '',
  'nordcraft',
  null,
  undefined,
  Number.NaN,
  true,
  false,
  [],
  [1, 2, 3],
  {},
  { id: 'product-1' },
]

export const COLLECTIONS: unknown[] = [
  PRODUCTS,
  CART,
  TITLES,
  USERS,
  ORDER_TOTALS,
]

export const COOKIE_VALUES: Record<string, string> = {
  session_id: 'a3f1c9d84b2e7f60',
  locale: 'da-DK',
  cart: 'eyJpdGVtcyI6W3sicXVudGl0eSI6MiwicHJpY2UiOjQ5OS45OV19XQ',
  consent: 'analytics%3Dtrue%3Bmarketing%3Dfalse',
  experiment: 'checkout_v3',
}

export const LOCAL_STORAGE_VALUES: Record<string, unknown> = {
  'cart.items': PRODUCTS.slice(0, 4).map(({ id }) => ({ id })),
  'cart.updatedAt': '2026-01-15T09:30:00.000Z',
  'recently-viewed': SKUS.slice(0, 6),
  'newsletter.optIn': true,
  theme: 'dark',
}

export const SESSION_STORAGE_VALUES: Record<string, unknown> = {
  'checkout.step': 'payment',
  'checkout.cart': PRODUCTS.slice(0, 2).map((product) => ({
    id: product.id,
    quantity: 1,
  })),
  'dismissed.banners': ['spring-sale', 'newsletter'],
}

export const STORAGE_KEYS = Object.keys(LOCAL_STORAGE_VALUES)
export const SESSION_STORAGE_KEYS = Object.keys(SESSION_STORAGE_VALUES)

export const FORM_FIELD_IDS = Array.from(
  { length: 200 },
  (_, index) => `field-${index}`,
)

export const REQUEST_HEADERS: Record<string, string> = {
  'accept-language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
}
