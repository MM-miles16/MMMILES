// File: ReviewSection.jsx
"use client";
import Image from "next/image";
import { useState } from 'react'; 
import "./ReviewSection.css"; 

// 1. ADD YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMV0ZA7qkz8JJmCCyHy-iWBG43HXHHQr-9MXKaoVRONlnfZ9PUkcp9pdUTCvQmFByz/exec'; 

export default function ReviewSection() {
    const RATING_URL = 'https://www.google.com/maps/place/MM+Miles+Self-Drive+Car+Rental+Chennai/@13.0734852,80.1639008,17z/data=!4m6!3m5!1s0x3a5261d706428fe1:0xeffde64f1e5b38fd!8m2!3d13.0735033!4d80.1637973!16s%2Fg%2F11yk1rwwv3?entry=ttu&g_ep=EgoyMDI1MTAyOS4yIKXMDSoASAFQAw%3D%3D';
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleCloseModal = () => setIsModalOpen(false);

    // This function is now just a final notification, the submission happens in the Modal
    const handleSubmit = (formData) => {
        console.log("Review submitted successfully:", formData);
    };
    
    const handleRatingClick = () => {
        window.open(RATING_URL, '_blank');
    };

    return (
        <div className="review-body">
            <section className="reviewWrapper">
                <div className="reviewSection">
                    
                    {/* First Card (Review Form Modal) */}
                    <div className="reviewCard">
                        <div className="reviewContent">
                            <Image 
                                src="/people.png" 
                                alt="Share Experience" 
                                width={80} 
                                height={80} 
                                className="reviewImg"
                            />
                            <div className="reviewText">
                                <h3>
                                    Kindly Drop Your Experience with us <br />
                                    & Save Big on Your Next Ride
                                </h3>
                                <button 
                                    className="reviewBtn"
                                    onClick={() => setIsModalOpen(true)} 
                                >
                                    Be one of our success story
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Second Card (Rating Link) */}
                    <div className="reviewCard">
                        <div className="reviewContent">
                            <Image 
                                src="/star.png" 
                                alt="Rate Us" 
                                width={80} 
                                height={80} 
                                className="reviewImg1"
                            />
                            <div className="reviewText">
                                <h3>
                                    Give Us Your Rating with your <br />
                                    Experience
                                </h3>
                                <button 
                                    className="reviewBtn"
                                    onClick={handleRatingClick}
                                >
                                    Your One Click Help Many
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Conditionally render the Modal if isModalOpen is true */}
            {isModalOpen && (
                <ReviewModal 
                    onClose={handleCloseModal} 
                    onSubmit={handleSubmit}
                    googleScriptUrl={GOOGLE_SCRIPT_URL} // Pass the URL to the modal
                />
            )}
        </div>
    );
}

// --- UPDATED MODAL COMPONENT DEFINITION (WITH FETCH LOGIC) ---
const ReviewModal = ({ onClose, onSubmit, googleScriptUrl }) => { // Accept URL as prop
    const [formData, setFormData] = useState({
        name: '',
        month: '', 
        review: ''
    });
    
    const [submissionStatus, setSubmissionStatus] = useState('idle'); 

    const MONTH_OPTIONS = [
        "January", "February", "March", "April", 
        "May", "June", "July", "August", 
        "September", "October", "November", "December"
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (submissionStatus !== 'idle' || !googleScriptUrl) {
            if (!googleScriptUrl) alert("ERROR: Google Sheet submission URL is missing.");
            return;
        }

        if (!formData.name || !formData.month || !formData.review) {
            alert("Please fill in all fields.");
            return;
        }

        setSubmissionStatus('submitting');
        
        try {
            const response = await fetch(googleScriptUrl, {
                method: 'POST',
                // CRITICAL: Apps Script needs a JSON string in the body with this Content-Type
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: JSON.stringify(formData), 
            });
            
            // Apps Script usually returns a JSON response; parse it.
            const result = await response.json(); 
            
            // Check for success marker from the Apps Script (assuming script returns {result: 'success'})
            if (response.ok && result.result === 'success') {
                onSubmit(formData); 
                setSubmissionStatus('success');
            } else {
                // Handle network or script error
                throw new Error(result.message || 'Submission failed on the server.');
            }

            // Wait 1.5 seconds, then close the modal
            setTimeout(() => {
                onClose(); 
            }, 1500); 

        } catch (error) {
            console.error('Submission failed:', error);
            alert(`Submission failed: ${error.message || 'Network error'}. Check your script deployment.`);
            setSubmissionStatus('idle'); // Reset to allow re-submission
        }
    };
    
    const getButtonText = () => {
        if (submissionStatus === 'submitting') return 'Submitting...';
        if (submissionStatus === 'success') return 'Submitted! 🎉';
        return 'Submit & Claim Discount';
    };

    const isFormDisabled = submissionStatus !== 'idle';

    return (
        // Modal Backdrop
        <div className="modalBackdrop" onClick={onClose}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                {submissionStatus !== 'submitting' && (
                    <button className="modalCloseBtn" onClick={onClose}>&times;</button>
                )}
                
                <h3 className="modalTitle">Share Your Experience</h3>
                <p className="modalSubtitle">Tell us about your ride and get a discount on your next trip!</p>

                <form onSubmit={handleFormSubmit} className="modalForm">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="modalInput"
                        required
                        disabled={isFormDisabled} 
                    />
                    
                    <select
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        className="modalInput"
                        required
                        disabled={isFormDisabled}
                    >
                        <option value="" disabled>Select Car Rented Month *</option>
                        {MONTH_OPTIONS.map((month) => (
                            <option key={month} value={month}>
                                {month}
                            </option>
                        ))}
                    </select>

                    <textarea
                        name="review"
                        placeholder="Your Review (Max 500 characters)"
                        value={formData.review}
                        onChange={handleChange}
                        className="modalInput modalTextarea"
                        rows="4"
                        maxLength="500"
                        required
                        disabled={isFormDisabled}
                    ></textarea>
                    
                    <button 
                        type="submit" 
                        className={`reviewBtn modalSubmitBtn ${submissionStatus === 'success' ? 'success' : ''}`}
                        disabled={isFormDisabled}
                    >
                        {getButtonText()}
                    </button>
                </form>
            </div>
        </div>
    );
};