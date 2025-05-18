import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

// Edit Profile page
function EditProfile() {
    // Router to handle page navigation
    const router = useRouter();

    // useStates for user profile information and output messages
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is logged in and fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profileResponse = await axios.get('http://localhost:3000/profile', { withCredentials: true });
                
                if (!profileResponse.data.success) {
                    // Not logged in, redirect to home
                    setMessage('You must be logged in to edit your profile. Redirecting...');
                    setTimeout(() => {
                        router.push('/');
                    }, 1000);
                    return;
                }
                
                // Fetch user profile details
                const userProfileResponse = await axios.get('http://localhost:3000/userprofile', { withCredentials: true });
                
                if (userProfileResponse.data.success) {
                    // Success, so set profile information in display
                    setUsername(userProfileResponse.data.username);
                    setDisplayName(userProfileResponse.data.displayName);
                    setEmail(userProfileResponse.data.email);
                    setIsLoading(false);
                } else {
                    setMessage('Could not fetch profile data. Please try again.');
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                setMessage('Error loading profile data');
                setTimeout(() => {
                    router.push('/profile');
                }, 1000);
            }
        };

        fetchProfile();
    }, [router]);

    // Handle save button click
    const handleSaveProfile = async () => {
        // Validate form
        if (!displayName) {
            setMessage('Display name cannot be empty');
            setIsSuccess(false);
            return;
        }

        // Email doesn't exist
        if (!email) {
            setMessage('Email cannot be empty');
            setIsSuccess(false);
            return;
        }

        // If new password is provided, validate it
        if (newPassword) {
            // User does not provide current password
            if (!currentPassword) {
                setMessage('Current password is required to set a new password');
                setIsSuccess(false);
                return;
            }
            
            // Both new passwords do not match
            if (newPassword !== confirmPassword) {
                setMessage('New passwords do not match');
                setIsSuccess(false);
                return;
            }
        }

        // Update profile information in Redis database using new values
        try {
            const response = await axios.post('http://localhost:3000/updateprofile', {
                displayName,
                email,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined
            }, { withCredentials: true });

            setMessage(response.data.message);
            setIsSuccess(response.data.success);
            
            if (response.data.success) {
                // Redirect back to profile page after successful update
                setTimeout(() => {
                    router.push('/profile');
                }, 1000);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('Failed to update profile');
            setIsSuccess(false);
        }
    };

    // Handle discard button click
    const handleDiscardChanges = () => {
        // Redirect back to profile page
        router.push('/profile');
    };

    // Tetris piece icons for labels
    const TetrisPiece = ({ type }) => {
        const style = {
            display: 'inline-block',
            width: '16px',
            height: '16px',
            backgroundColor: `var(--tetris-${type})`,
            marginRight: '5px',
            verticalAlign: 'middle'
        };
        
        return <span style={style}></span>;
    };

    return (
        <div className="profile-edit-container" style={{
            maxWidth: '500px',
            margin: '0 auto',
            padding: '20px'
        }}>
            <div className="type99-logo" style={{ margin: '0 auto 30px' }}>
                <div className="type-text" style={{ fontSize: '2.5rem' }}>
                    <span style={{ color: 'var(--tetris-t)' }}>T</span>
                    <span style={{ color: 'var(--tetris-j)' }}>Y</span>
                    <span style={{ color: 'var(--tetris-s)' }}>P</span>
                    <span style={{ color: 'var(--tetris-i)' }}>E</span>
                </div>
                <div className="num-text" style={{ fontSize: '2.5rem' }}>
                    <span style={{ color: 'var(--tetris-z)' }}>9</span>
                    <span style={{ color: 'var(--tetris-o)' }}>9</span>
                </div>
            </div>

            <h1>EDIT PROFILE</h1>
            
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
                {message}
            </div>

            {!isLoading && (
                <div className="edit-profile-form" style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    border: '2px solid var(--tetris-t)',
                    padding: '20px',
                    marginTop: '20px'
                }}>
                    <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            <TetrisPiece type="i" /> Username (cannot be changed)
                        </label>
                        <input
                            type="text"
                            value={username}
                            disabled
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'rgba(50, 50, 50, 0.5)',
                                border: '1px solid var(--tetris-i)',
                                color: '#888'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            <TetrisPiece type="t" /> Display Name
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--tetris-t)'
                            }}
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>
                            <TetrisPiece type="j" /> Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid var(--tetris-j)'
                            }}
                        />
                    </div>

                    <div className="password-section" style={{ 
                        marginTop: '30px', 
                        borderTop: '1px solid var(--tetris-o)',
                        paddingTop: '15px'
                    }}>
                        <h3 style={{ 
                            color: 'var(--tetris-o)',
                            marginBottom: '15px'
                        }}>CHANGE PASSWORD</h3>

                        <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <TetrisPiece type="o" /> Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid var(--tetris-o)'
                                }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <TetrisPiece type="s" /> New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid var(--tetris-s)'
                                }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '15px', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>
                                <TetrisPiece type="z" /> Confirm New Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid var(--tetris-z)'
                                }}
                            />
                        </div>
                    </div>

                    <div className="button-group" style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        marginTop: '30px' 
                    }}>
                        <button 
                            onClick={handleDiscardChanges}
                            className="button"
                            style={{ 
                                borderColor: 'var(--tetris-i)',
                                width: '48%',
                                fontSize: '0.9em'
                            }}
                        >
                            DISCARD CHANGES
                        </button>
                        <button 
                            onClick={handleSaveProfile}
                            className="button"
                            style={{ 
                                borderColor: 'var(--tetris-l)',
                                width: '48%',
                                fontSize: '0.9em'
                            }}
                        >
                            SAVE CHANGES
                        </button>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '20px' }}>
                <Link href="/profile">
                    <span style={{ 
                        color: 'var(--tetris-o)', 
                        cursor: 'pointer',
                        fontSize: '0.7em',
                        textDecoration: 'underline'
                    }}>
                        BACK TO PROFILE
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default EditProfile;