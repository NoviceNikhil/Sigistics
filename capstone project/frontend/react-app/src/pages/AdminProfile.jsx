import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile } from '../store/authSlice';
import ProfileCard from '../components/ProfileCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminProfile = () => {
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
    <div className="max-w-4xl mx-auto p-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-text-secondary">Manage your administration account details.</p>
      </div>

      <div className="w-full">
        {user && <ProfileCard user={user} role={role} onUpdate={handleUpdate} />}
      </div>
    </div>
  );
};

export default AdminProfile;
