export const STORAGE_KEYS = {
  authToken: "tablemind_auth_token",
  authUser: "tablemind_auth_user",
  cartItems: "tablemind_cart_items",
  restaurantId: "tablemind_restaurant_id",
  tableNumber: "tablemind_table_number",
  sessionToken: "tablemind_session_token",
};

export const ORDER_STATUSES = ["NEW", "PREPARING", "READY", "SERVED"];
export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"];
export const TABLE_STATUSES = ["EMPTY", "OCCUPIED", "AWAITING_PAYMENT"];
export const SPLIT_BILL_STATUSES = ["OPEN", "PAID", "VOID"];
export const ORDER_SOURCES = ["CUSTOMER", "WAITER"];

export const QUICK_PROMPTS = [
  "What should I eat under $20?",
  "Suggest something low calorie.",
  "I don't want spicy food.",
  "I am allergic to peanuts.",
];
