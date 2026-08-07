# 🪔 nityasamagri — Complete API Documentation

> **Base URL:** `https://api.nityasamagri.com/api/v1`
> **WebSocket:** `wss://api.nityasamagri.com/ws`
> **Version:** 1.0.0 · **Last Updated:** June 2026

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [Auth Endpoints](#auth-endpoints)
3. [Products](#products)
4. [Orders](#orders)
5. [Payments](#payments)
6. [Pandit Bookings](#pandit-bookings)
7. [Users](#users)
8. [Coupons](#coupons)
9. [Reviews](#reviews)
10. [Delivery / Shipping](#delivery--shipping)
11. [Notifications](#notifications)
12. [Store / CMS](#store--cms)
13. [WebSocket Events](#websocket-events)
14. [Error Codes](#error-codes)
15. [Rate Limits](#rate-limits)

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header.

```http
Authorization: Bearer <access_token>
```

### Token lifecycle
| Token | Expiry | Refresh |
|-------|--------|---------|
| Access Token | 15 minutes | Use refresh token |
| Refresh Token | 30 days | Re-login required |

### Roles & permissions
| Role | Access |
|------|--------|
| `customer` | Own orders, bookings, profile |
| `admin` | All orders, users, products, reports |
| `super_admin` | Everything including settings & deletion |
| `order_manager` | Orders + shipping management |
| `warehouse` | Stock updates + packing |
| `support` | Tickets, returns, refunds |

---

## 👤 Auth Endpoints

### Register
```http
POST /auth/register
```

**Request body:**
```json
{
  "name":     "Rahul Sharma",
  "phone":    "+919876543210",
  "email":    "rahul@gmail.com",
  "password": "SecurePass@2026"
}
```

**Response `201`:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your phone number.",
  "data": {
    "user": {
      "id":    "uuid",
      "name":  "Rahul Sharma",
      "phone": "+919876543210",
      "role":  "customer"
    }
  }
}
```

---

### Login (Password)
```http
POST /auth/login
```

**Request body:**
```json
{
  "phone":    "+919876543210",
  "password": "SecurePass@2026"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id":    "uuid",
      "name":  "Rahul Sharma",
      "phone": "+919876543210",
      "role":  "customer"
    },
    "accessToken":  "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

### Request OTP
```http
POST /auth/otp/request
```
> Rate limited: 3 requests per 10 minutes per phone number

**Request body:**
```json
{ "phone": "+919876543210" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": { "message": "OTP sent successfully" }
}
```

---

### Verify OTP
```http
POST /auth/otp/verify
```

**Request body:**
```json
{
  "phone": "+919876543210",
  "otp":   "483921"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user":         { "id": "uuid", "name": "Rahul Sharma", "phone": "+919876543210", "role": "customer" },
    "accessToken":  "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "isNewUser":    false
  }
}
```

---

### Refresh Token
```http
POST /auth/refresh
```

**Request body:**
```json
{ "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken":  "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
  }
}
```

---

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response `200`:**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id":            "uuid",
      "name":          "Rahul Sharma",
      "phone":         "+919876543210",
      "email":         "rahul@gmail.com",
      "role":          "customer",
      "isVerified":    true,
      "loyaltyPoints": 2450,
      "loyaltyTier":   "gold",
      "createdAt":     "2024-03-15T00:00:00Z",
      "lastLoginAt":   "2026-06-01T10:32:00Z"
    }
  }
}
```

---

## 📦 Products

### List Products
```http
GET /products
```

**Query parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `q` | string | — | Full-text search (name, description, SKU) |
| `categoryId` | uuid | — | Filter by category |
| `minPrice` | number | — | Minimum price filter |
| `maxPrice` | number | — | Maximum price filter |
| `inStock` | boolean | — | Only in-stock products |
| `isFeatured` | boolean | — | Featured products only |
| `status` | string | `active` | `draft` \| `active` \| `archived` |
| `sortBy` | string | `createdAt` | `price` \| `createdAt` \| `name` \| `stock` \| `sold` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page (max 100) |

**Example:**
```http
GET /products?q=cow+ghee&categoryId=uuid&inStock=true&sortBy=price&sortOrder=asc&page=1&limit=20
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id":          "uuid",
        "name":        "Pure A2 Cow Ghee",
        "slug":        "pure-a2-cow-ghee",
        "price":       299,
        "mrp":         349,
        "stock":       120,
        "gstPct":      5,
        "isFeatured":  true,
        "status":      "active",
        "category":    { "id": "uuid", "name": "Ghee & Oils" },
        "variants":    [
          { "id": "uuid", "label": "250ml", "price": 179, "mrp": 220, "stock": 80 },
          { "id": "uuid", "label": "500ml", "price": 299, "mrp": 349, "stock": 120 }
        ]
      }
    ],
    "pagination": {
      "page":  1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

---

### Get Product by Slug
```http
GET /products/:slug
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "product": {
      "id":          "uuid",
      "name":        "Pure A2 Cow Ghee",
      "slug":        "pure-a2-cow-ghee",
      "description": "Made using traditional Bilona churning...",
      "price":       299,
      "mrp":         349,
      "stock":       120,
      "gstPct":      5,
      "hsnCode":     "0405",
      "tags":        ["best-seller", "a2-ghee", "havan"],
      "category":    { "id": "uuid", "name": "Ghee & Oils", "slug": "ghee-oils" },
      "variants":    [...],
      "images":      [{ "url": "https://s3...", "isPrimary": true }],
      "reviews":     [...],
      "_count":      { "reviews": 521 }
    },
    "related": [...]
  }
}
```

---

### Create Product *(Admin)*
```http
POST /products
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "name":        "Pure A2 Cow Ghee",
  "categoryId":  "uuid",
  "sku":         "GHEE-A2-500",
  "mrp":         349,
  "price":       299,
  "costPrice":   180,
  "gstPct":      5,
  "hsnCode":     "0405",
  "stock":       120,
  "lowStockAt":  10,
  "weight":      550,
  "isFeatured":  true,
  "status":      "active",
  "tags":        ["best-seller", "a2-ghee"],
  "variants": [
    { "label": "250ml", "sku": "GHEE-A2-250", "price": 179, "mrp": 220, "stock": 80 },
    { "label": "500ml", "sku": "GHEE-A2-500", "price": 299, "mrp": 349, "stock": 120 }
  ]
}
```

---

### Update Stock *(Admin/Warehouse)*
```http
PATCH /products/:id/stock
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "quantity":  50,
  "operation": "add",
  "note":      "Restocked from supplier"
}
```

> `operation`: `set` | `add` | `subtract`

---

## 🛒 Orders

### Create Order
```http
POST /orders
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{
  "items": [
    { "productId": "uuid", "variantId": "uuid", "qty": 2, "price": 299 },
    { "productId": "uuid", "qty": 1, "price": 499 }
  ],
  "addressId":     "uuid",
  "paymentMethod": "razorpay",
  "couponCode":    "DIWALI20",
  "deliveryDate":  "2026-06-15T00:00:00Z",
  "deliverySlot":  "10 AM - 12 PM",
  "notes":         "Please pack fragile items carefully"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id":            "uuid",
      "orderId":       "ORD-2026-1999",
      "status":        "pending",
      "paymentStatus": "pending",
      "subtotal":      897,
      "gst":           44,
      "shipping":      0,
      "discount":      179,
      "total":         762,
      "items": [
        {
          "productId": "uuid",
          "qty":       2,
          "price":     299,
          "total":     598,
          "product":   { "name": "Pure A2 Cow Ghee", "sku": "GHEE-A2-500" }
        }
      ]
    }
  }
}
```

---

### Get My Orders
```http
GET /orders
Authorization: Bearer <customer_token>
```

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by order status |
| `page` | number | Page number |
| `limit` | number | Items per page |

---

### Get Order Detail
```http
GET /orders/:orderId
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "order": {
      "orderId":       "ORD-2026-1999",
      "status":        "shipped",
      "paymentStatus": "paid",
      "total":         762,
      "courierName":   "Shiprocket",
      "trackingNo":    "SR20261999001",
      "items":         [...],
      "address":       {...},
      "timeline": [
        { "status": "pending",   "note": "Order placed",          "createdAt": "2026-06-01T10:30:00Z" },
        { "status": "confirmed", "note": "Payment received",       "createdAt": "2026-06-01T10:32:00Z" },
        { "status": "shipped",   "note": "Shipped via Shiprocket", "createdAt": "2026-06-01T16:00:00Z" }
      ]
    }
  }
}
```

---

### Cancel Order
```http
POST /orders/:orderId/cancel
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{ "reason": "Changed my mind" }
```

---

### Update Order Status *(Admin)*
```http
PATCH /orders/:orderId/status
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "status":      "shipped",
  "trackingNo":  "SR20261999001",
  "courierName": "Shiprocket",
  "note":        "Dispatched from Mohali warehouse"
}
```

> **Status flow:** `pending` → `confirmed` → `packed` → `ready_for_pickup` → `shipped` → `out_for_delivery` → `delivered`
> **Cancel flow:** Any status before `shipped` → `cancelled`
> **Return flow:** `delivered` → `returned` → `refunded`

---

### Admin — All Orders
```http
GET /orders/admin/all
Authorization: Bearer <admin_token>
```

**Query parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Order status filter |
| `payment` | string | Payment method filter |
| `q` | string | Search order ID, customer name/phone |
| `dateFrom` | ISO date | Start date filter |
| `dateTo` | ISO date | End date filter |
| `page` | number | Page number |
| `limit` | number | Items per page |

---

### Admin — Order Statistics
```http
GET /orders/admin/stats
Authorization: Bearer <admin_token>
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalOrders":   15420,
    "todayOrders":   87,
    "monthRevenue":  482000,
    "statusCounts": {
      "pending":    87,
      "confirmed":  143,
      "shipped":    312,
      "delivered":  645
    },
    "paymentSplit": {
      "razorpay":   480,
      "upi":        612,
      "cod":        192
    }
  }
}
```

---

## 💳 Payments

### Create Razorpay Order
```http
POST /payments/create-order
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{ "orderId": "ORD-2026-1999" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "razorpayOrderId": "order_PZabc123",
    "amount":          76200,
    "currency":        "INR",
    "keyId":           "rzp_live_XXXXX",
    "prefill":         { "name": "", "email": "", "contact": "" }
  }
}
```

---

### Verify Payment
```http
POST /payments/verify
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{
  "razorpayOrderId":   "order_PZabc123",
  "razorpayPaymentId": "pay_PZdef456",
  "razorpaySignature": "abc123hmac...",
  "orderId":           "ORD-2026-1999"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data":    { "orderId": "ORD-2026-1999" }
}
```

---

### Razorpay Webhook
```http
POST /payments/webhook
X-Razorpay-Signature: <hmac_signature>
Content-Type: application/json (raw body)
```

> **Handled events:**
> - `payment.captured` — Mark order as paid
> - `payment.failed` — Mark payment as failed
> - `refund.processed` — Mark order as refunded

---

### Initiate Refund *(Admin)*
```http
POST /payments/refund
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "orderId": "ORD-2026-1999",
  "amount":  299,
  "reason":  "Product damaged on delivery"
}
```

> Omit `amount` for full refund.

---

### Payment History
```http
GET /payments/history
Authorization: Bearer <customer_token>
```

---

## 🙏 Pandit Bookings

### Create Booking
```http
POST /bookings
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{
  "panditId":     "uuid",
  "serviceId":    "uuid",
  "ceremonyDate": "2026-06-15T00:00:00Z",
  "ceremonyTime": "10:00 AM",
  "address":      "B-204 Palam Vihar, New Delhi",
  "participants": 15,
  "language":     "Hindi",
  "samagriKit":   true,
  "notes":        "Please bring extra camphor"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingId":     "BK-2026-0847",
      "status":        "pending",
      "panditCharges": 3500,
      "samagriAmount": 299,
      "total":         3799
    }
  }
}
```

---

### Get My Bookings
```http
GET /bookings
Authorization: Bearer <customer_token>
```

---

### Accept / Reject Booking *(Pandit)*
```http
PATCH /bookings/:bookingId/respond
Authorization: Bearer <pandit_token>
```

**Request body:**
```json
{
  "action": "accept",
  "note":   "Confirmed. I will arrive 15 minutes early."
}
```

> `action`: `accept` | `reject`

---

### Complete Booking *(Pandit/Admin)*
```http
PATCH /bookings/:bookingId/complete
Authorization: Bearer <pandit_token>
```

---

## 👥 Users

### Get User Profile
```http
GET /users/profile
Authorization: Bearer <customer_token>
```

---

### Update Profile
```http
PATCH /users/profile
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{
  "name":   "Rahul Sharma",
  "email":  "rahul@gmail.com",
  "gender": "Male",
  "dob":    "1990-03-15"
}
```

---

### Manage Addresses
```http
GET    /users/addresses                  # List addresses
POST   /users/addresses                  # Add address
PATCH  /users/addresses/:id              # Update address
DELETE /users/addresses/:id              # Delete address
PATCH  /users/addresses/:id/default      # Set as default
```

**Add address body:**
```json
{
  "label":     "Home",
  "name":      "Rahul Sharma",
  "phone":     "+919876543210",
  "line1":     "B-204, Palam Vihar",
  "line2":     "Vasant Kunj",
  "city":      "New Delhi",
  "state":     "Delhi",
  "pin":       "110070",
  "country":   "India"
}
```

---

### Wishlist
```http
GET    /users/wishlist                   # Get wishlist
POST   /users/wishlist/:productId        # Add to wishlist
DELETE /users/wishlist/:productId        # Remove from wishlist
```

---

### Loyalty Points
```http
GET /users/loyalty                       # Get points balance + history
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "points":  2450,
    "tier":    "gold",
    "history": [
      { "type": "earned",   "points": 80,   "desc": "Order #ORD-2026-1842", "createdAt": "..." },
      { "type": "redeemed", "points": -200, "desc": "Redeemed on order",    "createdAt": "..." }
    ]
  }
}
```

---

### Admin — List Users
```http
GET /users/admin/all
Authorization: Bearer <admin_token>
```

**Query parameters:** `q`, `status`, `tier`, `city`, `page`, `limit`

---

### Admin — Block/Unblock User
```http
PATCH /users/admin/:userId/status
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{ "status": "blocked", "reason": "Fraudulent activity" }
```

---

## 🏷️ Coupons

### Validate Coupon
```http
POST /coupons/validate
Authorization: Bearer <customer_token>
```

**Request body:**
```json
{
  "code":       "DIWALI20",
  "orderValue": 799
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "coupon": {
      "code":        "DIWALI20",
      "type":        "percent",
      "value":       20,
      "maxDiscount": 200,
      "discount":    159,
      "description": "20% off — Diwali special"
    }
  }
}
```

---

### List Active Coupons *(Public)*
```http
GET /coupons/active
```

---

### Admin — Create Coupon
```http
POST /coupons
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "code":         "NAVRATRI25",
  "type":         "percent",
  "value":        25,
  "maxDiscount":  300,
  "minOrderValue":699,
  "usageLimit":   300,
  "isActive":     true,
  "expiresAt":    "2026-10-11",
  "description":  "25% off for Navratri",
  "applicableTo": "category",
  "category":     "festival-kits",
  "festivalTag":  "Navratri"
}
```

---

### Admin — Update / Delete Coupon
```http
PATCH  /coupons/:id
DELETE /coupons/:id
Authorization: Bearer <admin_token>
```

---

## ⭐ Reviews

### Get Product Reviews
```http
GET /reviews/product/:productId
```

**Query parameters:** `page`, `limit`, `sort` (`recent` | `helpful` | `highest` | `lowest`), `rating`

---

### Submit Review
```http
POST /reviews
Authorization: Bearer <customer_token>
```

**Request body (multipart/form-data):**
```json
{
  "productId": "uuid",
  "orderId":   "uuid",
  "rating":    5,
  "title":     "Exactly like my grandmother's ghee",
  "body":      "The aroma is so authentic...",
  "tags":      ["Authentic", "Temple grade", "Pure quality"]
}
```
> Attach up to 3 photos as `photos[]` multipart fields.

---

### Mark Review Helpful
```http
POST /reviews/:reviewId/helpful
Authorization: Bearer <customer_token>
```

---

### Admin — Moderate Review
```http
PATCH /reviews/:reviewId/moderate
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "status":     "approved",
  "featured":   true,
  "adminNote":  ""
}
```

> `status`: `approved` | `rejected`

---

### Admin — Delete Review
```http
DELETE /reviews/:reviewId
Authorization: Bearer <admin_token>
```

---

## 🚚 Delivery / Shipping

### Check Shipping Rates
```http
GET /integrations/shipping/rates?pincode=110070&weight=0.5&orderValue=599&cod=false
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "freeShipping":  true,
    "shippingCharge":0,
    "message":       "Free delivery on this order!",
    "estimatedDays": "3-5 business days"
  }
}
```

---

### Track Shipment
```http
GET /integrations/shipping/track/:awb
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "tracking": {
      "awb":             "SR20261999001",
      "status":          "In Transit",
      "currentLocation": "Delhi Sorting Hub",
      "deliveryDate":    null,
      "activities": [
        { "date": "2026-06-01 09:00", "activity": "Picked up", "location": "Mohali Hub",       "status": "Picked Up" },
        { "date": "2026-06-01 18:45", "activity": "In transit", "location": "Delhi Sorting Hub","status": "In Transit" }
      ]
    }
  }
}
```

---

### Create Shipment *(Admin)*
```http
POST /integrations/shipping/create
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "orderId":   "ORD-2026-1999",
  "courierId": 5
}
```

---

### Schedule Pickup *(Admin)*
```http
POST /integrations/shipping/pickup
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{ "shipmentIds": [123456, 123457] }
```

---

### Handle NDR *(Admin)*
```http
POST /integrations/shipping/ndr
Authorization: Bearer <admin_token>
```

**Request body:**
```json
{
  "awb":           "SR20261999001",
  "action":        "re-attempt",
  "reattemptDate": "2026-06-05",
  "remarks":       "Customer requested morning delivery"
}
```

---

### Shiprocket Webhook
```http
POST /integrations/shipping/webhook
```
> IP whitelist required in production. Handled events update order status + push WebSocket + SMS.

---

## 🔔 Notifications

### Get Notification Config for Razorpay
```http
GET /integrations/payment/config/:orderId
Authorization: Bearer <customer_token>
```

---

### Check Payment Status
```http
GET /integrations/payment/status/:paymentId
Authorization: Bearer <customer_token>
```

---

## 🏠 Store / CMS

### Get Homepage Sections
```http
GET /store/homepage
```

---

### Get Active Banners
```http
GET /store/banners
```

---

### Get Festival Campaigns
```http
GET /store/festivals
```

**Query parameters:** `status` (`active` | `upcoming` | `completed`)

---

### Get Active Announcement
```http
GET /store/announcement
```

---

### Get Blog Posts
```http
GET /store/blog
```

**Query parameters:** `category`, `page`, `limit`

---

### Admin — Update Homepage Layout
```http
PUT /store/homepage
Authorization: Bearer <admin_token>
```

---

## 📡 WebSocket Events

### Connect
```javascript
const token = "your_access_token";
const ws = new WebSocket(`wss://api.thenityasamagri.com/ws?token=${token}`);
```

### Events sent to customer

| Event | Trigger | Payload |
|-------|---------|---------|
| `CONNECTED` | On connect | `{ message, timestamp }` |
| `ORDER_STATUS_UPDATE` | Order status changes | `{ orderId, status, trackingNo, courierName, timestamp }` |
| `PAYMENT_SUCCESS` | Payment verified | `{ orderId, amount, timestamp }` |
| `PAYMENT_FAILED` | Payment fails | `{ orderId, timestamp }` |
| `BOOKING_CONFIRMED` | Pandit accepts | `{ bookingId, panditName, timestamp }` |
| `BOOKING_CANCELLED` | Booking cancelled | `{ bookingId, reason, timestamp }` |

### Events sent to admin

| Event | Trigger | Payload |
|-------|---------|---------|
| `NEW_ORDER_ALERT` | New order placed | `{ orderId, amount, customerId, timestamp }` |
| `ORDER_STATUS_UPDATE` | Any order update | `{ orderId, status, timestamp }` |
| `LOW_STOCK_ALERT` | Stock below threshold | `{ productId, productName, stock, threshold }` |
| `PAYMENT_FAILED` | Payment failure | `{ orderId, paymentId, timestamp }` |

### Example handler
```javascript
ws.onmessage = (event) => {
  const { event: type, payload } = JSON.parse(event.data);
  switch (type) {
    case "ORDER_STATUS_UPDATE":
      updateOrderStatus(payload.orderId, payload.status);
      showToast(`Order ${payload.orderId} is now ${payload.status}`);
      break;
    case "PAYMENT_SUCCESS":
      redirectToSuccess(payload.orderId);
      break;
    case "NEW_ORDER_ALERT":
      playNotificationSound();
      refreshOrderList();
      break;
  }
};

// Reconnect on disconnect
ws.onclose = () => {
  setTimeout(() => reconnect(), 3000);
};
```

---

## ❌ Error Codes

All errors follow this format:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors":  [{ "field": "phone", "message": "Invalid mobile number" }]
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Bad Request — validation failed |
| `401` | Unauthorized — missing or invalid token |
| `403` | Forbidden — insufficient role/permissions |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — duplicate entry (phone, SKU, slug) |
| `422` | Unprocessable — business logic error (e.g. insufficient stock) |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |
| `502` | Bad Gateway — third-party service error (Razorpay, Shiprocket) |

### Common error messages

| Scenario | Message |
|----------|---------|
| Invalid OTP | `Invalid or expired OTP` |
| OTP rate limit | `Too many OTP requests. Try again in 10 minutes.` |
| Bad token | `Invalid or expired token` |
| No stock | `Insufficient stock for {product_name}` |
| Invalid coupon | `Invalid coupon code` |
| Min order not met | `Minimum order ₹{amount} required for this coupon` |
| Already paid | `Order already paid` |
| Cannot cancel | `Cannot cancel order after it has been shipped` |
| Payment verify fail | `Payment verification failed. Invalid signature.` |

---

## ⚡ Rate Limits

| Endpoint group | Limit | Window |
|----------------|-------|--------|
| Global (all endpoints) | 100 requests | 15 minutes |
| `/auth/login` | 5 requests | 10 minutes |
| `/auth/register` | 3 requests | 10 minutes |
| `/auth/otp/request` | 3 requests | 10 minutes |
| `/payments/*` | 30 requests | 15 minutes |
| All others | 60 requests | 15 minutes |

Rate limit headers returned on every response:
```http
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 87
X-RateLimit-Reset:     1717200000
```

When exceeded:
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

## 🔧 Health Check

```http
GET /health
```

**Response `200`:**
```json
{
  "status":    "ok",
  "timestamp": "2026-06-01T10:30:00.000Z",
  "version":   "1.0.0"
}
```

---

## 📝 Pagination

All list endpoints return pagination metadata:

```json
{
  "pagination": {
    "page":  1,
    "limit": 20,
    "total": 1250,
    "pages": 63
  }
}
```

---

*© 2026 Thenityasamagri · Mohali, Punjab · support@thenityasamagri.com*
