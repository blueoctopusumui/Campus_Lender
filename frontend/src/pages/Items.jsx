// CampusLend - Items Catalogue Page
// Authors: Amani Yadav (24BCE0246) & Sanjana B S (24BCE2516)
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Package, User, Tag, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import SearchFilter from '../components/SearchFilter';
import Pagination from '../components/Pagination';
import api from '../api/axios';

export default function Items() {
  const { user } = useAuth();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // New Item modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCondition, setNewCondition] = useState('GOOD');
  const [newFinePerDay, setNewFinePerDay] = useState('5.00');
  const [newMaxDays, setNewMaxDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'list') {
      setShowAddModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [search, category, status, page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch {
      // ignore
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 8,
        ...(search && { search }),
        ...(category && { category, categoryId: category }),
        ...(status && { status }),
      });
      const res = await api.get(`/items?${params.toString()}`);
      setItems(res.data.data || []);
      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
      }
    } catch {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newTitle || !newCategory) {
      toast.error('Please enter title and select category');
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/items', {
        title: newTitle,
        description: newDesc,
        categoryId: parseInt(newCategory),
        itemCondition: newCondition,
        finePerDay: parseFloat(newFinePerDay) || 5.00,
        maxLoanDays: parseInt(newMaxDays, 10) || 7,
      });
      toast.success('Item listed successfully.');
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewFinePerDay('5.00');
      setNewMaxDays('7');
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to list item');
    } finally {
      setSubmitting(false);
    }
  };

  const conditionBadge = {
    NEW: 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]',
    GOOD: 'bg-[#ECEAE3] text-[#242722] border-[#DAD8D0]',
    FAIR: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]',
    POOR: 'bg-[#FAECEB] text-[#8A332F] border-[#E8C4C2]',
  };

  const statusBadge = {
    AVAILABLE: 'bg-[#EBF0EC] text-[#325238] border-[#C6D8C8]',
    ON_LOAN: 'bg-[#F7F2E7] text-[#785918] border-[#E5D8BE]',
    MAINTENANCE: 'bg-[#ECEAE3] text-[#494B45] border-[#DAD8D0]',
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[#242722]">
            Resource Catalogue
          </h1>
          <p className="text-xs text-[#74766F] mt-1">
            Browse and request textbooks, equipment, calculators, and lab tools shared across campus.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary self-start sm:self-auto text-xs sm:text-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>List Item to Lend</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <SearchFilter
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        category={category}
        onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        status={status}
        onStatusChange={(v) => { setStatus(v); setPage(1); }}
        categories={categories}
      />

      {/* Items Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-7 h-7 border-2 border-[#526B56] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-[#74766F] uppercase tracking-wider">
            Loading Resources...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-md border border-[#DAD8D0] p-12 text-center shadow-subtle">
          <Package className="w-10 h-10 text-[#9A9C94] mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-heading font-semibold text-sm text-[#242722]">No resources found</h3>
          <p className="text-xs text-[#74766F] mt-1">
            Try adjusting your search keywords or resetting department category filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((item) => (
            <div
              key={item.itemId}
              className="bg-white rounded-md border border-[#DAD8D0] overflow-hidden flex flex-col hover:border-[#526B56] hover:shadow-card transition-all group shadow-subtle"
            >
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-2.5">
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${statusBadge[item.status]}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.ownerId === user?.userId && (
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#526B56] text-white">
                          Your Item
                        </span>
                      )}
                      <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${conditionBadge[item.itemCondition] || 'bg-[#ECEAE3]'}`}>
                        {item.itemCondition}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-heading font-semibold text-sm text-[#242722] line-clamp-1 group-hover:text-[#526B56] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#74766F] line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description || 'Student lending resource.'}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3.5 mt-3.5 border-t border-[#DAD8D0]/60 text-xs">
                  <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#74766F]">
                    <Tag className="w-3 h-3 text-[#9A9C94] flex-shrink-0" />
                    <span className="truncate">{item.category?.categoryName || 'General'}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-[#74766F]">
                    <User className="w-3 h-3 text-[#9A9C94] flex-shrink-0" />
                    <span className="truncate">
                      {item.ownerId === user?.userId ? 'Lender: You' : `Lender: ${item.owner?.fullName || 'Campus Peer'}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-[#74766F] border-t border-[#DAD8D0]/40">
                    <span className="text-[#8A332F] font-semibold">
                      ₹{item.finePerDay || item.category?.finePerDay || 5}/day fine
                    </span>
                    <span>Max {item.maxLoanDays || item.category?.maxLoanDays || 7} days</span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2.5 bg-[#ECEAE3]/30 border-t border-[#DAD8D0] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#9A9C94]">
                  #{item.itemId}
                </span>
                <Link
                  to={`/items/${item.itemId}`}
                  className="text-xs font-medium text-[#526B56] hover:text-[#3F5543] inline-flex items-center space-x-1"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p)}
      />

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#242722]/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-md shadow-modal max-w-lg w-full p-6 border border-[#DAD8D0]">
            <h2 className="font-heading text-base font-bold text-[#242722] tracking-tight mb-1">
              List an Item for Peer Borrowing
            </h2>
            <p className="text-xs text-[#74766F] mb-4">
              Lend textbooks, lab components, calculators, sports equipment, or project kits to fellow students at VIT.
            </p>

            <form onSubmit={handleCreateItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Arduino Uno Rev3 Kit / Operating Systems 10th Ed."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-archival"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#242722] mb-1">
                  Description / Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Include condition, accessories, serial tags, lab room, etc."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="input-archival"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#242722] mb-1">
                    Classification Category *
                  </label>
                  <select
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input-archival bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#242722] mb-1">
                    Physical Condition *
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    className="input-archival bg-white"
                  >
                    <option value="NEW">NEW - Factory Sealed</option>
                    <option value="GOOD">GOOD - Fully Operational</option>
                    <option value="FAIR">FAIR - Minor Cosmetic Wear</option>
                    <option value="POOR">POOR - Damaged / Degraded</option>
                  </select>
                </div>
              </div>

              {/* Lender decides the fine fee and lending limit */}
              <div className="p-3.5 bg-[#ECEAE3]/40 rounded-md border border-[#DAD8D0] space-y-3">
                <p className="text-xs font-semibold font-heading text-[#242722]">
                  Lending Terms (Set by you)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#74766F] mb-1">
                      Late Fine Rate (₹ / Day) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      placeholder="e.g. 5"
                      value={newFinePerDay}
                      onChange={(e) => setNewFinePerDay(e.target.value)}
                      className="input-archival bg-white font-mono"
                    />
                    <p className="text-[10px] text-[#9A9C94] mt-0.5">
                      Fee accrued per overdue day
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#74766F] mb-1">
                      Max Duration (Days) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="60"
                      placeholder="e.g. 7"
                      value={newMaxDays}
                      onChange={(e) => setNewMaxDays(e.target.value)}
                      className="input-archival bg-white font-mono"
                    />
                    <p className="text-[10px] text-[#9A9C94] mt-0.5">
                      Max checkout period allowed
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#DAD8D0]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Registering...' : 'Register Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
