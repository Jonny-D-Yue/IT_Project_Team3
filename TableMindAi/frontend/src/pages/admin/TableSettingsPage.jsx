import { useEffect, useState } from "react";

import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import TableSettingsForm from "../../components/admin/TableSettingsForm";
import { getRestaurantRequest, updateRestaurantRequest } from "../../api/restaurantApi";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

export default function TableSettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    address: "",
    totalTables: "",
    currency: "CAD",
    taxRate: 0.05,
    isOpen: true,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await getRestaurantRequest();
        setForm({
          name: response.name || "",
          address: response.address || "",
          totalTables: response.totalTables || "",
          currency: response.currency || "CAD",
          taxRate: response.taxRate ?? 0.05,
          isOpen: Boolean(response.isOpen),
        });
      } finally {
        setLoading(false);
      }
    };

    loadRestaurant();
  }, []);

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateRestaurantRequest({
        ...form,
        totalTables: Number(form.totalTables),
        taxRate: Number(form.taxRate),
      });
      showToast({
        title: "Settings updated",
        message: "Restaurant settings were saved successfully.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Update failed",
        message: getApiErrorMessage(error, "Unable to update restaurant settings."),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader label="Loading table settings..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Restaurant Settings"
        description="Update the basic restaurant profile, total tables, and service availability."
      />
      <TableSettingsForm form={form} onChange={handleChange} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
