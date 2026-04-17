import { useEffect, useState } from "react";

import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import MenuForm from "../../components/admin/MenuForm";
import MenuTable from "../../components/admin/MenuTable";
import Loader from "../../components/common/Loader";
import { createMenuItemRequest, deleteMenuItemRequest, getMenuRequest, updateMenuItemRequest } from "../../api/menuApi";
import { getCategoriesRequest } from "../../api/categoryApi";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  calories: "",
  imageUrl: "",
  category: "",
  isAvailable: true,
  isOwnerPick: false,
  spicyLevel: "Mild",
  allergens: "",
  tags: "",
};

const mapItemToForm = (item) => ({
  name: item.name,
  description: item.description || "",
  price: item.price,
  calories: item.calories || "",
  imageUrl: item.imageUrl || "",
  category: item.category?._id || "",
  isAvailable: Boolean(item.isAvailable),
  isOwnerPick: Boolean(item.isOwnerPick),
  spicyLevel: item.spicyLevel || "Mild",
  allergens: (item.allergens || []).join(", "),
  tags: (item.tags || []).join(", "),
});

const toPayload = (form) => ({
  ...form,
  price: Number(form.price),
  calories: form.calories ? Number(form.calories) : undefined,
  allergens: form.allergens ? form.allergens.split(",").map((item) => item.trim()).filter(Boolean) : [],
  tags: form.tags ? form.tags.split(",").map((item) => item.trim()).filter(Boolean) : [],
});

export default function MenuManagementPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [menuResponse, categoryResponse] = await Promise.all([
      getMenuRequest(),
      getCategoriesRequest(),
    ]);
    setItems(menuResponse);
    setCategories(categoryResponse);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadData();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      if (editingItem?._id) {
        await updateMenuItemRequest(editingItem._id, toPayload(form));
      } else {
        await createMenuItemRequest(toPayload(form));
      }

      await loadData();
      setEditingItem(null);
      setForm(emptyForm);
      showToast({
        title: editingItem?._id ? "Menu item updated" : "Menu item created",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Save failed",
        message: getApiErrorMessage(error, "Unable to save menu item."),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    try {
      await deleteMenuItemRequest(item._id);
      await loadData();
      showToast({
        title: "Menu item deleted",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete menu item."),
        variant: "error",
      });
    }
  };

  if (loading) {
    return <Loader label="Loading menu management..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Menu Management"
        description="Create, update, and remove items that show up in the customer experience."
        actions={
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setEditingItem({})}>
            Add Menu Item
          </button>
        }
      />
      <MenuTable
        items={items}
        onEdit={(item) => {
          setEditingItem(item);
          setForm(mapItemToForm(item));
        }}
        onDelete={handleDelete}
      />
      <Modal
        open={Boolean(editingItem)}
        title={editingItem?._id ? "Edit Menu Item" : "Add Menu Item"}
        onClose={() => {
          setEditingItem(null);
          setForm(emptyForm);
        }}
      >
        <MenuForm
          form={form}
          categories={categories}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          showToast={showToast}
          onCancel={() => {
            setEditingItem(null);
            setForm(emptyForm);
          }}
        />
      </Modal>
    </div>
  );
}
