# NOBELLE Admin Dashboard Redesign

A redesign plan for the NOBELLE admin dashboard: a premium fashion-commerce management system rather than a generic template. The **sidebar** is the main navigation, and the **top bar** handles search, notifications and the admin profile.

## Table of Contents

- [Overall Structure](#overall-structure)
- [Sidebar Design](#sidebar-design)
- [Top Navigation](#top-navigation)
- [Pages](#pages)
  - [Dashboard](#dashboard)
  - [Orders](#orders)
  - [Products](#products)
  - [Inventory](#inventory)
  - [Customers](#customers)
  - [Payments](#payments)
  - [Promotions](#promotions)
  - [Website Manager](#website-manager)
  - [Analytics](#analytics)
  - [Reviews](#reviews)
  - [Notifications](#notifications)
  - [Settings](#settings)
- [Recommended Visual Layout](#recommended-visual-layout)
- [Visual Identity](#visual-identity)

---

## Overall Structure

```text
NOBELLE ADMIN
│
├── Dashboard
├── Orders
│   ├── All Orders
│   ├── Pending
│   ├── Processing
│   ├── Shipped
│   ├── Delivered
│   ├── Cancelled
│   └── Returns & Refunds
│
├── Products
│   ├── All Products
│   ├── Add Product
│   ├── Categories
│   └── Collections
│
├── Inventory
│   ├── Stock Overview
│   ├── Low Stock
│   └── Stock History
│
├── Customers
├── Payments
├── Promotions
│   ├── Coupons
│   └── Discounts
│
├── Website Manager
├── Analytics
├── Reviews
├── Notifications
├── Admin & Staff
└── Settings
```

## Sidebar Design

The sidebar sits on the **left side** of the dashboard and uses NOBELLE's burgundy/red branding. The burgundy should feel elegant rather than overly dark.

**Header**

> **NOBELLE**
> *Admin Panel*

**Navigation (icons + labels)**

```text
▣  Dashboard

STORE
▤  Orders
▦  Products
▥  Inventory
♙  Customers

FINANCE
▣  Payments
◇  Promotions

MANAGEMENT
▤  Website
▥  Analytics
☆  Reviews
♢  Notifications

SYSTEM
♙  Admin & Staff
⚙  Settings
```

**Footer**

```text
┌────────────────────────┐
│ [Photo] Admin          │
│ Super Administrator    │
│                   ⋮    │
└────────────────────────┘

↪ Logout
```

**Behaviour**

- **Desktop:** collapsible. The menu button reduces the sidebar to icons.
- **Mobile:** hidden by default and opens as a drawer when the hamburger button is clicked.

## Top Navigation

A clean top bar above the main content.

```text
☰   Dashboard        [ Search anything... ]      🔔    Admin ▼
```

- **Search:** should eventually search products, orders and customers rather than being decorative.
- **Notification bell:** shows unread notifications such as new orders, low stock, payment issues and refund requests.

---

## Pages

### Dashboard

**Welcome back, Admin**
*Here's what's happening with NOBELLE today.*

**Date filters (right side):** `Today` `7 Days` `30 Days` `This Year` `Custom`

**Primary cards**

```text
┌────────────────┐ ┌────────────────┐
│ TOTAL REVENUE  │ │ TOTAL ORDERS   │
│ ₦2,480,500     │ │ 1,284          │
│ ↑ 12.5%        │ │ ↑ 8.2%         │
└────────────────┘ └────────────────┘

┌────────────────┐ ┌────────────────┐
│ CUSTOMERS      │ │ PRODUCTS SOLD  │
│ 846            │ │ 1,532          │
│ ↑ 6.4%         │ │ ↑ 10.1%        │
└────────────────┘ └────────────────┘
```

**Sections**

1. **Sales Overview:** a large chart showing Revenue and Orders, with date filters.
2. **Order Status:** a summary of Pending, Processing, Shipped, Delivered and Cancelled orders (beside or beneath the chart).
3. **Recent Orders:** one of the most important sections.

   ```text
   Recent Orders                           View All →

   Order       Customer       Amount       Payment      Status
   #NBL1028    Sarah James    ₦45,000      Paid         Processing
   #NBL1027    Aisha Bello    ₦72,500      Paid         Shipped
   #NBL1026    Tola Ade       ₦28,000      Pending      Pending
   ```

   Clicking an order opens its complete order details.

4. **Inventory Overview:** **142 Products** · **1,284 Units in Stock** · **8 Low Stock** · **3 Out of Stock**

   Products requiring attention:

   ```text
   LOW STOCK

   Adunni Ankara Dress
   Burgundy / M
   3 remaining

   Amara Two-Piece
   Black / L
   2 remaining
   ```

   Includes a **View Inventory** button.

5. **Top Selling Products:** product image, name, category/collection, units sold, revenue and remaining stock. Use actual NOBELLE product images so the dashboard stays connected to the fashion brand.

### Orders

**Summary cards:** All Orders | Pending | Processing | Shipped | Delivered | Cancelled

```text
Search orders...

[Status ▼] [Payment ▼] [Date ▼]          [Export]

□ Order ID
  Customer
  Items
  Amount
  Payment
  Status
  Date
  Actions
```

Clicking **View** opens the complete order page with:

- Customer information
- Delivery address
- Products ordered (size/colour)
- Payment information
- Order timeline
- Shipping information
- Buttons to update the status

### Products

**Products**
*Manage your NOBELLE product catalogue.*

`+ Add Product`

**Cards:** Total Products | Active | Draft | Out of Stock

Followed by filters and the product table.

| Column | Notes |
|---|---|
| Product Image | |
| Product Name | |
| Category | |
| Collection | |
| Price | |
| Stock | |
| Status | |
| Actions | View · Edit · Duplicate · Archive · Delete |

#### Add Product

Separate sections instead of one cluttered form:

| Section | Fields |
|---|---|
| **Product Information** | Name, description, category, collection, tags |
| **Product Images** | Main image and gallery images with drag-and-drop upload |
| **Pricing** | Regular price, sale price, cost price |
| **Variants** | Sizes (XS, S, M, L, XL, XXL), colours, SKU and stock for each combination |
| **Additional Information** | Fabric, fit, care instructions, style details, size guide |
| **Publishing** | Draft/Active, Featured Product, New Arrival, Best Seller, publish date |

**Actions:** `Save Draft` `Preview` `Publish Product`

### Inventory

Focused specifically on stock.

**Cards:** Total Stock | Low Stock | Out of Stock | Stock Value

**Searchable inventory table**

```text
Product | Variant | SKU | Stock | Reserved | Available | Status
```

- Clicking a product lets the admin adjust stock.
- Every adjustment **requires a reason:** New Stock / Return / Damaged / Correction / Other.
- **Stock History** records who changed inventory and when.

### Customers

**Cards:** Total Customers | New Customers | Returning | VIP Customers

```text
Customer
Email
Phone
Orders
Total Spent
Last Order
Status
Action
```

Clicking a customer shows their complete profile, order history, addresses, wishlist, total spending and returns.

### Payments

**Cards:** Total Revenue | Successful Payments | Pending | Failed | Refunded

**Transaction history:** Transaction ID, Order, Customer, Amount, Payment Method, Reference, Status and Date.

### Promotions

Manages **Coupons**, **Discounts** and **Sales Campaigns**.

```text
NOBELLE20

20% OFF
Minimum Order: ₦50,000

Used: 34 / 100
Expires: Dec 31

ACTIVE
```

Admins can create, pause, edit and delete promotions.

### Website Manager

Strongly recommended for NOBELLE. Instead of editing frontend code whenever something on the website changes, the admin dashboard manages:

- Homepage Hero and Hero Image
- Announcement Bar
- Promotional Banners
- Featured Products and Featured Collections
- New Arrivals and Best Sellers
- Homepage Sections
- Footer information

```text
Homepage Hero

Hero Title
[ Discover Timeless African Elegance ]

Subtitle
[ Contemporary Nigerian fashion crafted... ]

Button Text
[ Shop Collection ]

Button Link
[ /collections/new-arrivals ]

Hero Image
[ Upload Image ]

[ Preview ]                 [ Save Changes ]
```

Saving updates the actual NOBELLE website through the backend.

### Analytics

**Tabs:** Overview | Sales | Products | Customers | Orders

**Metrics:**

- Revenue trend
- Sales by month
- Sales by collection
- Top-selling products
- Slow-moving products
- Average order value
- New vs returning customers
- Order completion and cancellation rates

### Reviews

Admin sees customer reviews with **Product, Customer, Rating, Review, Date and Status**.

**Actions:** Approve | Hide | Delete | Reply

### Notifications

A dedicated notification centre. Unread notifications also appear under the top-bar bell.

```text
New Order
Order #NBL1029 has been placed.
2 minutes ago

Low Stock
Adunni Dress — Medium has only 2 left.
18 minutes ago

Payment Successful
₦45,000 received for #NBL1028.
32 minutes ago
```

### Settings

**Tabs:** General | Store | Payments | Shipping | Notifications | Security | Policies

- **Store:** NOBELLE name, logo, email, phone, currency and business information.
- **Shipping:** eventually lets you configure delivery locations, fees and free-delivery thresholds.

---

## Recommended Visual Layout

```text
┌──────────────────┬──────────────────────────────────────────────┐
│                  │ ☰ Dashboard       Search...       🔔 Admin │
│     NOBELLE      ├──────────────────────────────────────────────┤
│    ADMIN PANEL   │                                              │
│                  │ Welcome back, Admin              [30 Days ▼]│
│  ▣ Dashboard     │                                              │
│                  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐│
│  STORE           │ │ Revenue │ │ Orders  │ │Customer │ │Sales││
│  ▤ Orders        │ └─────────┘ └─────────┘ └─────────┘ └─────┘│
│  ▦ Products      │                                              │
│  ▥ Inventory     │ ┌─────────────────────┐ ┌──────────────────┐│
│  ♙ Customers     │ │                     │ │ Order Status     ││
│                  │ │   Sales Overview    │ │                  ││
│  FINANCE         │ │      CHART          │ │ Pending      12 ││
│  ▣ Payments      │ │                     │ │ Processing    8 ││
│  ◇ Promotions    │ └─────────────────────┘ └──────────────────┘│
│                  │                                              │
│  MANAGEMENT      │ Recent Orders                    View All → │
│  ▤ Website       │ ┌──────────────────────────────────────────┐│
│  ▥ Analytics     │ │ #NBL1028  Sarah   ₦45,000  Processing ││
│  ☆ Reviews       │ │ #NBL1027  Aisha   ₦72,500  Shipped    ││
│  ♢ Notifications │ └──────────────────────────────────────────┘│
│                  │                                              │
│  SYSTEM          │ Top Products              Low Stock         │
│  ♙ Admin & Staff │ ┌─────────────────────┐ ┌──────────────────┐│
│  ⚙ Settings      │ │ Product performance │ │ Stock warnings   ││
│                  │ └─────────────────────┘ └──────────────────┘│
│ ──────────────── │                                              │
│ 👤 Admin         │                                              │
│ ↪ Logout         │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

## Visual Identity

- Clean white/off-white main workspace
- Burgundy/red for the sidebar and primary actions
- Black/charcoal typography
- Subtle gray borders
- Rounded-but-not-overly-rounded cards
- Plenty of whitespace
- Real product photography
- **No gradients**

This keeps the admin consistent with the premium Nigerian/African fashion identity of NOBELLE while making it feel like a serious business tool.
