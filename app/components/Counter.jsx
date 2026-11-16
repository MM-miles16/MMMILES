"use client";

import React, { useState, useEffect, useRef } from 'react';

// The styles object is now a prop
export default function Counter({ value, label, styles }) {
    const [count, setCount] = useState(0);
    const counterRef = useRef(null); // Create a ref to attach to the element
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the element is visible, set the state to true
                if (entry.isIntersecting) {
                    setIsVisible(true);
                } else {
                    // If it's not visible, reset the state and the count
                    setIsVisible(false);
                    setCount(0);
                }
            },
            {
                threshold: 0.5, // Trigger when 50% of the element is visible
            }
        );

        if (counterRef.current) {
            observer.observe(counterRef.current);
        }

        // Clean up the observer when the component unmounts
        return () => {
            if (counterRef.current) {
                observer.unobserve(counterRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Only run the animation if the component is visible
        if (!isVisible) return;

        const duration = 1500;
        const startTimestamp = performance.now();
        const startValue = 0;
        const endValue = parseInt(value, 10);
        
        if (isNaN(endValue)) {
            setCount(value);
            return;
        }

        const animate = (timestamp) => {
            const elapsedTime = timestamp - startTimestamp;
            const progress = Math.min(elapsedTime / duration, 1);
            const animatedValue = Math.floor(progress * (endValue - startValue) + startValue);
            setCount(animatedValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);

    }, [isVisible, value]); // Rerun the effect when isVisible changes

    return (
        <div ref={counterRef} className={styles.statItem}>
            <div className={styles.statIconBackground}></div> 
            <p className={styles.statNumber} data-mm-keep>{count}</p>
            <p className={styles.statLabel}>{label}</p>
        </div>
    );
}