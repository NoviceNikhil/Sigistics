import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllUsers, deleteUser } from '@/store/userSlice';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Trash2, Shield, User, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AllUsers = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.users);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user ${name}?`)) return;

    try {
      const resultAction = await dispatch(deleteUser(id));
      if (deleteUser.fulfilled.match(resultAction)) {
        toast.success(`Deleted user ${name}`);
      } else {
        toast.error(resultAction.payload?.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const filteredUsers = list.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-text-secondary">View and manage all registered users.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-text-muted" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-surface-card border border-border rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => dispatch(fetchAllUsers())}
            className="p-2 rounded-xl bg-surface-card border border-border text-text-muted hover:text-white hover:border-primary transition-colors"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading && list.length === 0 ? (
        <div className="py-20 flex justify-center"><LoadingSpinner text="Loading users..." /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-text-secondary">
              <thead className="text-xs uppercase bg-surface-hover/50 text-text-muted sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">User</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-muted">
                      No users found.
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-text-muted">
                      No matches found for "{searchTerm}"
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-hover/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            {user.role === 'admin' ? <Shield size={16} className="text-blue-500" /> : <User size={16} className="text-primary" />}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.full_name || 'No Name'}</div>
                            <div className="text-xs text-text-muted">ID: {user.id.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{user.email}</div>
                        <div className="text-xs">{user.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium uppercase tracking-wider ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-surface border border-border text-text-muted'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-text-muted'}`}></div>
                          <span className={user.is_active ? 'text-success' : 'text-text-muted'}>
                            {user.is_active ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(user.id, user.full_name)}
                          className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors inline-block"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
