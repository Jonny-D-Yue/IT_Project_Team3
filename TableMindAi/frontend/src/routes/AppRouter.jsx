import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/common/ProtectedRoute";
import CustomerLayout from "../layouts/CustomerLayout";
import StaffLayout from "../layouts/StaffLayout";
import AdminLayout from "../layouts/AdminLayout";
import WelcomePage from "../pages/customer/WelcomePage";
import EnterTablePage from "../pages/customer/EnterTablePage";
import ScanTablePage from "../pages/customer/ScanTablePage";
import MenuPage from "../pages/customer/MenuPage";
import CartPage from "../pages/customer/CartPage";
import CheckoutPage from "../pages/customer/CheckoutPage";
import ChatAssistantPage from "../pages/customer/ChatAssistantPage";
import OrderSuccessPage from "../pages/customer/OrderSuccessPage";
import StaffLoginPage from "../pages/staff/StaffLoginPage";
import StaffDashboardPage from "../pages/staff/StaffDashboardPage";
import KitchenPage from "../pages/staff/KitchenPage";
import OrderDetailPage from "../pages/staff/OrderDetailPage";
import TableDetailPage from "../pages/staff/TableDetailPage";
import AdminLoginPage from "../pages/admin/AdminLoginPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import MenuManagementPage from "../pages/admin/MenuManagementPage";
import CategoryManagementPage from "../pages/admin/CategoryManagementPage";
import TableSettingsPage from "../pages/admin/TableSettingsPage";
import AnalyticsPage from "../pages/admin/AnalyticsPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route index element={<WelcomePage />} />
        <Route path="/table" element={<EnterTablePage />} />
        <Route path="/scan/:restaurantId/:tableNumber" element={<ScanTablePage />} />
        <Route element={<ProtectedRoute requireTable />}>
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/assistant" element={<ChatAssistantPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
        </Route>
      </Route>

      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route
        element={<ProtectedRoute allowedRoles={["staff", "admin"]} redirectTo="/staff/login" />}
      >
        <Route element={<StaffLayout />}>
          <Route path="/staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="/staff/kitchen" element={<KitchenPage />} />
          <Route path="/staff/tables/:tableNumber" element={<TableDetailPage />} />
          <Route path="/staff/orders/:id" element={<OrderDetailPage />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={["admin"]} redirectTo="/admin/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/menu" element={<MenuManagementPage />} />
          <Route path="/admin/categories" element={<CategoryManagementPage />} />
          <Route path="/admin/tables" element={<TableSettingsPage />} />
          <Route path="/admin/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
