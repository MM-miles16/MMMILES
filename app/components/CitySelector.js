"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FaTimes, FaSearch, FaCrosshairs } from "react-icons/fa";
import styles from "./CitySelector.module.css";

const CITY_DATA = [
    { name: "Chennai", image: "/icons/chennai.avif" },
    { name: "Bengaluru", image: "/icons/bengaluru.avif" },
    { name: "Kochi", image: "/icons/kochi.avif" },
    { name: "Hyderabad", image: "/icons/hyd.png" },
    { name: "Mumbai", image: "/icons/mumbai.avif" },
    // Adding Delhi/NCR if you have the icon
    { name: "Delhi-NCR", image: "/icons/ncr.avif" },
];

export default function CitySelector({ isOpen, onClose, onSelect, selectedCity }) {
    const [mounted, setMounted] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const filteredCities = CITY_DATA.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!mounted) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Close Button implementation similar to BMS might not be strictly visible or is top right. tailored here. */}
                {/* <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <FaTimes size={20} />
        </button> */}
                {/* BMS usually interacts via clicking outside or explicit close if mobile. Keeping standard close for utility. */}

                <div className={styles.contentContainer}>
                    {/* Search Bar */}
                    <div className={styles.searchContainer}>
                        <div className={styles.searchBox}>
                            <FaSearch className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search for your city"
                                className={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Popular Cities */}
                    <div className={styles.sectionTitle}>Popular Cities</div>

                    <div className={styles.citiesGrid}>
                        {filteredCities.map((city) => (
                            <div
                                key={city.name}
                                className={`${styles.cityItem} ${selectedCity === city.name ? styles.selected : ""}`}
                                onClick={() => {
                                    onSelect(city.name);
                                    onClose();
                                }}
                            >
                                <div className={styles.cityIconWrapper}>
                                    <Image
                                        src={city.image}
                                        alt={city.name}
                                        width={40}
                                        height={40}
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className={styles.cityName}>{city.name}</div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
}
