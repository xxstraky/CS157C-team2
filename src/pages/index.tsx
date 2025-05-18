import Head from "next/head";
import { Inter } from "next/font/google";
import Link from 'next/link';
import { useEffect } from 'react';

const inter = Inter({ subsets: ["latin"] });

// Home page
export default function Home() {
    // Function to create falling Tetris pieces animation
    useEffect(() => {
        const createTetrisPiece = () => {
            const piecesContainer = document.querySelector('.tetris-bg-animation');
            if (!piecesContainer) return;
            
            const pieces = ['i', 'j', 'l', 'o', 's', 't', 'z'];
            const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
            
            const piece = document.createElement('div');
            piece.classList.add('tetris-piece');
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.animationDuration = `${Math.random() * 20 + 10}s`;
            piece.style.backgroundColor = `var(--tetris-${randomPiece})`;
            
            // Random rotation and size
            piece.style.transform = `rotate(${Math.random() * 360}deg)`;
            const size = Math.random() * 30 + 20;
            piece.style.width = `${size}px`;
            piece.style.height = `${size}px`;
            
            piecesContainer.appendChild(piece);
            
            // Remove piece after animation completes
            setTimeout(() => {
                if (piece.parentNode === piecesContainer) {
                    piecesContainer.removeChild(piece);
                }
            }, parseInt(piece.style.animationDuration) * 1000);
        };
        
        // Create container for animation
        const container = document.createElement('div');
        container.classList.add('tetris-bg-animation');
        document.body.appendChild(container);
        
        // Create pieces at intervals
        const interval = setInterval(createTetrisPiece, 2000);
        
        // Initial pieces
        for (let i = 0; i < 10; i++) {
            createTetrisPiece();
        }
        
        return () => {
            clearInterval(interval);
            if (container.parentNode === document.body) {
                document.body.removeChild(container);
            }
        };
    }, []);

    return (
        <>
            <Head>
                <title>Type99</title>
                <meta name="description" content="Type99 Tetris Edition." />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <main className={`${inter.className} home-container`}>
                <div className="tetris-container">
                    <div className="game-title">
                        <h1 style={{ color: 'var(--tetris-i)', fontSize: '2.5rem', marginBottom: '30px' }}>WELCOME TO</h1>
                        <div className="type99-logo">
                            <div className="type-text">
                                <span style={{ color: 'var(--tetris-t)' }}>T</span>
                                <span style={{ color: 'var(--tetris-j)' }}>Y</span>
                                <span style={{ color: 'var(--tetris-s)' }}>P</span>
                                <span style={{ color: 'var(--tetris-i)' }}>E</span>
                            </div>
                            <div className="num-text">
                                <span style={{ color: 'var(--tetris-z)' }}>9</span>
                                <span style={{ color: 'var(--tetris-o)' }}>9</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="home-buttons">
                        <Link href="/login">
                            <button className="home-button login-button">LOGIN</button>
                        </Link>
                        <Link href="/register">
                            <button className="home-button register-button">REGISTER</button>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}