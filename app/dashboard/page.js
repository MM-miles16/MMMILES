"use client";

import { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import Image from "next/image";
import { motion } from "framer-motion";

import {
  BellAlertIcon,
  UserCircleIcon,
  ShoppingBagIcon,
  HomeModernIcon,
  LifebuoyIcon,
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

export default function Dashboard() {
  const [active, setActive] = useState("announcement");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileImage, setProfileImage] = useState("/user.png");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Orders: modal
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderModalData, setOrderModalData] = useState(null);

  const menuItems = [
    { id: "announcement", label: "Announcements", icon: BellAlertIcon },
    { id: "profile", label: "Profile", icon: UserCircleIcon },
    { id: "orders", label: "Orders", icon: ShoppingBagIcon },
    { id: "host", label: "Host Your Car", icon: HomeModernIcon },
    { id: "support", label: "Support", icon: LifebuoyIcon },
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
            className={`${styles.tabButton} ${
              activeTab === tab ? styles.activeTab : ""
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

    // Fetch profile data from API
    useEffect(() => {
      const fetchProfileData = async () => {
        const userId = getUserId();
        if (!userId) return;

        try {
          const response = await fetch(`/api/dashboard/profile?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setProfileData(data);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProfileData();
    }, []);

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
              <h3 className={styles.profileName}>{loading ? "Loading..." : profileData.name}</h3>
              <div className={styles.profileMeta}>{profileData.phone || "No phone"}</div>
            </div>
          </div>

          <div className={styles.profileActions}>
            <button className={styles.editProfileBtn} onClick={() => setShowProfileModal(true)} disabled={loading}>
              <PencilSquareIcon className={styles.smallIcon} /> Edit Profile
            </button>
          </div>
        </section>

        <section className={styles.infoGrid}>
          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Full Name</label>
            <div className={styles.infoContent}>
              <UserCircleIcon className={styles.infoIcon} />
              <span>{loading ? "Loading..." : profileData.name}</span>
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Email</label>
            <div className={styles.infoContent}>
              <EnvelopeIcon className={styles.infoIcon} />
              <span>{loading ? "Loading..." : profileData.email || "Not provided"}</span>
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Phone</label>
            <div className={styles.infoContent}>
              <PhoneIcon className={styles.infoIcon} />
              <span>{loading ? "Loading..." : profileData.phone || "Not provided"}</span>
            </div>
          </div>

          <div className={`${styles.infoBox} ${styles.card}`}>
            <label>Gender</label>
            <div className={styles.infoContent}>
              <span>{loading ? "Loading..." : profileData.gender || "Not specified"}</span>
            </div>
          </div>

          <div className={`${styles.infoBoxFull} ${styles.card}`}>
            <label>Address</label>
            <div className={styles.infoContent}>
              <span>{loading ? "Loading..." : profileData.address || "Not provided"}</span>
            </div>
          </div>
        </section>

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
                <label className={styles.formLabel}>Full name</label>
                <input className={styles.formInput} defaultValue={profileData.name} />

                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} defaultValue={profileData.email} />

                <label className={styles.formLabel}>Phone</label>
                <input className={styles.formInput} defaultValue={profileData.phone} />
              </div>

              <div className={styles.modalBtns}>
                <button className={styles.cancelBtn} onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button className={styles.saveBtn} onClick={() => setShowProfileModal(false)}>
                  Save
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
          const response = await fetch(`/api/dashboard/bookings?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setOrders(data);
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchOrders();
    }, []);

    const filtered = orders.filter((o) => {
      if (orderTab === "all") return true;
      return (
        (orderTab === "upcoming" && o.status === "upcoming") ||
        (orderTab === "completed" && o.status === "completed") ||
        (orderTab === "incompleted" && o.status === "incompleted")
      );
    });

    const openOrderModal = (order) => {
      setOrderModalData(order);
      setOrderModalOpen(true);
    };

    return (
      <div className={`${styles.pageWrap} ${styles.pageTransition}`}>
        <div className={styles.headerRow}>
          <h2 className={styles.pageTitle}>Orders</h2>
        </div>

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
          <button className={`${styles.orderTab} ${orderTab === "incompleted" ? styles.orderTabActive : ""}`} onClick={() => setOrderTab("incompleted")}>
            Incompleted
          </button>
        </div>

        <div className={styles.orderList}>
          {loading ? (
            <div className={styles.infoCard}>
              <div className={styles.infoValue}>Loading orders...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.infoCard}>
              <div className={styles.infoValue}>No orders found</div>
            </div>
          ) : (
            filtered.map((o) => (
            <article key={o.id} className={`${styles.orderCard} ${styles.card}`}>
              <div className={styles.orderLeft}>
                <div className={styles.ratingBadge}>★ {o.rating}</div>
                <div className={styles.carImageWrap}>
                  {/* Note: place matching images into public/ folder (car-sample.png, car-sample-2.png, ...) */}
                  <Image src={o.img} alt={o.title} width={420} height={240} className={styles.orderCarImg} />
                </div>
              </div>

              <div className={styles.orderRight}>
                <h3 className={styles.orderCarName}>{o.title}</h3>

                <ul className={styles.featureList}>
                  {o.features.map((f, i) => (
                    <li key={i}>✓ {f}</li>
                  ))}
                </ul>

                <ul className={styles.detailList}>
                  <li>Pickup: <span className={styles.detailInline}>{o.pickup}</span></li>
                  <li>Dropoff: <span className={styles.detailInline}>{o.dropoff}</span></li>
                </ul>

                <div className={styles.orderActions}>
                  <div>
                    <div className={styles.priceRow}>
                      <span className={styles.carPrice}>{o.price}</span>
                    </div>
                  </div>

                  <div className={styles.actionsRight}>
                    <span
                      className={`${styles.statusBadge} ${
                        o.status === "upcoming" ? styles.statusUpcoming : o.status === "completed" ? styles.statusCompleted : styles.statusIncompleted
                      }`}
                    >
                      {o.status === "upcoming" ? "Upcoming" : o.status === "completed" ? "Completed" : "Incompleted"}
                    </span>

                    <button className={styles.viewBtn} onClick={() => openOrderModal(o)}>
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </article>
            ))
          )}
        </div>

        {/* Order Details Modal */}
        {orderModalOpen && orderModalData && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h3>Order Details</h3>
                <button className={styles.iconBtn} onClick={() => setOrderModalOpen(false)}>
                  <XMarkIcon className={styles.smallIcon} />
                </button>
              </div>

              <div className={styles.modalContent}>
                <div className={styles.modalImageWrap}>
                  <Image src={orderModalData.img} alt={orderModalData.title} width={420} height={220} className={styles.modalImg} />
                </div>

                <div className={styles.modalInfo}>
                  <h4 className={styles.modalTitle}>{orderModalData.title}</h4>
                  <p><b>Pickup:</b> {orderModalData.pickup}</p>
                  <p><b>Dropoff:</b> {orderModalData.dropoff}</p>
                  <p><b>Price:</b> {orderModalData.price}</p>
                  <p><b>Features:</b> {orderModalData.features.join(" • ")}</p>
                  <p><b>Details:</b> {orderModalData.details.join(" • ")}</p>
                </div>
              </div>

              <div className={styles.modalBtns}>
                <button className={styles.cancelBtn} onClick={() => setOrderModalOpen(false)}>Close</button>
                <button className={styles.saveBtn} onClick={() => setOrderModalOpen(false)}>OK</button>
              </div>
            </div>
          </div>
        )}
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
      <motion.div
        className={styles.processHeader}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <span className={styles.smallTitle}>WORK PROCESS</span>
        <h2>
          We Follow the <span className={styles.highlight}>Process</span>
        </h2>
      </motion.div>

      <div className={styles.stepsWrapper}>
        <div className={styles.stepsRow}>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={styles.stepCard}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <div className={styles.stepIcon}>
                <img src={step.icon} alt="icon" />
              </div>
              <h3>{step.title}</h3>
              <p>Completely responsive forward conveniently target fixed</p>
            </motion.div>
          ))}
        </div>

        <img src="/icons/curve-arrows.svg" className={styles.arrowCurve} />
      </div>

      <motion.div
        className={styles.infoSection}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
      >
        <div className={styles.infoLeft}>
          <motion.img
            src="/images/hero.png"
            className={styles.infoImage}
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className={styles.infoRight}>
          <span className={styles.aboutTag}>About The Company</span>
          <h2>Logistics Solutions That Deliver Excellence</h2>
          <p>
            Payment solutions enable businesses to accept secure payments from customers.
          </p>

          <motion.div
            className={styles.trackingBox}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h4>📍 Real-Time Tracking</h4>
            <p>Many variations of lorem ipsum passages available.</p>
          </motion.div>

          <div className={styles.contactRow}>
            <button className={styles.detailsBtn}>More Details</button>
            <div className={styles.phoneBox}>
              <strong>Emergency</strong>
              <p>📞 +60 (380) 555-0234</p>
            </div>
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
          <p>If you need help, contact our support team:</p>
          <div className={styles.supportMethods}>
            <div className={`${styles.supportMethod} ${styles.card}`}>
              <EnvelopeIcon className={styles.infoIcon} />
              <div>
                <b>Email</b>
                <div className={styles.muted}>support@miles.example</div>
              </div>
            </div>

            <div className={`${styles.supportMethod} ${styles.card}`}>
              <PhoneIcon className={styles.infoIcon} />
              <div>
                <b>Phone</b>
                <div className={styles.muted}>+91 1800 123 456</div>
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

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_profile");

    // 🔔 Notify Navbar instantly
    window.dispatchEvent(new Event("auth-change"));

    window.location.href = "/login";
  };

  return (
    <div className={`${styles.root} ${styles.container} ${isSidebarCollapsed ? styles.sidebarCollapsed : ""}`}>
      <aside className={styles.sidebar}>
        <div>
          <div className={styles.logo}>
            <Image src="/logo.png" alt="MM Miles Logo" width={120} height={40} />
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