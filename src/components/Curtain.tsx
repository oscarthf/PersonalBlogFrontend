import { useEffect, useState } from 'react';
import '../curtain.css';

export default function Curtain({ 
    isVisible, 
    onNavigate, 
    onFinish, 
    isFirstLoad 
}: { 
    isVisible: boolean; 
    onNavigate: () => void; 
    onFinish: () => void; 
    isFirstLoad: boolean; 
}) {
    const [animationClass, setAnimationClass] = useState('');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isFirstLoad) {
            setVisible(true);
            setAnimationClass('curtain-initial');// Start fully down
            // Small timeout to set up webgl
            setTimeout(() => {
                setAnimationClass('curtain-exit');
            }, 1000);// Wait 1 second
        } else if (isVisible) {
            setVisible(true);
            setAnimationClass('curtain-enter');
        }
    }, [isVisible, isFirstLoad]);

    const handleAnimationEnd = () => {
        if (animationClass === 'curtain-enter') {
            onNavigate();
            setTimeout(() => {
                setAnimationClass('curtain-exit');
            }, 1000);
        } else if (animationClass === 'curtain-exit') {
            setVisible(false);
            setAnimationClass('');
            onFinish();
        }
    };

    if (!visible) return null;

    return (
        <div 
            className={`curtain ${animationClass}`} 
            onAnimationEnd={handleAnimationEnd} 
        />
    );
}
