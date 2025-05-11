import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Blog from './pages/Blog';
import About from './pages/About';
import Curtain from './components/Curtain';

function AppContent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isCurtainVisible, setCurtainVisible] = useState(false);
    const [nextPath, setNextPath] = useState<string | null>(null);
    const [animationDirection, setAnimationDirection] = useState<'up' | 'down'>('down');
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const pageOrder = ["/", "/blog", "/about"];

    const handleNavClick = (path: string) => {
        if (path !== location.pathname) {
            const currentIndex = pageOrder.indexOf(location.pathname);
            const nextIndex = pageOrder.indexOf(path);

            setAnimationDirection(nextIndex > currentIndex ? 'down' : 'up');
            setCurtainVisible(true);
            setNextPath(path);
        }
    };

    const handleNavigate = () => {
        if (nextPath) {
            navigate(nextPath);
            setNextPath(null);
        }
    };

    const handleFinish = () => {
        setCurtainVisible(false);
        setIsFirstLoad(false);
    };

    return (
        <>
            <Curtain 
                isVisible={isCurtainVisible} 
                isFirstLoad={isFirstLoad} 
                animationDirection={animationDirection} 
                onNavigate={handleNavigate} 
                onFinish={handleFinish} 
            />
            <Navbar onNavClick={handleNavClick} />
            <div id="page_container">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </div>
        </>
    );
}

export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}