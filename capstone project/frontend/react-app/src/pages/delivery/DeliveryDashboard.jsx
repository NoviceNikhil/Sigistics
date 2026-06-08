import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../../store/authSlice';
import ProfileCard from '../../components/ProfileCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DeliveryDashboard = () => {
   const dispatch = useDispatch();
   const { user, profileLoading, role } = useSelector((state) => state.auth);

   useEffect(() => {
      dispatch(fetchProfile());
   }, [dispatch]);

   const handleUpdate = async (data) => {
      try {
         const resultAction = await dispatch(updateProfile({ ...data, role }));
         if (updateProfile.fulfilled.match(resultAction)) {
            toast.success("Profile updated successfully");
         } else {
            toast.error(resultAction.payload?.message || "Failed to update profile");
         }
      } catch (err) {
         toast.error("An error occurred");
      }
   };

   if (profileLoading) {
      return <div className="mt-20"><LoadingSpinner text="Loading dashboard..." /></div>;
   }

   return (
    <div className="max-w-7xl mx-auto p-4 py-12 animate-slide-up">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Driver Hub</h1>
        <p className="text-muted-foreground font-medium">Manage your agent profile and view active shipments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Section - Given significantly more space (50% of grid) */}
        <div className="lg:col-span-6">
          <div className="glass-card rounded-[2rem] overflow-hidden sticky top-24">
            {user && <ProfileCard user={user} role={role} onUpdate={handleUpdate} />}
          </div>
        </div>

        {/* Stats and Activity Section (Remaining 50%) */}
        <div className="lg:col-span-6 space-y-8">
          <div className="glass-card p-8 rounded-[2rem]">
            <h3 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span> Current Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted p-5 rounded-2xl text-center border border-border/50">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Status</p>
                <p className="text-lg font-bold text-emerald-600 capitalize">{user?.availability_status || 'Available'}</p>
              </div>
              <div className="bg-muted p-5 rounded-2xl text-center border border-border/50">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Active Workload</p>
                <p className="text-lg font-bold text-foreground">{user?.active_shipments_count || 0}</p>
              </div>
              <div className="bg-muted p-5 rounded-2xl text-center border border-border/50">
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-2">Performance</p>
                <p className="text-lg font-bold text-amber-500">{user?.rating || '5.0'} / 5</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2rem]">
            <h3 className="text-xl font-black text-foreground mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span> Recent Activity
            </h3>
            <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl bg-muted/30">
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No recent deliveries discovered.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
   );
};

export default DeliveryDashboard;
