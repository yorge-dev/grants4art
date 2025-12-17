'use client';

import { useState, useRef, useCallback } from 'react';
import { formatTagName } from '@/lib/tag-utils';

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface HeroSearchProps {
  onSearch: (searchTerm: string) => void;
}

export function HeroSearch({ onSearch }: HeroSearchProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [displayText, setDisplayText] = useState('I am a ');
  const [inputValue, setInputValue] = useState('I am a ');
  const [currentTagIndex, setCurrentTagIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true); // true = typing, false = deleting
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tagsFetchedRef = useRef(false);
  const animationStartedRef = useRef(false);

  // Fetch tags using ref callback pattern to avoid calling during render
  const containerRef = useRef<HTMLDivElement>(null);
  const fetchTagsRef = useRef(false);
  
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && !fetchTagsRef.current) {
      fetchTagsRef.current = true;
      // Fetch tags when container is mounted
      fetch('/api/tags')
        .then(response => response.json())
        .then(data => {
          if (data.tags && data.tags.length > 0) {
            setTags(data.tags);
          }
        })
        .catch(error => {
          console.error('Error fetching tags:', error);
        });
    }
  }, []);

  // Animation step function - uses refs to avoid stale closures
  const runAnimationStep = useCallback(() => {
    // Use a function that reads current state
    const step = () => {
      const prefix = 'I am a ';
      const currentInput = inputValue;
      const userInput = currentInput.substring(prefix.length);
      
      if (!isAnimating || tags.length === 0 || userInput.length > 0) {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
          animationRef.current = null;
        }
        return;
      }

      const currentTag = tags[currentTagIndex];
      if (!currentTag) return;

      const baseText = 'I am a ';
      const fullTagText = formatTagName(currentTag.name);

      if (isTyping) {
        // Typing: add characters left to right
        if (currentCharIndex < fullTagText.length) {
          animationRef.current = setTimeout(() => {
            setDisplayText(baseText + fullTagText.substring(0, currentCharIndex + 1));
            setCurrentCharIndex(prev => {
              const next = prev + 1;
              // Schedule next step after state update
              setTimeout(() => runAnimationStep(), 0);
              return next;
            });
          }, 100); // 100ms per character
        } else {
          // Finished typing, wait a bit then start deleting
          animationRef.current = setTimeout(() => {
            setIsTyping(false);
            setTimeout(() => runAnimationStep(), 0);
          }, 2000); // Wait 2 seconds before deleting
        }
      } else {
        // Deleting: remove characters right to left
        if (currentCharIndex > 0) {
          animationRef.current = setTimeout(() => {
            setDisplayText(baseText + fullTagText.substring(0, currentCharIndex - 1));
            setCurrentCharIndex(prev => {
              const next = prev - 1;
              // Schedule next step after state update
              setTimeout(() => runAnimationStep(), 0);
              return next;
            });
          }, 50); // 50ms per character (faster deletion)
        } else {
          // Finished deleting, move to next tag
          setIsTyping(true);
          setCurrentTagIndex(prev => (prev + 1) % tags.length);
          setCurrentCharIndex(0);
          setDisplayText(baseText);
          setTimeout(() => runAnimationStep(), 0);
        }
      }
    };
    step();
  }, [isAnimating, tags, currentTagIndex, currentCharIndex, isTyping, inputValue]);

  // Start animation when tags are loaded and conditions are met
  if (isAnimating && tags.length > 0 && inputValue === 'I am a ' && !animationRef.current && !animationStartedRef.current) {
    animationStartedRef.current = true;
    // Use setTimeout to avoid calling during render
    setTimeout(() => {
      runAnimationStep();
    }, 0);
  }
  if (!isAnimating) {
    animationStartedRef.current = false;
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Ensure "I am a " prefix is always present
    const prefix = 'I am a ';
    if (!value.startsWith(prefix)) {
      // If user tries to delete the prefix, restore it
      if (value.length < prefix.length) {
        value = prefix;
      } else {
        // If user pastes or types something that doesn't start with prefix, add it
        value = prefix + value.replace(prefix, '');
      }
    }
    
    const userInput = value.substring(prefix.length);
    setInputValue(value);
    
    // Stop animation when user starts typing
    if (userInput.length > 0 && isAnimating) {
      setIsAnimating(false);
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    } else if (userInput.length === 0) {
      // Restart animation when input is cleared (only prefix remains)
      setIsAnimating(true);
      setCurrentCharIndex(0);
      setIsTyping(true);
      setCurrentTagIndex(0);
      setDisplayText(prefix);
      animationStartedRef.current = false;
      // Start animation after state updates
      setTimeout(() => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        runAnimationStep();
      }, 0);
    }

    // Debounce search - search by the user input part (after prefix)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      onSearch(userInput);
      searchTimeoutRef.current = null;
    }, 300);
  };

  // Handle input focus
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const prefix = 'I am a ';
    const userInput = inputValue.substring(prefix.length);
    if (userInput.length === 0 && isAnimating) {
      setIsAnimating(false);
    }
    // Position cursor after prefix if input only contains prefix
    if (inputValue === prefix) {
      setTimeout(() => {
        e.target.setSelectionRange(prefix.length, prefix.length);
      }, 0);
    }
  };

  // Handle input blur - restart animation if empty
  const handleBlur = () => {
    const prefix = 'I am a ';
    const userInput = inputValue.substring(prefix.length);
    if (userInput.length === 0) {
      setIsAnimating(true);
      setCurrentCharIndex(0);
      setIsTyping(true);
      setCurrentTagIndex(0);
      setDisplayText(prefix);
      animationStartedRef.current = false;
      // Start animation after state updates
      setTimeout(() => {
        if (animationRef.current) {
          clearTimeout(animationRef.current);
        }
        runAnimationStep();
      }, 0);
    }
  };

  // Handle keydown to prevent deleting the prefix
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const prefix = 'I am a ';
    const selectionStart = (e.target as HTMLInputElement).selectionStart || 0;
    
    // Prevent backspace/delete if cursor is at or before the prefix
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectionStart <= prefix.length) {
      e.preventDefault();
      // Move cursor to end of prefix
      setTimeout(() => {
        const input = e.target as HTMLInputElement;
        input.setSelectionRange(prefix.length, prefix.length);
      }, 0);
    }
  };



  // Calculate size - about 1.33x larger than filter search bar
  // Filter search: fontSize: '12px', padding: '6px 10px'
  // Hero: fontSize: '16px', padding: '8px 13px'
  const inputStyle: React.CSSProperties = {
    width: '100%',
    fontSize: '16px',
    padding: '8px 13px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--foreground)',
    fontFamily: 'var(--font-exo), sans-serif',
    fontWeight: 'bold',
    textAlign: 'center',
  };

  return (
    <div 
      ref={containerRefCallback}
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: '32px',
        width: '100%'
      }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        background: 'transparent',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 13px',
        textAlign: 'center',
      }}>
        <div style={{ position: 'relative', width: '100%' }}>
          {isAnimating && inputValue === 'I am a ' && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                fontSize: '16px',
                opacity: 0.7,
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-exo), sans-serif',
                zIndex: 1,
              }}
            >
              <span style={{ color: 'var(--foreground)', fontWeight: 'normal' }}>I am a </span>
              {displayText.substring('I am a '.length) && (
                <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  {displayText.substring('I am a '.length)}
                </span>
              )}
              <span className="hero-cursor" style={{ 
                display: 'inline-block',
                width: '2px',
                height: '16px',
                background: displayText.substring('I am a '.length) ? 'var(--accent)' : 'var(--foreground)',
                marginLeft: '2px',
                verticalAlign: 'middle',
              }} />
            </div>
          )}
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder=""
            style={{
              ...inputStyle,
              position: 'relative',
              zIndex: 2,
              color: isAnimating && inputValue === 'I am a ' ? 'transparent' : 'var(--foreground)',
            }}
            autoComplete="off"
            autoFocus={false}
            tabIndex={0}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes hero-blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
          .hero-cursor {
            animation: hero-blink 1s infinite;
          }
        `
      }} />
    </div>
  );
}

