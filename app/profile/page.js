"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Mail,
  Phone,
  Car,
  Clock,
  TrendingUp,
  Award,
  Edit,
  Download,
  Sun,
  Moon,
} from "lucide-react";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const [theme, setTheme] = useState("dark");
  const [avatar, setAvatar] = useState("/profile-avatar.png");

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") || "dark";
    setTheme(storedTheme);
    document.documentElement.setAttribute("data-theme", storedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setAvatar(imageUrl);
  };

  return (
    <div className={styles.appWrapper}>
      
      

      {/* ✅ CONTENT CONTAINER */}
      <div className={styles.appContainer}>

        {/* ✅ TOP SECTION */}
        <div className={styles.topSection}>

          {/* Avatar */}
          <div className={styles.avatarBox}>
            <Image
              src={avatar}
              alt="Profile Avatar"
              width={95}
              height={95}
              className={styles.avatar}
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
          </div>

          {/* User Text */}
          <div className={styles.userText}>
            <h1 className={styles.userName}>John Doe</h1>
            <p className={styles.userSubtitle}>MM Miles User</p>
          </div>

          {/* Buttons */}
          <div className={styles.topButtons}>
            <button className={styles.editBtn}>
              <Edit size={18} />
              Edit Profile
            </button>

            <button className={styles.headerToggle} onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
          </div>
        </div>

        {/* ✅ Journey Summary */}
        <h2 className={styles.sectionTitle}>Journey Summary</h2>

        <div className={styles.journeyGrid}>

          <div className={styles.journeyCard}>
            <div className={styles.journeyTopRow}>
              <Car className={styles.journeyIcon} />
              <span className={styles.journeyNumber}>2,340</span>
              <span className={styles.journeyUnit}>km</span>
            </div>
            <div className={styles.journeyBottomText}>Total Distance Travelled</div>
          </div>

          <div className={styles.journeyCard}>
            <div className={styles.journeyTopRow}>
              <Clock className={styles.journeyIcon} />
              <span className={styles.journeyNumber}>198</span>
              <span className={styles.journeyUnit}>hrs</span>
            </div>
            <div className={styles.journeyBottomText}>Total Time Spent</div>
          </div>

          <div className={styles.journeyCard}>
            <div className={styles.journeyTopRow}>
              <TrendingUp className={styles.journeyIcon} />
              <span className={styles.journeyNumber}>12</span>
            </div>
            <div className={styles.journeyBottomText}>Cities Visited</div>
          </div>

          <div className={styles.journeyCard}>
            <div className={styles.journeyTopRow}>
              <Award className={styles.journeyIcon} />
              <span className={styles.journeyNumber}>5</span>
            </div>
            <div className={styles.journeyBottomText}>Vehicle Types Used</div>
          </div>

        </div>

        {/* ✅ Profile Info */}
        <h2 className={styles.sectionTitle}>Profile Information</h2>

        <div className={styles.infoGrid}>

          <div className={styles.infoCard}>
            <label className={styles.infoLabel}>Full Name</label>
            <div className={styles.infoValue}>John Doe</div>
          </div>

          <div className={styles.infoCard}>
            <label className={styles.infoLabel}>Email</label>
            <div className={styles.infoValue}>
              <Mail size={18} className={styles.infoIcon} />
              johndoe@gmail.com
            </div>
          </div>

          <div className={styles.infoCard}>
            <label className={styles.infoLabel}>Phone</label>
            <div className={styles.infoValue}>
              <Phone size={18} className={styles.infoIcon} />
              +91 9876543210
            </div>
          </div>

          <div className={styles.infoCard}>
            <label className={styles.infoLabel}>Member Since</label>
            <div className={styles.infoValue}>2023</div>
          </div>

        </div>

      </div>
    </div>
  );
}