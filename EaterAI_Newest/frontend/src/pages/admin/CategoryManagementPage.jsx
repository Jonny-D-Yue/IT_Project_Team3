import { useEffect, useState } from "react";

import Modal from "../../components/common/Modal";
import PageHeader from "../../components/common/PageHeader";
import CategoryForm from "../../components/admin/CategoryForm";
import CategoryTable from "../../components/admin/CategoryTable";
import Loader from "../../components/common/Loader";
import { createCategoryRequest, deleteCategoryRequest, getCategoriesRequest, updateCategoryRequest } from "../../api/categoryApi";
import { useToast } from "../../hooks/useToast";
import { getApiErrorMessage } from "../../utils/errors";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

export default function CategoryManagementPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = async () => {
    const response = await getCategoriesRequest();
    setCategories(response);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadCategories();
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
      if (editingCategory?._id) {
        await updateCategoryRequest(editingCategory._id, form);
      } else {
        await createCategoryRequest(form);
      }

      await loadCategories();
      setEditingCategory(null);
      setForm(emptyForm);
      showToast({
        title: editingCategory?._id ? "Category updated" : "Category created",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Save failed",
        message: getApiErrorMessage(error, "Unable to save category."),
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    try {
      await deleteCategoryRequest(category._id);
      await loadCategories();
      showToast({
        title: "Category deleted",
        variant: "success",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete category."),
        variant: "error",
      });
    }
  };

  if (loading) {
    return <Loader label="Loading categories..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Category Management"
        description="Control the category list customers use to filter the menu."
        actions={
          <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setEditingCategory({})}>
            Add Category
          </button>
        }
      />
      <CategoryTable
        categories={categories}
        onEdit={(category) => {
          setEditingCategory(category);
          setForm({
            name: category.name,
            description: category.description || "",
            isActive: Boolean(category.isActive),
          });
        }}
        onDelete={handleDelete}
      />
      <Modal
        open={Boolean(editingCategory)}
        title={editingCategory?._id ? "Edit Category" : "Add Category"}
        onClose={() => {
          setEditingCategory(null);
          setForm(emptyForm);
        }}
      >
        <CategoryForm
          form={form}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => {
            setEditingCategory(null);
            setForm(emptyForm);
          }}
        />
      </Modal>
    </div>
  );
}
