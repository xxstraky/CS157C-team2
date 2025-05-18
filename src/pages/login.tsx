import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

// Login page
function Login() {
    // Router to handle page navigation
    const router = useRouter();

    // useStates to handle user credentials and output messages
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Handles user logs in
    const handleLogin = async () => {
        try {
            const response = await axios.post('http://localhost:3000/login', {
                username,
                password
            }, { 
                withCredentials: true  // credentials for session
            });

            setMessage(response.data.message);
            // If successful, send user to profile page
            if (response.data.success) {
                setIsSuccess(true);
                // Wait 1 second before redirecting user
                setTimeout(() => {
                    router.push('/profile');
                }, 1000);
            }

        } catch (error) {
            // if login failed
            setMessage('Login failed');
            setIsSuccess(false);
            console.error(error);
        }
    };

    return (
        <div className="auth-container">
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
            <h2>PLAYER LOGIN</h2>
            
            <div className="input-group">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            
            <div className="input-group">
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            
            <button 
                className="button" 
                onClick={handleLogin}
                style={{ borderColor: 'var(--tetris-i)' }}
            >
                LOGIN
            </button>
            
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
                {message}
            </div>
            
            <div style={{ marginTop: '20px' }}>
                <Link href="/">
                    <span style={{ 
                        color: 'var(--tetris-o)', 
                        cursor: 'pointer',
                        fontSize: '0.7em',
                        textDecoration: 'underline'
                    }}>
                        BACK TO MAIN MENU
                    </span>
                </Link>
            </div>
        </div>
    );
}

export default Login
