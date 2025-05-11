import { useEffect, useState } from 'react';
import '../curtain.css';

export default function Curtain({ 
    isVisible, 
    onNavigate, 
    onFinish, 
    isFirstLoad, 
    animationDirection 
}: { 
    isVisible: boolean; 
    onNavigate: () => void; 
    onFinish: () => void; 
    isFirstLoad: boolean; 
    animationDirection: 'up' | 'down'; 
}) {
    const [animationClass, setAnimationClass] = useState('');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isFirstLoad) {
            setVisible(true);
            setAnimationClass('curtain-initial');
            setTimeout(() => {
                setAnimationClass('curtain-exit-down');
            }, 1000);
        } else if (isVisible) {
            setVisible(true);
            setAnimationClass(`curtain-enter-${animationDirection}`);
        }
    }, [isVisible, isFirstLoad, animationDirection]);

    const handleAnimationEnd = () => {
        if (animationClass.startsWith('curtain-enter')) {
            onNavigate();
            setTimeout(() => {
                setAnimationClass(`curtain-exit-${animationDirection}`);
            }, 1000);
        } else if (animationClass.startsWith('curtain-exit')) {
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
