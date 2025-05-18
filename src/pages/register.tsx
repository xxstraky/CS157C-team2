import { useRouter } from 'next/router';
import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

// Register page
function Register() {
    // Router to handle page navigation
    const router = useRouter();

    // useStates for user credentials and output messages
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    // Handle user clicks Register
    const handleRegister = async () => {
        try {
            const response = await axios.post('http://localhost:3000/register', {
                username,
                password,
                displayName,
                email
            }, {
                withCredentials: true // credentials for session
            });

            setMessage(response.data.message);
            if (response.data.success) {
                // Display success message
                setIsSuccess(true);
                // Redirect user to login page after 1 second
                setTimeout(() => {
                    router.push('/login');
                }, 1000);
            }
        }
        catch (error) {
            // if register failed
            setMessage('Registration failed');
            setIsSuccess(false);
            console.error(error);
        }
    }


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
            <h2>NEW PLAYER</h2>
            
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
                    type="text"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
            </div>
            
            <div className="input-group">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                onClick={handleRegister}
                style={{ borderColor: 'var(--tetris-s)' }}
            >
                CREATE ACCOUNT
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

export default Register