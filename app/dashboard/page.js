"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import Image from "next/image";
import Link from "next/link";
import Skeleton from "../components/Skeleton";
import Loading from "../components/Loading";
import EmptyState from "../components/EmptyState";
import { motion } from "framer-motion";

import {
  BellAlertIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  HomeModernIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilSquareIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

/**
 * Dmenu.jsx
 * Single-file app: announcement, profile, orders, host, support
 * - Completed Orders list (Option A) with modal
 * - Keeps all existing styles and classes unchanged
 */

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [active, setActive] = useState("announcement");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState("/user.jpg");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Authentication Check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsCheckingAuth(false);
          } else {
            router.push("/login?redirect=/dashboard");
          }
        } else {
          router.push("/login?redirect=/dashboard");
        }
      } catch (e) {
        router.push("/login?redirect=/dashboard");
      }
    };
    checkSession();
  }, [router]);

  // Handle tab query parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['announcement', 'profile', 'orders', 'host', 'support'].includes(tabParam)) {
      setActive(tabParam);
    }
  }, [searchParams]);

  // Orders: modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);

  const menuItems = [
    { id: "announcement", label: "Announcements", icon: BellAlertIcon },
    { id: "profile", label: "Profile", icon: UserCircleIcon },
    { id: "orders", label: "Orders", icon: ShoppingBagIcon },
    { id: "host", label: "Host Your Car", icon: CurrencyRupeeIcon },
    { id: "support", label: "Support", icon: ChatBubbleLeftIcon },
  ];

  // handle profile image upload
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  /* --------------------------
     Announcement Page (with working tabs)
     -------------------------- */
  function AnnouncementPage() {
    const [activeTab, setActiveTab] = useState("today");
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newNote, setNewNote] = useState({ title: "", desc: "" });

    // Fetch announcements from API
    useEffect(() => {
      const fetchAnnouncements = async () => {
        try {
          const response = await fetch('/api/dashboard/announcements');
          if (response.ok) {
            const data = await response.json();
            setNotes(data);
          }
        } catch (error) {
          console.error('Error fetching announcements:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchAnnouncements();
    }, []);

    const addNote = () => {
      setNotes([
        ...notes,
        {
          id: notes.length + 1,
          title: newNote.title,
          desc: newNote.desc,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          color: "#C7E9B0",
        },
      ]);
      setShowModal(false);
      setNewNote({ title: "", desc: "" });
    };

    return (
      <div className={styles.notesContainer}>
        <div className={styles.notesHeader}>
          <h2>MM Miles Updates</h2>
          <div className={styles.monthNav}>
            <span>December 2024</span>
          </div>
        </div>

        <div className={styles.tabs}>
          {["today", "week", "month"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""
                }`}
            >
              {tab === "today" ? "Today's" : tab === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>

        <div className={styles.notesGrid}>
          {notes.map((note) => (
            <div
              key={note.id}
              className={styles.noteCard}
              style={{ backgroundColor: note.color }}
            >
              <div className={styles.noteTop}>
                <span className={styles.noteDate}>{note.date}</span>
                <span className={styles.noteEdit}>✏️</span>
              </div>
              <h3 className={styles.noteTitle}>{note.title}</h3>
              <p className={styles.noteDesc}>{note.desc}</p>

              <div className={styles.noteFooter}>
                <span>🕒</span>
                <span>{note.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Add Button */}
        <button className={styles.floatingAddBtn} onClick={() => setShowModal(true)}>
          +
        </button>

        {/* Add Note Modal */}
        {showModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalBox}>
              <h3>Add New Note</h3>
              <input
                type="text"
                placeholder="Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
              <textarea
                placeholder="Description"
                value={newNote.desc}
                onChange={(e) => setNewNote({ ...newNote, desc: e.target.value })}
              />
              <div className={styles.modalActions}>
                <button onClick={() => setShowModal(false)}>Cancel</button>
                <button onClick={addNote}>Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  /* --------------------------
     Profile Page
     -------------------------- */
  function ProfilePage() {
    const [profileData, setProfileData] = useState({
      name: "Loading...",
      phone: "",
      email: "",
      gender: "",
      address: "",
      first_name: "",
      last_name: ""
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form state for modal
    const [formData, setFormData] = useState({
      first_name: "",
      last_name: "",
      email: "",
      gender: "",
      address: ""
    });
    const [saving, setSaving] = useState(false);

    // Bookings state
    const [bookingStats, setBookingStats] = useState({
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0,
      recentBookings: []
    });
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Toast notification function
    const showToast = (message, type = 'info') => {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        font-size: 14px;
        font-weight: 500;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);

      // Add animation styles if not already added
      if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }

      // Auto remove after 3 seconds
      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 3000);
    };

    // Import makeAuthenticatedRequest
    const { makeAuthenticatedRequest } = require("../../lib/customSupabaseClient");

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
      let userId = null;
      let tokenPhone = "";

      try {
        const token = localStorage.getItem("auth_token");
        if (token) {
          // Handle padding for base64 decode
          let base64 = token.split(".")[1];
          if (base64.length % 4 === 2) base64 += "==";
          else if (base64.length % 4 === 3) base64 += "=";
          else if (base64.length % 4 === 1) base64 += "===";

          // Replace URL-safe base64 characters
          base64 = base64.replace(/-/g, "+").replace(/_/g, "/");

          const payload = JSON.parse(atob(base64));
          userId = payload.sub;
          tokenPhone = payload.phone_number;
        }
      } catch (err) {
        console.error("Error parsing token:", err);
      }

      if (!userId) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Use the same approach as profile page
        const customerData = await makeAuthenticatedRequest(
          "GET",
          `customers?user_id=eq.${userId}&select=*`
        );

        if (customerData && customerData.length > 0) {
          const data = customerData[0];
          const profileInfo = {
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || "Guest",
            phone: data.phone || tokenPhone || "",
            email: data.email || "",
            gender: data.gender || "",
            address: data.address || "",
            first_name: data.first_name || "",
            last_name: data.last_name || ""
          };
          setProfileData(profileInfo);

          // Update form data when profile data changes
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            gender: data.gender || "",
            address: data.address || ""
          });
        } else {
          // No profile found - user needs to create profile
          const profileInfo = {
            name: "Guest",
            phone: tokenPhone || "",
            email: "",
            gender: "",
            address: "",
            first_name: "",
            last_name: ""
          };
          setProfileData(profileInfo);

          // Clear form data for new profile
          setFormData({
            first_name: "",
            last_name: "",
            email: "",
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

    // Fetch profile data on component mount
    useEffect(() => {
      fetchProfileData();
      fetchBookingStats(); // Also fetch booking stats
    }, []);

    // Form validation
    const validateForm = (data) => {
      const errors = [];
      if (!data.first_name.trim()) errors.push("First name is required");
      if (!data.last_name.trim()) errors.push("Last name is required");
      if (!data.email.trim()) errors.push("Email is required");
      if (!data.gender) errors.push("Gender is required");

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (data.email && !emailRegex.test(data.email)) {
        errors.push("Please enter a valid email address");
      }

      return errors;
    };

    // Save profile data
    const handleSaveProfile = async () => {
      const userId = getUserId();
      if (!userId) {
        showToast("Please log in to update your profile", 'error');
        return;
      }

      // Validate form
      const errors = validateForm(formData);
      if (errors.length > 0) {
        showToast(errors.join('\n'), 'error');
        return;
      }

      try {
        setSaving(true);

        const customerData = {
          user_id: userId,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          gender: formData.gender,
          address: formData.address
          // Note: phone is NOT included as it's read-only
        };

        // Check if customer exists
        const existingCustomer = await makeAuthenticatedRequest(
          "GET",
          `customers?user_id=eq.${userId}&select=id`
        );

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

        // Show success message
        showToast("Profile updated successfully!", 'success');
        setShowProfileModal(false);

        // Refresh profile data
        fetchProfileData();
      } catch (error) {
        console.error("Error saving profile:", error);
        showToast(`Failed to save profile: ${error.message || error}`, 'error');
      } finally {
        setSaving(false);
      }
    };

    // Fetch booking statistics
    const fetchBookingStats = async () => {
      const userId = getUserId();
      if (!userId) return;

      try {
        setLoadingBookings(true);

        // Fetch user's bookings
        const bookingsData = await makeAuthenticatedRequest(
          "GET",
          `bookings?user_id=eq.${userId}&select=*&order=created_at.desc`
        );

        if (bookingsData) {
          const now = new Date();
          let upcoming = 0;
          let completed = 0;
          const recent = bookingsData.slice(0, 3); // Get 3 most recent

          bookingsData.forEach(booking => {
            const bookingDate = new Date(booking.start_time);
            if (booking.status === 'confirmed' && bookingDate > now) {
              upcoming++;
            } else if (booking.status === 'completed') {
              completed++;
            }
          });

          setBookingStats({
            totalBookings: bookingsData.length,
            upcomingBookings: upcoming,
            completedBookings: completed,
            recentBookings: recent
          });
        }
      } catch (error) {
        console.error('Error fetching booking stats:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    return (
      <div className={`${styles.pageWrap} ${styles.pageTransition}`}>
        <div className={styles.headerRow}>
          <h2 className={styles.pageTitle}>Profile</h2>
        </div>

        <section className={`${styles.profileCard} ${styles.card}`}>
          <div className={styles.profileLeft}>
            <div className={styles.profileImageWrapper}>
              <Image src={profileImage} alt="Profile" width={120} height={120} className={styles.profileImage} />
              <input type="file" id="uploadInput" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
              <button className={styles.changeBtn} onClick={() => document.getElementById("uploadInput")?.click()}>
                Change
              </button>
            </div>

            <div className={styles.profileInfoText}>
              <h3 className={styles.profileName}>
                {loading ? <Skeleton width="180px" height="28px" /> : profileData.name}
              </h3>
              <div className={styles.profileMeta}>
                {loading ? <Skeleton width="120px" height="20px" style={{marginTop: '8px'}} /> : (profileData.phone || "No phone")}
              </div>
            </div>
          </div>

          <div className={styles.profileActions}>
            <button className={styles.editProfileBtn} onClick={() => setShowProfileModal(true)} disabled={loading}>
              <PencilSquareIcon className={styles.smallIcon} /> <span className={styles.editprofile}>Edit Profile</span>
            </button>
          </div>
        </section>

        <section className={styles.infoGrid} id={styles.info5}>
          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Full Name</label>
            <div className={styles.infoContent}>
              <UserCircleIcon className={styles.infoIcon} />
              {loading ? <Skeleton width="160px" /> : <span>{profileData.name}</span>}
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Email</label>
            <div className={styles.infoContent}>
              <EnvelopeIcon className={styles.infoIcon} />
              {loading ? <Skeleton width="200px" /> : <span>{profileData.email || "Not provided"}</span>}
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Phone</label>
            <div className={styles.infoContent}>
              <PhoneIcon className={styles.infoIcon} />
              {loading ? <Skeleton width="120px" /> : <span>{profileData.phone || "Not provided"}</span>}
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Gender</label>
            <div className={styles.infoContent}>
              {loading ? <Skeleton width="80px" /> : <span>{profileData.gender || "Not specified"}</span>}
            </div>
          </div>

          <div className={`${styles.infoBoxFull} ${styles.card}`}>
            <label>Address</label>
            <div className={styles.infoContent}>
              {loading ? <Skeleton width="100%" height="24px" /> : <span>{profileData.address || "Not provided"}</span>}
            </div>
          </div>
        </section>

        {/* Bookings Summary Section */}
        <section className={styles.infoGrid}>
          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Total Bookings</label>
            <div className={styles.infoContent}>
              <ShoppingBagIcon className={styles.infoIcon} />
              {loadingBookings ? <Skeleton width="40px" /> : <span>{bookingStats.totalBookings}</span>}
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Upcoming Bookings</label>
            <div className={styles.infoContent}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                {loadingBookings ? <Skeleton width="30px" /> : bookingStats.upcomingBookings}
              </span>
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Completed Bookings</label>
            <div className={styles.infoContent}>
              <span style={{ color: '#6b7280', fontWeight: 'bold' }}>
                {loadingBookings ? <Skeleton width="30px" /> : bookingStats.completedBookings}
              </span>
            </div>
          </div>
        </section>

        {/* Recent Bookings */}
        {bookingStats.recentBookings.length > 0 && (
          <section className={`${styles.infoBoxFull} ${styles.card}`}>
            <label>Recent Bookings</label>
            <div className={styles.recentBookings}>
              {bookingStats.recentBookings.map((booking, index) => (
                <div key={booking.id || index} className={styles.bookingItem}>
                  <div className={styles.bookingInfo}>
                    <span className={styles.bookingCode}>{booking.booking_code || `Booking #${booking.id}`}</span>
                    <span className={`${styles.statusBadge} ${booking.status === 'confirmed' ? styles.statusUpcoming :
                      booking.status === 'completed' ? styles.statusCompleted :
                        styles.statusIncomplete
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className={styles.bookingDate}>
                    {new Date(booking.start_time).toLocaleDateString()} - {new Date(booking.end_time).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.viewAllBtn}
              onClick={() => setActive("orders")}
            >
              View All Bookings
            </button>
          </section>
        )}

        {showProfileModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Edit Profile</h3>
                <button className={styles.iconBtn} onClick={() => setShowProfileModal(false)}>
                  <XMarkIcon className={styles.smallIcon} />
                </button>
              </div>

              <div className={styles.modalForm}>
                <label className={styles.formLabel}>First Name</label>
                <input
                  className={styles.formInput}
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Enter first name"
                />

                <label className={styles.formLabel}>Last Name</label>
                <input
                  className={styles.formInput}
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Enter last name"
                />

                <label className={styles.formLabel}>Email</label>
                <input
                  className={styles.formInput}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />

                <label className={styles.formLabel}>Gender</label>
                <select
                  className={styles.formInput}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>

                <label className={styles.formLabel}>Address</label>
                <textarea
                  className={styles.formInput}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your address"
                  rows="3"
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />

                <label className={styles.formLabel}>Phone</label>
                <input
                  className={styles.formInput}
                  value={profileData.phone}
                  readOnly
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className={styles.modalBtns}>
                <button className={styles.cancelBtn} onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button
                  className={styles.saveBtn}
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }












  /* --------------------------
     Orders Page (tabs + exact card layout + modal)
     -------------------------- */
  function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [orderTab, setOrderTab] = useState("all");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [visiblePhoneId, setVisiblePhoneId] = useState(null); // Track which phone number is visible

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

    // Fetch orders data from API
    useEffect(() => {
      const fetchOrders = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch(`/api/dashboard/bookings`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          } else {
            console.error('Failed to fetch orders:', response.status);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }, []);

    // Filter orders based on tab (removed incompleted)
    const filtered = orders.filter((o) => {
      if (orderTab === "all") return true;
      return (
        (orderTab === "upcoming" && o.status === "upcoming") ||
        (orderTab === "completed" && o.status === "completed")
      );
    });

    return (
      <div className={`${styles.pageWrap} ${styles.pageTransition}`}>
        <div className={styles.headerRow}>
          <h2 className={styles.pageTitle}>Orders</h2>
        </div>

        {/* Order Tabs - Removed Incompleted */}
        <div className={styles.orderTabsRow}>
          <button className={`${styles.orderTab} ${orderTab === "all" ? styles.orderTabActive : ""}`} onClick={() => setOrderTab("all")}>
            All
          </button>
          <button className={`${styles.orderTab} ${orderTab === "upcoming" ? styles.orderTabActive : ""}`} onClick={() => setOrderTab("upcoming")}>
            Upcoming
          </button>
          <button className={`${styles.orderTab} ${orderTab === "completed" ? styles.orderTabActive : ""}`} onClick={() => setOrderTab("completed")}>
            Completed
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <Loading fullScreen={false} size={40} />
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <EmptyState 
            icon="📋"
            title={`No ${orderTab === "all" ? "" : orderTab + " "}bookings`}
            message="Your bookings will appear here once you make a reservation."
          />
        )}

        {/* Orders List - Premium Cards */}
        <div className={styles.orderList}>
          {filtered.map((o) => {
            // Format dates for display (with Time in AM/PM)
            const formatDateTime = (dateStr) => {
              if (!dateStr) return 'N/A';
              const d = new Date(dateStr);
              // Use UTC to preserve "Face Value" time stored in DB
              return d.toLocaleString('en-IN', { 
                timeZone: 'UTC',
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
              });
            };

            const startDate = formatDateTime(o.startTime);
            const endDate = formatDateTime(o.endTime);

            return (
              <div key={o.id} className={styles.orderCard}>
                {/* Status Badge - Top Right */}
                <span className={`${styles.orderStatusBadge} ${
                  o.status === "completed" ? styles.statusCompleted : styles.statusUpcoming
                }`}>
                  {o.status === "completed" ? "Completed" : "Upcoming"}
                </span>

                {/* Top Section */}
                <div className={styles.orderCardTop}>
                  {/* Car Image */}
                  <div className={styles.orderImageWrap}>
                    <Image
                      src={o.img}
                      alt={o.title}
                      width={180}
                      height={101}
                      className={styles.orderImage}
                    />
                  </div>

                  {/* Car Info */}
                  <div className={styles.orderCarInfo}>
                    <h3 className={styles.orderTitle}>{o.title}</h3>
                    <p className={styles.orderDesc}>
                      Booking Code: {o.bookingCode} • {o.seats} Seats • {o.modelYear} Model
                    </p>
                    
                    {/* Phone Button / Display */}
                    <div className={styles.phoneWrapper}>
                      {visiblePhoneId === o.id ? (
                        <span 
                          className={styles.pnoneNumDisplay}
                          onClick={(e) => {
                            e.stopPropagation();
                            setVisiblePhoneId(null); // Click to hide
                          }}
                          title="Click to hide"
                        >
                          {o.hostPhone || 'No Info'}
                        </span>
                      ) : (
                        <button 
                          className={styles.phoneBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (/Mobi|Android/i.test(navigator.userAgent)) {
                               window.location.href = `tel:${o.hostPhone}`;
                            } else {
                               // Toggle visibility on desktop
                               setVisiblePhoneId(o.id);
                            }
                          }}
                          title={o.status === 'upcoming' ? "Call Host" : "Call Support"}
                        >
                          <PhoneIcon className={styles.phoneIconSmall} />
                        </button>
                      )}

                      
                    </div>

                    {/* Price Badge */}
                    <div className={styles.orderPriceBadge}>
                      <span className={styles.orderPriceText}>TOTAL : {o.price}</span>
                    </div>
                  </div>
                </div>

                {/* Divider Line */}
                <hr className={styles.orderDivider} />

                {/* Bottom Section */}
                <div className={styles.orderCardBottom}>
                  {/* Left: User Info */}
                  <div className={styles.orderMetaLeft}>
                    <span className={styles.orderMetaLabel}>Host name : {o.userName || 'Guest'}</span>
                    <span className={styles.orderMetaDuration}>During : {startDate} to {endDate}</span>
                    <span className={styles.orderMetaLabel}>No. of Hours : {o.hours}</span>
                  </div>

                  {/* Right: Host Info & Actions */}
                  <div className={styles.orderMetaRight}>
                    <p className={styles.orderHostInfo}>
                      Car address: {o.hostAddress || 'Contact host for pickup location'}
                    </p>
                    
                    {/* Car Registration Number (Only for Upcoming Orders) */}
                    {o.status === "upcoming" && (
                       <div className={styles.orderRegNumber}>
                         <div className={styles.plateContainer}>
                            <span className={styles.plateLabel}>IND</span>
                            <span className={styles.plateValue}>{o.registrationNumber}</span>
                         </div>
                         
                       </div>
                       
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }













  
  /* --------------------------
     Host Page (kept simple here — ready for your design)
     -------------------------- */

  function HostPage() {
    const steps = [
      { icon: "/icons/book.svg", title: "Booking Online" },
      { icon: "/icons/check.svg", title: "Confirmation" },
      { icon: "/icons/calc.svg", title: "Estimate Details" },
      { icon: "/icons/complete.svg", title: "Complete Works" },
    ];

    return (
      <motion.div
      className={styles.hostContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER SECTION */}
      <motion.div
        className={styles.processHeader}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className={styles.smallTitle}>Become a Host With <span className={styles.highlighthost}>"Miles"</span> </span>
        <h2 className={styles.headhighlight}>
         List your car today <span className={styles.highlight}> Start earning tomorrow.</span>
        </h2>
      </motion.div>

      {/* RESPONSIVE PROCESS IMAGE */}
      <motion.div 
        className={styles.processImageWrapper}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <picture>
          {/* Mobile Image (shown below 768px) */}
          <source media="(max-width: 768px)" srcSet="/host-dash-mobile.webp" />
          {/* Desktop Image (default) */}
          <img 
            src="/hpanel-host.webp" 
            alt="Work Process Flow" 
            className={styles.processMainImage} 
          />
        </picture>
      </motion.div>

      {/* ABOUT / INFO SECTION */}
      <motion.div
        className={styles.infoSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        

        <div className={styles.infoRight}>
          
          <h2>Built for hosts. Powered by trust.</h2>
          <p>
            Your safety, control, and earnings come before everything else.
          </p>

          <motion.div
            className={styles.trackingBox}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4>Why us</h4>
            <p>★ Transparent & Timely Earnings.</p>
            <p>★ Partnership, Not Just a Listing.</p>
            <p>★ Your Car Is an Asset, Not a Commodity.</p>
            <p>★ Control Isn’t Optional. It’s Guaranteed.</p>
          </motion.div>

          

          <div className={styles.contactRow}>
            <Link href="/host-registration">
            <button className={styles.detailsBtn}>More Details</button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
    );
  }













  /* --------------------------
     Support Page
     -------------------------- */
  function SupportPage() {
    return (
      <div className={`${styles.pageWrap} ${styles.pageTransition}`}>
        <h2 className={styles.pageTitle}>Support</h2>
        <div className={`${styles.panel} ${styles.card}`}>
          <p className={styles.supportHeaddash}>If you need help, contact our support team:</p>
          <div className={styles.supportMethods}>
            <div className={`${styles.supportMethod} ${styles.card}`}>
              <EnvelopeIcon className={styles.infoIcon} />
              <div>
                <b>Email</b>
                <div className={styles.muted}>Support@mmmiles.com</div>
              </div>
            </div>

            <div className={`${styles.supportMethod} ${styles.card}`}>
              <PhoneIcon className={styles.infoIcon} />
              <div>
                <b>User Helpline</b>
                <div className={styles.muted}>8050953607</div>
              </div>
            </div>

            <div className={`${styles.supportMethod} ${styles.card}`}>
              <PhoneIcon className={styles.infoIcon} />
              <div>
                <b>Host Helpline</b>
                <div className={styles.muted}>8050953609</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* --------------------------
     Render content based on active
     -------------------------- */

  const renderContent = () => {
    switch (active) {
      case "profile":
        return <ProfilePage />;
      case "orders":
        return <OrdersPage />;
      case "host":
        return <HostPage />;
      case "support":
        return <SupportPage />;
      case "announcement":
      default:
        return <AnnouncementPage />;
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");

    // 🔔 Notify Navbar instantly
    window.dispatchEvent(new Event("auth-change"));

    window.location.href = "/login";
  };






  if (isCheckingAuth) {
    return <Loading fullScreen={true} size={60} />;
  }

  return (
    <div className={`${styles.root} ${styles.container} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
           
          </div>

          <nav className={styles.menu}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.menuItem} ${active === item.id ? styles.activeItem : ""}`}
                  onClick={() => setActive(item.id)}
                  aria-pressed={active === item.id}
                >
                  <div className={styles.iconWrapper}>
                    <Icon className={styles.menuIcon} />
                  </div>
                  <span className={styles.menuLabel}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Logout <ArrowRightOnRectangleIcon className={styles.logoutIcon} />
          </button>
        </div>
      </aside>

      <main className={styles.main}>{renderContent()}</main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<Loading fullScreen={true} size={60} />}>
      <DashboardContent />
    </Suspense>
  );
}