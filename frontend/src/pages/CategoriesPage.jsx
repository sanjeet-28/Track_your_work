import { useState } from 'react';
import { FolderTree, Plus, Trash2, Edit2, Palette } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { categoryApi } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

const PRESET_COLORS = [
  '#6366f1', '#ec4899', '#3b82f6', '#8b5cf6',
  '#10b981', '#f59e0b', '#14b8a6', '#ef4444',
  '#06b6d4', '#84cc16', '#64748b', '#d946ef'
];

export function CategoriesPage() {
  const { categories, refreshCategories, showToast } = useTasks();
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setCategoryToEdit(null);
    setName('');
    setColor('#6366f1');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setCategoryToEdit(cat);
    setName(cat.name);
    setColor(cat.color || '#6366f1');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (categoryToEdit) {
        await categoryApi.updateCategory(categoryToEdit.id, { name: name.trim(), color });
        showToast('Category updated');
      } else {
        await categoryApi.createCategory({ name: name.trim(), color });
        showToast('Category created');
      }
      await refreshCategories();
      setModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Tasks in this category will become uncategorized.')) return;
    try {
      await categoryApi.deleteCategory(id);
      showToast('Category deleted');
      await refreshCategories();
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderTree className="w-6 h-6 text-indigo-500" />
            <span>Categories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize tasks by domains, subjects, or projects
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={openCreateModal}>
          New Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between transition-all hover:border-indigo-300"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full ring-4 flex-shrink-0"
                style={{
                  backgroundColor: cat.color,
                  ringColor: `${cat.color}20`
                }}
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {cat.name}
                </h4>
                <span className="text-[11px] text-slate-400">
                  {cat.taskCount || 0} {cat.taskCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => openEditModal(cat)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={categoryToEdit ? 'Edit Category' : 'Create Category'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Machine Learning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c ? 'border-slate-900 dark:border-white scale-110 shadow-xs' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              {categoryToEdit ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
