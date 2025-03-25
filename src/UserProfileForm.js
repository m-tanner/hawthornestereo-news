import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import { Tooltip } from 'react-tooltip';

const UserProfileForm = () => {
    const {id} = useParams();
    const [formData, setFormData] = useState({
        preferred_name: '',
        email_address: '',
        favorite_keywords: [],
        favorites_only: false,
        desired_conditions: [],
        unsubscribed: false,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [actionResponse, setActionResponse] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const response = await fetch(`/api/user/${id}`);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Login token not found');
                }
                throw new Error('Failed to fetch user data');
            }
            const data = await response.json();
            setFormData(data);
            setLoading(false);
        };

        fetchUserData().catch((error) => {
            setError(error.message);
            setLoading(false);
        });
    }, [id]);

    const handleChange = (e) => {
        const {name, value, type, checked, options} = e.target;
        if (type === 'checkbox') {
            setFormData((prevData) => ({
                ...prevData,
                [name]: checked,
            }));
        } else if (options && e.target.multiple) {
            // For a multi-select dropdown, get all the selected options into an array
            const selectedValues = Array.from(options)
                .filter((option) => option.selected)
                .map((option) => option.value);
            setFormData((prevData) => ({
                ...prevData,
                [name]: selectedValues,
            }));
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleKeywordChange = (e, index) => {
        const newKeywords = [...formData.favorite_keywords];
        newKeywords[index] = e.target.value;
        setFormData((prevData) => ({
            ...prevData,
            favorite_keywords: newKeywords,
        }));
    };

    const addKeyword = () => {
        setFormData((prevData) => ({
            ...prevData,
            favorite_keywords: [...prevData.favorite_keywords, ''],
        }));
    };

    const removeKeyword = (index) => {
        setFormData((prevData) => ({
            ...prevData,
            favorite_keywords: prevData.favorite_keywords.filter((_, i) => i !== index),
        }));
    };


    const submitUserData = async (id, formData) => {
        const response = await fetch(`/api/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: id,
                user: {
                    ...formData,
                    favorite_keywords: formData.favorite_keywords.map((keyword) => keyword.trim()).filter((keyword) => keyword !== ''),
                }
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to submit data');
        }

        return response.json();
    };

    const handleFormSubmission = async () => {
        try {
            const data = await submitUserData(id, formData);
            console.log('Form Data Submitted:', data);
            setSubmitted(true)
        } catch (error) {
            setError(error.message)
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleFormSubmission().catch((error) => {
            setError(error.message);
        });
    };

    const triggerNotificationsApi = async (id) => {
        if (id === '') {
            throw new Error('id cannot be empty when triggering notifications');
        }
        console.log(id)

        const response = await fetch(`/api/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: id
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to trigger notifications');
        }

        return result;
    };

    const handleTriggerNotifications = async () => {
        try {
            const result = await triggerNotificationsApi(id);
            setActionResponse({success: true, message: result.message});
        } catch (error) {
            setActionResponse({success: false, message: error.message});
        }
    };

    const triggerNotifications = () => {
        handleTriggerNotifications().catch((error) => {
            setActionResponse({success: false, message: error.message});
        });
    };

    if (loading) {
        return (
            <div className={"user-profile-form-container"}>
                <p>Loading...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={"user-profile-form-container"}>
                <p>
                    Your profile has been updated!
                    Log in again to make more changes.
                </p>
                <p>
                    <a href="https://hawthornestereo.news">Return to Login</a>
                </p>
            </div>
        );
    }

    if (error === 'Login token not found') {
        return (
            <div className={"user-profile-form-container"}>
                <p>This login token is used or expired. Please log in again.</p>
                <p>
                    <a href="https://hawthornestereo.news">Return to Login</a>
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={"user-profile-form-container"}>
                <p>Unexpected Error: {error}</p>
            </div>
        );
    }

    return (
        <div className={"user-profile-form-container"}>
            <h2>Hawthorne Stereo Wish List</h2>
            <h3>Edit your preferences</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="preferred_name">Your Name:</label>
                    <input
                        type="text"
                        id="preferred_name"
                        name="preferred_name"
                        value={formData.preferred_name}
                        onChange={handleChange}
                        data-tooltip-id="tooltip"
                        data-tooltip-content="Enter your preferred name. This will how we will address you in communications."
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email_address">Email Address:</label>
                    <input
                        type="email"
                        id="email_address"
                        name="email_address"
                        value={formData.email_address}
                        onChange={handleChange}
                        data-tooltip-id="tooltip"
                        data-tooltip-content="Provide your valid email address for account notifications."
                        required
                        readOnly={true}
                    />
                </div>
                <div className="form-group">
                    <label>Your Wish List:</label>
                    {formData.favorite_keywords.map((keyword, index) => (
                        <div
                            key={index}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                marginBottom: '8px',
                            }}
                        >
                            <input
                                type="text"
                                value={keyword}
                                placeholder="e.g. Luxman, SX-850, chrome bumper, equalizer"
                                onChange={(e) => handleKeywordChange(e, index)}
                                data-tooltip-id="tooltip"
                                data-tooltip-content="Enter a keyword or phrase"
                                style={{
                                    flex: 1,
                                    height: '36px',
                                    padding: '4px 8px',
                                    fontSize: '16px',
                                    lineHeight: '1.5',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => removeKeyword(index)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    marginLeft: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    color: '#000000',
                                    backgroundColor: '#f4f4f4',
                                    border: '1px solid #ccc',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    lineHeight: '1',
                                    boxSizing: 'border-box',
                                }}
                            >
                                ❌
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={addKeyword}
                        style={{
                            color: '#000000',
                            backgroundColor: '#f4f4f4',
                        }}
                    >
                        Add to Wish List
                    </button>
                </div>
                <div className="form-group">
                    <label htmlFor="desired_conditions">Select Desired Product Conditions:</label>
                    <select
                        id="desired_conditions"
                        name="desired_conditions"
                        multiple
                        value={formData.desired_conditions}
                        onChange={handleChange}
                        style={{
                            width: '100%',
                            height: '90px',
                            padding: '4px 8px',
                            fontSize: '16px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            marginBottom: '8px',
                            backgroundColor: '#fff',
                            boxSizing: 'border-box'
                        }}
                    >
                        <option value="new">New</option>
                        <option value="used">Used</option>
                        <option value="open box">Open Box</option>
                        <option value="refurbished">Refurbished</option>
                    </select>
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="favorites_only">Only notify about Wish List entries?</label>
                    <input
                        type="checkbox"
                        id="favorites_only"
                        name="favorites_only"
                        checked={formData.favorites_only}
                        onChange={handleChange}
                        data-tooltip-id="tooltip"
                        data-tooltip-content="Use this checkbox to only receive notifications about products that are match your Wish List keywords."
                    />
                </div>
                <div className="form-group checkbox-group">
                    <label htmlFor="unsubscribed">Unsubscribe?</label>
                    <input
                        type="checkbox"
                        id="unsubscribed"
                        name="unsubscribed"
                        checked={formData.unsubscribed}
                        onChange={handleChange}
                        data-tooltip-id="tooltip"
                        data-tooltip-content="Use this checkbox to opt out of all communications."
                    />
                </div>
                <button type="submit">Save</button>
                <Tooltip id="tooltip" place="top" type="dark" effect="solid" style={{ zIndex: 1000 }}/>
            </form>
            {/* Conditionally render the "Trigger Notifications" button */}
            {(typeof formData.email_address === 'string' &&
                    (formData.email_address.endsWith('@hawthornestereo.com') ||
                        formData.email_address.endsWith('@tanner-wei.com')))
                && (
                    <button className="trigger-button" onClick={triggerNotifications}>
                        <img src="/rocket.png" alt="Rocket Icon"/>
                        Trigger Notifications
                    </button>
                )}
            {actionResponse && (
                <p>
                    {actionResponse.success ? (
                        <span>Success: {actionResponse.message}</span>
                    ) : (
                        <span>Error: {actionResponse.message}</span>
                    )}
                </p>
            )}
            {error && <p>Error: {error}</p>}
        </div>
    );
};

export default UserProfileForm;
