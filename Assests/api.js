const API = {
  async request(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }

    if (!response.ok) {
      throw new Error(payload.message || "Something went wrong.");
    }

    return payload;
  },

  getCurrentUser() {
    return this.request("/api/auth/me");
  },

  getServerInfo() {
    return this.request("/api/server-info");
  },

  createRazorpayOrder(body) {
    return this.request("/api/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  verifyRazorpayPayment(body) {
    return this.request("/api/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  login(body) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  register(body) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  },

  listUsers() {
    return this.request("/api/users");
  },

  listProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/products${query ? `?${query}` : ""}`);
  },

  getProduct(id) {
    return this.request(`/api/products/${id}`);
  },

  listFoodItems(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/food-items${query ? `?${query}` : ""}`);
  },

  getCart() {
    return this.request("/api/cart");
  },

  addToCart(productId, quantity = 1) {
    return this.request("/api/cart", {
      method: "POST",
      body: JSON.stringify({ productId, quantity })
    });
  },

  removeFromCart(id) {
    return this.request(`/api/cart/${id}`, { method: "DELETE" });
  },

  placeOrder(paymentMethod = "UPI", paymentReference = "") {
    return this.request("/api/orders", {
      method: "POST",
      body: JSON.stringify({ paymentMethod, paymentReference })
    });
  },

  getOrder(id) {
    return this.request(`/api/orders/${id}`);
  },

  orderFood(foodItemId, quantity = 1, paymentReference = "") {
    return this.request("/api/food-orders", {
      method: "POST",
      body: JSON.stringify({ foodItemId, quantity, paymentMethod: "UPI", paymentReference })
    });
  },

  saveMovieTicket(data) {
    return this.request("/api/movie-tickets", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },

  listMovieTickets() {
    return this.request("/api/movie-tickets");
  },

  getMovieTicket(id) {
    return this.request(`/api/movie-tickets/${id}`);
  },

  getProfileSummary() {
    return this.request("/api/profile/summary");
  },

  getOrderHistory() {
    return this.request("/api/history/orders");
  },

  getAdminOverview() {
    return this.request("/api/admin/overview");
  },

  setPendingPayment(data) {
    sessionStorage.setItem("trendcart_pending_payment", JSON.stringify(data));
  },

  getPendingPayment() {
    const raw = sessionStorage.getItem("trendcart_pending_payment");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clearPendingPayment() {
    sessionStorage.removeItem("trendcart_pending_payment");
  },

  formatCurrency(value) {
    return `Rs. ${Number(value).toLocaleString("en-IN")}`;
  }
};

window.TrendCartAPI = API;
