import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../../store/authSlice';
import ProfileCard from '../../components/ProfileCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DeliveryProfile = () => {
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
    return <div className="mt-20"><LoadingSpinner text="Loading profile..." /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-4 py-12 animate-slide-up">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">My Profile</h1>
        <p className="text-muted-foreground font-medium">Manage your delivery agent details and regional availability.</p>
      </div>

      <div className="glass-card rounded-[2rem] overflow-visible max-w-4xl mx-auto md:mx-0">
         {user && <ProfileCard user={user} role={role} onUpdate={handleUpdate} />}
      </div>
    </div>
  );
};

export default DeliveryProfile;
