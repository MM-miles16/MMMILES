"use client";
import Image from "next/image";
import { useState } from 'react'; 
import "./ReviewSection.css"; 

// 1. ADD YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMV0ZA7qkz8JJmCCyHy-iWBG43HXHHQr-9MXKaoVRONlnfZ9PUkcp9pdUTCvQmFByz/exec'; 

export default function ReviewSection() {
    const RATING_URL = 'https://g.page/r/Cf04Wx5P5v3vEAE/review';
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSubmit = (formData) => {
        console.log("Review submitted successfully:", formData);
    };
    
    const handleRatingClick = () => {
        window.open(RATING_URL, '_blank');
    };

    return (
        <div className="userrating-review-body">
            <section className="userrating-reviewWrapper">
                <div className="userrating-reviewSection">
                    
                    {/* First Card (Review Form Modal) */}
                    <div className="userrating-reviewCard">
                        <div className="userrating-reviewContent">
                            <Image 
                                src="/people.png" 
                                alt="Share Experience" 
                                width={80} 
                                height={80} 
                                className="userrating-reviewImg"
                            />
                            <div className="userrating-reviewText">
                                <h3>
                                    Kindly Drop Your Experience <br />
                                    & Save Big on Your Next Ride
                                </h3>
                                <button 
                                    className="userrating-reviewBtn"
                                    onClick={() => setIsModalOpen(true)} 
                                >
                                    Share your success story
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Second Card (Rating Link) */}
                    <div className="userrating-reviewCard">
                        <div className="userrating-reviewContent">
                            <Image 
                                src="/star.png" 
                                alt="Rate Us" 
                                width={80} 
                                height={80} 
                                className="userrating-reviewImg1"
                            />
                            <div className="userrating-reviewText">
                                <h3 id="userrating-reviewText2">
                                    Give Us Your Rating with your <br />
                                    Experience
                                </h3>
                                <button 
                                    className="userrating-reviewBtn"
                                    onClick={handleRatingClick}
                                >
                                    Your One Click Help Many
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {isModalOpen && (
                <ReviewModal 
                    onClose={handleCloseModal} 
                    onSubmit={handleSubmit}
                    googleScriptUrl={GOOGLE_SCRIPT_URL}
                />
            )}
        </div>
    );
}

const ReviewModal = ({ onClose, onSubmit, googleScriptUrl }) => {
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                },
                body: JSON.stringify(formData), 
            });
            
            const result = await response.json(); 
            
            if (response.ok && result.result === 'success') {
                onSubmit(formData); 
                setSubmissionStatus('success');
            } else {
                throw new Error(result.message || 'Submission failed on the server.');
            }

            setTimeout(() => {
                onClose(); 
            }, 1500); 

        } catch (error) {
            console.error('Submission failed:', error);
            alert(`Submission failed: ${error.message || 'Network error'}. Check your script deployment.`);
            setSubmissionStatus('idle');
        }
    };
    
    const getButtonText = () => {
        if (submissionStatus === 'submitting') return 'Submitting...';
        if (submissionStatus === 'success') return 'Submitted! 🎉';
        return 'Submit & Claim Discount';
    };

    const isFormDisabled = submissionStatus !== 'idle';

    return (
        <div className="userrating-modalBackdrop" onClick={onClose}>
            <div className="userrating-modalContent" onClick={(e) => e.stopPropagation()}>
                {submissionStatus !== 'submitting' && (
                    <button className="userrating-modalCloseBtn" onClick={onClose}>&times;</button>
                )}
                
                <h3 className="userrating-modalTitle">Share Your Experience</h3>
                <p className="userrating-modalSubtitle">Tell us about your ride and get a discount on your next trip!</p>

                <form onSubmit={handleFormSubmit} className="userrating-modalForm">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="userrating-modalInput"
                        required
                        disabled={isFormDisabled} 
                    />
                    
                    <select
                        name="month"
                        value={formData.month}
                        onChange={handleChange}
                        className="userrating-modalInput"
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
                        className="userrating-modalInput userrating-modalTextarea"
                        rows="4"
                        maxLength="500"
                        required
                        disabled={isFormDisabled}
                    ></textarea>
                    
                    <button 
                        type="submit" 
                        className={`userrating-reviewBtn userrating-modalSubmitBtn ${submissionStatus === 'success' ? 'userrating-success' : ''}`}
                        disabled={isFormDisabled}
                    >
                        {getButtonText()}
                    </button>
                </form>
            </div>
        </div>
    );
};
