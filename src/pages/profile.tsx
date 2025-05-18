import { useRouter } from 'next/router';
import { useEffect, useState} from 'react';
import axios from 'axios';

// Profile page
function Profile() {
    // Router to handle page navigation
    const router = useRouter();

    // useStates for user profile information and output messages
    const [message, setMessage] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSuccess, setIsSuccess] = useState(true);
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [wins, setWins] = useState(0);
    const [gamesPlayed, setGamesPlayed] = useState(0);
    const [kills, setKills] = useState(0);
    const [highestKills, setHighestKills] = useState(0);
    const [avgWPM, setAvgWPM] = useState(0);
    const [highestWPM, setHighestWPM] = useState(0);
    const [winPercentage, setWinPercentage] = useState('');

    // Upon loading profile, check if user is logged in
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('http://localhost:3000/profile', { withCredentials: true});
                setMessage(response.data.message);
                if (response.data.success) {
                    // User is logged in
                    setIsLoggedIn(true);
                    // Now fetch user profile details
                    fetchUserProfile();
                }
                else {
                    // Not logged in, so redirect to home
                    setIsLoggedIn(false);
                    setIsSuccess(false);
                    setMessage(response.data.message + ' Redirecting to home page...');
                    setTimeout(() => {
                        router.push('/');
                    }, 1000);
                }
            }
            catch (error) {
                setIsLoggedIn(false);
                setIsSuccess(false);
                setMessage('Error checking session');
            }
        };

        fetchProfile();
        fetchUserStats();
    }, [router]);

    // Fetch user profile details
    const fetchUserProfile = async () => {
        try {
            const response = await axios.get('http://localhost:3000/userprofile', { withCredentials: true });
            if (response.data.success) {
                // Successfully fetched user information, so set fields on display
                setUsername(response.data.username);
                setDisplayName(response.data.displayName);
                setEmail(response.data.email);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    // Fetch user stats
    const fetchUserStats = async () => {
        try {
            const response = await axios.get('http://localhost:3000/userstats', { withCredentials: true });
            console.log(response.data);
            if (response.data.success) {
                // Successfully fetched user information, so set staistics on display
                setWins(response.data.wins);
                setGamesPlayed(response.data.totalGamesPlayed);
                setAvgWPM(response.data.averageWpm);
                setHighestWPM(response.data.highestWpm);
                setWinPercentage(`${response.data.winPercentage}%`);
                setKills(response.data.totalKills || 0);
                setHighestKills(response.data.highestKills || 0);
            }
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    // User logs out
    const handleLogout = async () => {
        try {
            const response = await axios.post('http://localhost:3000/logout', null, { withCredentials: true});
            setMessage(response.data.message);

            // Redirect to home page
            if (response.data.success) {
                router.push('/');
            }
        }
        catch (error) {
            setMessage('Failed to log out');
        }
    };

    // Navigate to edit profile page
    const handleEditProfile = () => {
        router.push('/edit-profile');
    };

    // Tetris piece icons
    const TetrisPiece = ({ type }) => {
        const style = {
            display: 'inline-block',
            width: '20px',
            height: '20px',
            backgroundColor: `var(--tetris-${type})`,
            marginRight: '5px',
            verticalAlign: 'middle'
        };
        
        return <span style={style}></span>;
    };


    return (
        <div className="profile-container">
            <button 
                onClick={handleLogout} 
                className="logout-button"
            >
                EXIT GAME
            </button>

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

            <h1>PLAYER PROFILE</h1>
            
            <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
                <h2>{message}</h2>
            </div>

            {isLoggedIn && (
                <div className="profile-content">
                    <div className="user-info" style={{ 
                        marginTop: '30px',
                        padding: '15px',
                        border: '2px solid var(--tetris-t)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2>PLAYER INFO</h2>
                        <div style={{ textAlign: 'left', marginTop: '20px' }}>
                            <p><TetrisPiece type="t" /> Display Name: {displayName}</p>
                            <p><TetrisPiece type="i" /> Username: {username}</p>
                            <p><TetrisPiece type="j" /> Email: {email}</p>
                        </div>
                        <button 
                            onClick={handleEditProfile}
                            className="button"
                            style={{ 
                                borderColor: 'var(--tetris-t)',
                                width: '150px',
                                fontSize: '0.8em',
                                marginTop: '15px'
                            }}
                        >
                            EDIT PROFILE
                        </button>
                    </div>

                    <div className="stats-container" style={{ 
                        marginTop: '30px',
                        padding: '15px',
                        border: '2px solid var(--tetris-i)',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }}>
                        <h2>GAME STATS</h2>
                        <div style={{ textAlign: 'left', marginTop: '20px' }}>
                            <p><TetrisPiece type="i" /> Wins: {wins}</p>
                            <p><TetrisPiece type="j" /> Win Percentage: {winPercentage}</p>
                            <p><TetrisPiece type="l" /> Games Played: {gamesPlayed}</p>
                            <p><TetrisPiece type="o" /> Kills: {kills}</p>
                            <p><TetrisPiece type="s" /> Highest Kill Game: {highestKills}</p>
                            <p><TetrisPiece type="t" /> Average WPM: {avgWPM}</p>
                            <p><TetrisPiece type="z" /> Highest WPM: {highestWPM}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <p>READY TO PLAY?</p>
                        <button 
                            onClick={() => { router.push('/game') }}
                            className="button"
                            style={{ 
                                borderColor: 'var(--tetris-l)',
                                width: '200px',
                                fontSize: '1em'
                            }}
                        >
                            PLAY GAME
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile