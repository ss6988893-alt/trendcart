const API = {
  convenienceFeeRates: {
    product: 0.02,
    food: 0.04,
    movie: 0.05
  },

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

  getServerInfo() {
    return this.request("/api/server-info");
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

  listMovies() {
    return this.request("/api/movies");
  },

  getMovieSeatAvailability(movieId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/movies/${movieId}/seats${query ? `?${query}` : ""}`);
  },

  syncMovieSeatLocks(body) {
    return this.request("/api/movie-seat-locks", {
      method: "POST",
      body: JSON.stringify(body)
    });
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

  placeOrder(paymentMethod = "Razorpay", paymentReference = "") {
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
      body: JSON.stringify({ foodItemId, quantity, paymentMethod: "Razorpay", paymentReference })
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

  getAdminCatalog() {
    return this.request("/api/admin/catalog");
  },

  uploadAdminImage(body) {
    return this.request("/api/admin/uploads", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  createAdminProduct(body) {
    return this.request("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  updateAdminProduct(id, body) {
    return this.request(`/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  deleteAdminProduct(id) {
    return this.request(`/api/admin/products/${id}`, { method: "DELETE" });
  },

  createAdminFoodItem(body) {
    return this.request("/api/admin/food-items", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  updateAdminFoodItem(id, body) {
    return this.request(`/api/admin/food-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  deleteAdminFoodItem(id) {
    return this.request(`/api/admin/food-items/${id}`, { method: "DELETE" });
  },

  createAdminMovie(body) {
    return this.request("/api/admin/movies", {
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  updateAdminMovie(id, body) {
    return this.request(`/api/admin/movies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    });
  },

  deleteAdminMovie(id) {
    return this.request(`/api/admin/movies/${id}`, { method: "DELETE" });
  },

  updateAdminOrderStatus(id, orderStatus) {
    return this.request(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ orderStatus })
    });
  },

  updateAdminTicketStatus(id, bookingStatus) {
    return this.request(`/api/admin/movie-tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ bookingStatus })
    });
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
  },

  getConvenienceFeeRate(type = "product") {
    return this.convenienceFeeRates[type] ?? 0.02;
  },

  getPricingBreakdown(amount, type = "product") {
    const subtotal = Math.max(0, Number(amount) || 0);
    const rate = this.getConvenienceFeeRate(type);
    const convenienceFee = subtotal > 0 ? Math.max(1, Math.round(subtotal * rate)) : 0;
    const total = subtotal + convenienceFee;

    return {
      subtotal,
      convenienceFee,
      total,
      rate,
      percentageLabel: `${Math.round(rate * 100)}%`
    };
  }
};

window.TrendCartAPI = API;
