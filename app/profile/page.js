"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Mail, Phone, Edit, User } from "lucide-react";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";

import styles from "./profile.module.css";
import EditProfileModal from "./EditProfileModal";

export default function ProfilePage() {
  const [avatar, setAvatar] = useState("/profile-defualt.jpg");
  const [isDragging, setIsDragging] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    address: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user ID from JWT token
  const getUserId = () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      
      // Handle padding for base64 decode
      let base64 = token.split(".")[1];
      if (base64.length % 4 === 2) base64 += "==";
      else if (base64.length % 4 === 3) base64 += "=";
      else if (base64.length % 4 === 1) base64 += "===";
      
      // Replace URL-safe base64 characters
      base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
      
      const payload = JSON.parse(atob(base64));
      return payload.sub;
    } catch (err) {
      console.error("Error parsing token:", err);
      return null;
    }
  };

  // Fetch profile data from Supabase
  const fetchProfileData = async () => {
    const userId = getUserId();
    
    if (!userId) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the same approach as checkout page
      const customerData = await makeAuthenticatedRequest(
        "GET",
        `customers?user_id=eq.${userId}&select=*`
      );

      if (customerData && customerData.length > 0) {
        const data = customerData[0];
        setProfileData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          gender: data.gender || "",
          address: data.address || ""
        });
      } else {
        // No profile found - user needs to create profile
        setProfileData({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          gender: "",
          address: ""
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  // Load profile data on component mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  // Handle profile updates from modal
  const handleProfileUpdate = (updatedData) => {
    setProfileData(updatedData);
  };

  // Validate + preview image file
  const processFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }

    const url = URL.createObjectURL(file);

    setAvatar((prev) => {
      if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  };

  // Input upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) processFile(file);
  };

  // Drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  return (
    <>
      <div className={styles.appWrapper}>
        <div className={styles.appContainer}>

          {/* TOP SECTION */}
          <div className={styles.topSection}>
            
            {/* Avatar Drop Zone */}
            <div
              className={`${styles.avatarDropZone} ${isDragging ? styles.dragActive : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Image
                src={avatar}
                alt="Profile Avatar"
                width={95}
                height={95}
                className={styles.avatar}
                unoptimized
              />

              <label className={styles.uploadBadge}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className={styles.fileInput}
                />
                Change
              </label>

              {isDragging && (
                <div className={styles.dragOverlay}>Drop Image Here</div>
              )}
            </div>

            {/* User Basic Info */}
            <div className={styles.userText}>
              <h1 className={styles.userName}>
                {profileData.first_name || profileData.last_name 
                  ? `${profileData.first_name} ${profileData.last_name}`.trim()
                  : "Guest"
                }
              </h1>
              <p className={styles.userSubtitle}>
                {profileData.phone || "No phone number"}
              </p>
            </div>

            {/* Edit Button */}
            <div className={styles.topButtons}>
              <button className={styles.editBtn} onClick={() => setShowEditModal(true)}>
                <Edit size={18} />
                Edit Profile
              </button>
            </div>

          </div>

          {/* PROFILE INFO SECTION */}
          <h2 className={styles.sectionTitle}>Profile Information</h2>

          {loading ? (
            <div className={styles.infoCard}>
              <div className={styles.infoValue}>Loading profile data...</div>
            </div>
          ) : error ? (
            <div className={styles.infoCard}>
              <div className={styles.infoValue} style={{ color: 'red' }}>{error}</div>
            </div>
          ) : (
            <div className={styles.infoGrid}>

              <div className={styles.infoCard}>
                <label className={styles.infoLabel}>Full Name</label>
                <div className={styles.infoValue}>
                  <User size={18} className={styles.infoIcon} />
                  {profileData.first_name || profileData.last_name 
                    ? `${profileData.first_name} ${profileData.last_name}`.trim()
                    : "Guest"
                  }
                </div>
              </div>

              <div className={styles.infoCard}>
                <label className={styles.infoLabel}>Email</label>
                <div className={styles.infoValue}>
                  <Mail size={18} className={styles.infoIcon} />
                  {profileData.email || "Not provided"}
                </div>
              </div>

              <div className={styles.infoCard}>
                <label className={styles.infoLabel}>Phone</label>
                <div className={styles.infoValue}>
                  <Phone size={18} className={styles.infoIcon} />
                  {profileData.phone || "Not provided"}
                </div>
              </div>

              <div className={styles.infoCard}>
                <label className={styles.infoLabel}>Gender</label>
                <div className={styles.infoValue}>
                  {profileData.gender || "Not specified"}
                </div>
              </div>

              <div className={styles.infoCard}>
                <label className={styles.infoLabel}>Address</label>
                <div className={styles.infoValue}>
                  {profileData.address || "Not provided"}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <EditProfileModal 
          closeModal={() => setShowEditModal(false)}
          profileData={profileData}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
