import api from "./axios";

export const createOrderRequest = async (payload) => {
  const { data } = await api.post("/orders", payload);
  return data.data;
};

export const createStaffOrderRequest = async (payload) => {
  const { data } = await api.post("/orders/staff-create", payload);
  return data.data;
};

export const getOrdersRequest = async (params = {}) => {
  const { data } = await api.get("/orders", { params });
  return data.data;
};

export const getOrderRequest = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
};

export const updateOrderStatusRequest = async (id, payload) => {
  const { data } = await api.patch(`/orders/${id}/status`, payload);
  return data.data;
};

export const getOrdersByTableRequest = async (tableNumber) => {
  const { data } = await api.get(`/orders/table/${tableNumber}`);
  return data.data;
};

export const getTableOverviewRequest = async () => {
  const { data } = await api.get("/orders/table-overview");
  return data.data;
};

export const updateOrderPaymentStatusRequest = async (id, payload) => {
  const { data } = await api.patch(`/orders/${id}/payment`, payload);
  return data.data;
};

export const updateTablePaymentStatusRequest = async (tableNumber, payload) => {
  const { data } = await api.patch(`/orders/table/${tableNumber}/payment`, payload);
  return data.data;
};

export const moveTableOrdersRequest = async (tableNumber, payload) => {
  const { data } = await api.patch(`/orders/table/${tableNumber}/move`, payload);
  return data.data;
};

export const getSplitBillsByTableRequest = async (tableNumber) => {
  const { data } = await api.get(`/orders/table/${tableNumber}/splits`);
  return data.data;
};

export const createSplitBillRequest = async (tableNumber, payload) => {
  const { data } = await api.post(`/orders/table/${tableNumber}/splits`, payload);
  return data.data;
};

export const updateSplitBillStatusRequest = async (id, payload) => {
  const { data } = await api.patch(`/orders/splits/${id}/status`, payload);
  return data.data;
};
