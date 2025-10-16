import { useState, useEffect, useRef } from 'react';

export const useTypingAnimation = (text: string, speed: number = 20, skipAnimation: boolean = false) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      hasAnimatedRef.current = false;
      return;
    }

    // Skip animation if content was cached or skipAnimation is true
    if (skipAnimation || hasAnimatedRef.current) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        hasAnimatedRef.current = true;
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, skipAnimation]);

  return { displayedText, isComplete };
};
