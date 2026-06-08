import React, { useState, useEffect } from 'react';
import { User, Mail, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '@/components/ui/CustomSelect';
import { API_BASE_URL } from '@/utils/constants';

const ProfileCard = ({ user, role, onUpdate }) => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  
  const [name, setName] = useState(user?.name || user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [subregion, setSubregion] = useState(user?.subregion || '');
  const [availabilityStatus, setAvailabilityStatus] = useState(user?.availability_status || 'available');
  const [locationsDB, setLocationsDB] = useState([]);

  useEffect(() => {
    if (!isEditing) {
      setName(user?.name || user?.full_name || '');
      setPhone(user?.phone || '');
      setCity(user?.city || '');
      setSubregion(user?.subregion || '');
      setAvailabilityStatus(user?.availability_status || 'available');
    }
  }, [user, isEditing]);

  useEffect(() => {
    if (role === 'delivery') {
      const fetchLocations = async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/locations/public`);
          const data = await res.json();
          if (data.success) {
            setLocationsDB(data.data.locations || []);
          }
        } catch (err) {
          console.error("Failed to fetch locations", err);
        }
      };
      fetchLocations();
    }
  }, [role]);

  const cities = [...new Set(locationsDB.map(loc => loc.city))].map(c => ({ value: c, label: c }));
  const subregions = locationsDB
    .filter(loc => loc.city === city && loc.subregion)
    .map(loc => ({ value: loc.subregion, label: loc.subregion }));

  const handleUpdate = () => {
    if (!name.trim()) return;
    
    const updatePayload = { name, phone };
    if (role === 'delivery') {
      updatePayload.city = city;
      updatePayload.subregion = subregion;
      updatePayload.availability_status = availabilityStatus;
    }
    
    onUpdate(updatePayload);
    setIsEditing(false);
  };

  const displayName = user?.name || user?.full_name || 'N/A';

  const inputClasses = (isEditing) => 
    `w-full px-4 py-3 rounded-lg border transition-all ${
      isEditing 
        ? 'border-primary bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground' 
        : 'border-border bg-muted/30 text-muted-foreground cursor-not-allowed'
    }`;

  return (
    <div className="bg-card w-full rounded-2xl border border-border shadow-sm overflow-visible font-sans">
      <div className="flex flex-col md:flex-row p-6 md:p-10 gap-10">
        
        {/* Left Column: Avatar, Name, Email */}
        <div className="md:w-[38%] flex flex-col items-center md:items-start text-center md:text-left md:border-r border-border md:pr-8 shrink-0">
           <div className="w-32 h-32 rounded-full bg-card border-4 border-muted flex items-center justify-center shadow-lg overflow-hidden mb-6 shrink-0">
              <User className="w-16 h-16 text-muted-foreground" />
           </div>
           <h2 className="text-2xl font-bold text-foreground tracking-tight mb-2 break-words w-full">{displayName}</h2>
           
           <div className="flex flex-col items-center md:items-start gap-4 mt-2 w-full">
             <div className="flex items-center gap-2 text-muted-foreground text-sm break-all w-full">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate hover:whitespace-normal transition-all">{user?.email}</span>
             </div>
             <span className="inline-block mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                {role === 'admin' ? 'Administrator' : role === 'delivery' ? 'Delivery Agent' : 'Standard User'}
             </span>
           </div>
        </div>
        
        {/* Right Column: Edit Buttons and Form Grid */}
        <div className="md:w-[62%] flex flex-col h-full">
           
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-border gap-4">
              <h3 className="text-lg font-bold text-foreground">Profile Details</h3>
              <div className="flex w-full sm:w-auto self-end sm:self-auto">
                 {isEditing ? (
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-6 py-2 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors font-bold text-sm">
                        Cancel
                      </button>
                      <button 
                        onClick={handleUpdate} 
                        disabled={!name.trim() || !phone.trim() || (role === 'delivery' && (!city || !subregion))}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-white transition-all font-bold text-sm shadow-md ${
                          (!name.trim() || !phone.trim() || (role === 'delivery' && (!city || !subregion)))
                            ? 'bg-primary/50 cursor-not-allowed shadow-none'
                            : 'bg-primary hover:bg-primary/90 shadow-primary/20'
                        }`}
                      >
                        <Check size={16}/> Save Changes
                      </button>
                    </div>
                 ) : (
                    <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-8 py-2 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all font-bold text-sm shadow-md shadow-primary/20">
                      Edit Profile
                    </button>
                 )}
              </div>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
             {/* Full Name */}
             <div className="col-span-1 sm:col-span-2">
               <label className="text-sm font-semibold text-foreground/80 mb-2 block">Full Name</label>
               <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isEditing} className={inputClasses(isEditing)} placeholder="Your Full Name" />
             </div>
             
             {/* Phone Number */}
             <div>
               <label className="text-sm font-semibold text-foreground/80 mb-2 block">Phone Number</label>
               <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} className={inputClasses(isEditing)} placeholder="Your Phone Number" />
             </div>
             
             {/* Role Info (for alignment) */}
             {(role === 'user' || role === 'admin') && (
               <div>
                 <label className="text-sm font-semibold text-foreground/80 mb-2 block">Account Type</label>
                 <input type="text" value={role === 'admin' ? "Administrator" : "Standard User"} disabled className={inputClasses(false)} />
               </div>
             )}
             
             {/* Delivery specifics */}
             {role === 'delivery' && (
               <>
                 <div>
                   <label className="text-sm font-semibold text-foreground/80 mb-2 block">City</label>
                   {isEditing ? (
                     <CustomSelect
                       options={cities}
                       value={city}
                       onChange={(e) => {
                         setCity(e.target.value);
                         setSubregion("");
                       }}
                       placeholder="Select City"
                       searchable
                       className="w-full text-foreground"
                     />
                   ) : (
                     <input type="text" value={city} disabled className={inputClasses(false)} />
                   )}
                 </div>
                 
                 <div>
                   <label className="text-sm font-semibold text-foreground/80 mb-2 block">Subregion</label>
                   {isEditing ? (
                     <CustomSelect
                       options={subregions}
                       value={subregion}
                       onChange={(e) => setSubregion(e.target.value)}
                       placeholder="Select Subregion"
                       searchable
                       className="w-full text-foreground"
                       disabled={!city || subregions.length === 0}
                     />
                   ) : (
                     <input type="text" value={subregion} disabled className={inputClasses(false)} />
                   )}
                 </div>
                 
                 <div>
                   <label className="text-sm font-semibold text-foreground/80 mb-2 block">Availability Status</label>
                   <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)} disabled={!isEditing} className={`${inputClasses(isEditing)} appearance-none`}>
                     <option value="available">Available</option>
                     <option value="busy">Busy</option>
                     <option value="offline">Offline</option>
                   </select>
                 </div>
               </>
             )}
             
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileCard;
