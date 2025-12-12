"use client";

import { useRef, useState, useEffect } from "react";
import { makeAuthenticatedRequest } from "../../lib/customSupabaseClient";
import modalStyles from "./editProfile.module.css";

export default function EditProfileModal({ closeModal, profileData, onUpdate }) {
  const modalRef = useRef(null);

  // form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profileData) {
      setFirstName(profileData.first_name || "");
      setLastName(profileData.last_name || "");
      setGender(profileData.gender || "");
      setPhone(profileData.phone || "");
      setEmail(profileData.email || "");
      setAddress(profileData.address || "");
    }
  }, [profileData]);

  const allFilled = firstName && lastName && gender && email;

  // Get user ID from JWT token
  const getUserId = () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return null;
      
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );
      return payload.sub;
    } catch (err) {
      console.error("Error parsing token:", err);
      return null;
    }
  };

  // Save profile data
  const saveProfileData = async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error("User not authenticated");

    // Check if customer record exists using the same authentication method
    const existingCustomer = await makeAuthenticatedRequest(
      "GET",
      `customers?user_id=eq.${userId}&select=id`
    );

    const customerData = {
      user_id: userId,
      first_name: data.firstName,
      last_name: data.lastName,
      gender: data.gender,
      phone: data.phone,
      email: data.email,
      address: data.address
    };

    if (existingCustomer && existingCustomer.length > 0) {
      // Update existing customer
      await makeAuthenticatedRequest(
        "PATCH",
        `customers?user_id=eq.${userId}`,
        {
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(customerData)
        }
      );
    } else {
      // Insert new customer
      await makeAuthenticatedRequest(
        "POST",
        "customers",
        {
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(customerData)
        }
      );
    }
  };

  // Close modal when clicking outside
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      closeModal();
    }
  };

  // Save Handler with success toast
  const handleSave = async (e) => {
    e.preventDefault();

    if (!allFilled) return; // prevent save

    try {
      setSaving(true);
      
      await saveProfileData({
        firstName,
        lastName,
        gender,
        phone,
        email,
        address
      });

      // Update parent component with new data
      onUpdate({
        first_name: firstName,
        last_name: lastName,
        gender,
        phone,
        email,
        address
      });

      // SUCCESS TOAST
      const toast = document.createElement("div");
      toast.className = modalStyles.toast;
      toast.innerText = "Profile Updated Successfully!";
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.classList.add(modalStyles.toastShow);
      }, 10);

      setTimeout(() => {
        toast.classList.remove(modalStyles.toastShow);
        setTimeout(() => toast.remove(), 300);
      }, 2000);

      closeModal();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(`Failed to save profile: ${error.message || error}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={handleOutsideClick}>
      <div ref={modalRef} className={modalStyles.modalContainer}>

        {/* HEADER */}
        <div className={modalStyles.modalHeader}>
          <h2>Edit Profile</h2>
          <button className={modalStyles.closeBtn} onClick={closeModal}>✕</button>
        </div>

        {/* FORM */}
        <form className={modalStyles.form} onSubmit={handleSave}>

          <label>First Name</label>
          <input 
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
          />

          <label>Last Name</label>
          <input 
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
          />

          <label>Gender</label>
          <select value={gender} onChange={(e) => setGender(e.target.value)} required>
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>

          <label>Phone Number (Read-only)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="XXXXXXXXXX"
            readOnly
            required
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
          />
          <small style={{ color: '#666', fontSize: '12px', marginBottom: '16px' }}>Phone number cannot be changed as it's your unique identifier</small>

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
            required
          />

          <label>Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your address"
            rows="3"
            style={{ resize: 'vertical', minHeight: '80px' }}
          />

          <button
            className={`${modalStyles.saveBtn} ${(!allFilled || saving) ? modalStyles.disabledBtn : ""}`}
            disabled={!allFilled || saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>

        </form>
      </div>
    </div>
  );
}
