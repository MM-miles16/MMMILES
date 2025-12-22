"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { upload } from "@vercel/blob/client";
import styles from "./Registration.module.css";
import { handleRegistration } from "./actions";

// Define the schema OUTSIDE the component to prevent re-creation on every render
const schema = z.object({
  phone: z.string().min(10, "Enter a valid phone number"),
  altPhone: z.string().min(10, "Enter a valid alternative number"),
  email: z.string().email("Invalid email address"),
  aadharNumber: z.string().length(12, "Aadhar must be 12 digits"),
  rcCard: z.any().refine((files) => files?.length > 0, "RC Card is required"),
  aadharPhoto: z.any().refine((files) => files?.length > 0, "Aadhar photo is required"),
  licensePhoto: z.any().refine((files) => files?.length > 0, "License photo is required"),
  insurancePhoto: z.any().refine((files) => files?.length > 0, "Insurance photo is required"),
  carPictures: z.any()
    .refine((files) => files?.length >= 4, "Upload at least 4 car pictures")
    .refine((files) => files?.length <= 8, "Maximum 8 pictures allowed"),
});

export default function HostRegistration() {
  const [showPopup, setShowPopup] = useState(false);
  const [buttonText, setButtonText] = useState("Submit Registration");

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setButtonText("Submitting...");

      // 1. Helper for direct browser-to-cloud upload (Fastest)
      const directUpload = async (file, folder) => {
        if (!file || file.size === 0) return "";
        const newBlob = await upload(`hosts/${folder}/${file.name}`, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        return newBlob.url;
      };

      // 2. Parallel upload of all files
      const carFiles = Array.from(data.carPictures);
      const [aadharUrl, licenseUrl, rcUrl, insuranceUrl, ...carPicUrls] = await Promise.all([
        directUpload(data.aadharPhoto[0], "identity"),
        directUpload(data.licensePhoto[0], "identity"),
        directUpload(data.rcCard[0], "vehicle"),
        directUpload(data.insurancePhoto[0], "vehicle"),
        ...carFiles.map(file => directUpload(file, "cars"))
      ]);

      // 3. Send URLs to Server Action for Google Sheets
      const result = await handleRegistration({
        email: data.email,
        phone: data.phone,
        altPhone: data.altPhone,
        aadharNumber: data.aadharNumber,
        urls: { aadharUrl, licenseUrl, rcUrl, insuranceUrl, carPicUrls }
      });
      
      if (result.success) {
        setButtonText("Successful!");
        setShowPopup(true); // Form disappears, Popup appears
      } else {
        setButtonText("Submit Registration");
        alert("Error: " + result.message);
      }
    } catch (error) {
      setButtonText("Submit Registration");
      console.error("Submission error:", error);
      alert("Something went wrong. Please check your connection.");
    }
  };

  const handleResetForNewCar = () => {
    reset();
    setShowPopup(false);
    setButtonText("Submit Registration");
  };

  return (
    <div className={styles.container}>
      {/* If showPopup is FALSE, show the form */}
      {!showPopup ? (
        <>
          <h1 className={styles.title}>Register as a Host</h1>
          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <section className={styles.section}>
              <h3>Personal Details</h3>
              <input {...register("email")} placeholder="Gmail Address" type="email" />
              {errors.email && <p className={styles.error}>{errors.email.message}</p>}

              <input {...register("phone")} placeholder="Phone Number" />
              {errors.phone && <p className={styles.error}>{errors.phone.message}</p>}

              <input {...register("altPhone")} placeholder="Alternative Phone" />
            </section>

            <section className={styles.section}>
              <h3>Identity & Vehicle Documents</h3>
              <label>Aadhar Card Number</label>
              <input {...register("aadharNumber")} placeholder="12 Digit Number" />
              
              <label>Aadhar Photo</label>
              <input type="file" {...register("aadharPhoto")} accept="image/*" />
              <label>Driving License</label>
              <input type="file" {...register("licensePhoto")} accept="image/*" />
              <label>Car RC Card</label>
              <input type="file" {...register("rcCard")} accept="image/*" />
              <label>Vehicle Insurance</label>
              <input type="file" {...register("insurancePhoto")} accept="image/*" />
            </section>

            <section className={styles.section}>
              <h3>Car Pictures (4-8 Pictures)</h3>
              <input type="file" multiple accept="image/*" {...register("carPictures")} />
              {errors.carPictures && <p className={styles.error}>{errors.carPictures.message}</p>}
            </section>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {buttonText}
            </button>
          </form>
        </>
      ) : (
        /* If showPopup is TRUE, show only this card */
        <div className={styles.successWrapper}>
          <div className={styles.popupCard}>
            <div className={styles.successBadge}>✓</div>
            <h2>Data Received Successfully</h2>
            
            <div className={styles.privacyBox}>
              🔒 <b>Security Guarantee:</b> We value your privacy. Your data is encrypted and securely stored. We <b>never</b> share or provide your information to any other platforms.
            </div>

            <p>Our <b>Host Executive Officer</b> will call you within <b>10 hours</b> to finalize your listing.</p>
            
            <div className={styles.popupActions}>
              <button onClick={handleResetForNewCar} className={styles.addMoreBtn}>
                Add Another Car
              </button>
              <a href="https://wa.me/919945686287" className={styles.waBtn}>
                Contact Us
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}