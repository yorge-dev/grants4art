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
  const fetchTagsRef = useRef(false);
  const animationStartedRef = useRef(false);
  const isAnimatingRef = useRef(isAnimating);
  const tagsRef = useRef(tags);
  const currentTagIndexRef = useRef(currentTagIndex);
  const currentCharIndexRef = useRef(currentCharIndex);
  const isTypingRef = useRef(isTyping);
  const inputValueRef = useRef(inputValue);
  const displayTextRef = useRef(displayText);
  const pendingStartRef = useRef(false);

  // Keep refs in sync with state
  isAnimatingRef.current = isAnimating;
  tagsRef.current = tags;
  currentTagIndexRef.current = currentTagIndex;
  currentCharIndexRef.current = currentCharIndex;
  isTypingRef.current = isTyping;
  inputValueRef.current = inputValue;
  displayTextRef.current = displayText;

  // Animation step function using refs to avoid stale closures
  const runAnimationStep = useCallback(() => {
    const prefix = 'I am a ';
    const currentInput = inputValueRef.current;
    const userInput = currentInput.substring(prefix.length);
    
    // Stop animation if conditions aren't met
    if (!isAnimatingRef.current || tagsRef.current.length === 0 || userInput.length > 0) {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      animationStartedRef.current = false;
      return;
    }

    const currentTag = tagsRef.current[currentTagIndexRef.current];
    if (!currentTag) {
      // If no tag at current index, reset to first tag
      if (tagsRef.current.length > 0) {
        currentTagIndexRef.current = 0;
        setCurrentTagIndex(0);
        currentCharIndexRef.current = 0;
        setCurrentCharIndex(0);
        setIsTyping(true);
        isTypingRef.current = true;
        setDisplayText(prefix);
        displayTextRef.current = prefix;
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 100);
      } else {
        animationStartedRef.current = false;
      }
      return;
    }

    const baseText = 'I am a ';
    const fullTagText = formatTagName(currentTag.name);

    if (isTypingRef.current) {
      // Typing: add characters left to right
      if (currentCharIndexRef.current < fullTagText.length) {
        const nextCharIndex = currentCharIndexRef.current + 1;
        const newDisplayText = baseText + fullTagText.substring(0, nextCharIndex);
        setDisplayText(newDisplayText);
        displayTextRef.current = newDisplayText;
        setCurrentCharIndex(nextCharIndex);
        currentCharIndexRef.current = nextCharIndex;
        
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 100); // 100ms per character
      } else {
        // Finished typing, wait a bit then start deleting
        animationRef.current = setTimeout(() => {
          setIsTyping(false);
          isTypingRef.current = false;
          runAnimationStep();
        }, 2000); // Wait 2 seconds before deleting
      }
    } else {
      // Deleting: remove characters right to left
      if (currentCharIndexRef.current > 0) {
        const nextCharIndex = currentCharIndexRef.current - 1;
        const newDisplayText = baseText + fullTagText.substring(0, nextCharIndex);
        setDisplayText(newDisplayText);
        displayTextRef.current = newDisplayText;
        setCurrentCharIndex(nextCharIndex);
        currentCharIndexRef.current = nextCharIndex;
        
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 50); // 50ms per character (faster deletion)
      } else {
        // Finished deleting, move to next tag
        const nextTagIndex = (currentTagIndexRef.current + 1) % tagsRef.current.length;
        setIsTyping(true);
        isTypingRef.current = true;
        setCurrentTagIndex(nextTagIndex);
        currentTagIndexRef.current = nextTagIndex;
        setCurrentCharIndex(0);
        currentCharIndexRef.current = 0;
        setDisplayText(baseText);
        displayTextRef.current = baseText;
        
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 300); // Small delay before starting next tag
      }
    }
  }, []);

  // Start animation function
  const startAnimation = useCallback(() => {
    // Clear any existing animation
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    
    // Check conditions
    if (!isAnimatingRef.current || 
        tagsRef.current.length === 0 || 
        inputValueRef.current !== 'I am a ') {
      animationStartedRef.current = false;
      return;
    }
    
    // Only start if not already started
    if (animationStartedRef.current) {
      return;
    }
    
    // Initialize animation state
    animationStartedRef.current = true;
    setCurrentTagIndex(0);
    currentTagIndexRef.current = 0;
    setCurrentCharIndex(0);
    currentCharIndexRef.current = 0;
    setIsTyping(true);
    isTypingRef.current = true;
    const initialText = 'I am a ';
    setDisplayText(initialText);
    displayTextRef.current = initialText;
    
    // Start the animation immediately - runAnimationStep uses refs so it will work
    // Use setTimeout to avoid calling during render
    setTimeout(() => {
      runAnimationStep();
    }, 0);
  }, [runAnimationStep]);

  // Store startAnimation in a ref so it can be accessed in containerRefCallback
  const startAnimationRef = useRef(startAnimation);
  startAnimationRef.current = startAnimation;

  // Fetch tags using ref callback pattern
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && !fetchTagsRef.current) {
      fetchTagsRef.current = true;
      fetch('/api/tags')
        .then(response => response.json())
        .then(data => {
          if (data.tags && data.tags.length > 0) {
            setTags(data.tags);
            tagsRef.current = data.tags;
            // Reset animation state when tags load
            animationStartedRef.current = false;
            pendingStartRef.current = false;
            // Start animation when tags are loaded
            setTimeout(() => {
              if (isAnimatingRef.current && inputValueRef.current === 'I am a ') {
                startAnimationRef.current();
              }
            }, 200); // Small delay to ensure state is updated
          }
        })
        .catch(error => {
          console.error('Error fetching tags:', error);
        });
    }
  }, []);

  // Check if we should start animation when state changes
  // This handles cases where tags are loaded but animation hasn't started
  if (isAnimating && tags.length > 0 && inputValue === 'I am a ' && !animationStartedRef.current && !animationRef.current && !pendingStartRef.current) {
    pendingStartRef.current = true;
    setTimeout(() => {
      pendingStartRef.current = false;
      startAnimation();
    }, 0);
  }
  
  if (!isAnimating) {
    animationStartedRef.current = false;
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
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
    inputValueRef.current = value;
    
    // Stop animation when user starts typing
    if (userInput.length > 0 && isAnimating) {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      animationStartedRef.current = false;
    } else if (userInput.length === 0) {
      // Restart animation when input is cleared (only prefix remains)
      setIsAnimating(true);
      isAnimatingRef.current = true;
      setCurrentCharIndex(0);
      currentCharIndexRef.current = 0;
      setIsTyping(true);
      isTypingRef.current = true;
      setCurrentTagIndex(0);
      currentTagIndexRef.current = 0;
      setDisplayText(prefix);
      displayTextRef.current = prefix;
      animationStartedRef.current = false;
      // Start animation after state updates
      setTimeout(() => {
        startAnimation();
      }, 100);
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
    const userInput = inputValueRef.current.substring(prefix.length);
    if (userInput.length === 0 && isAnimatingRef.current) {
      setIsAnimating(false);
      isAnimatingRef.current = false;
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
      animationStartedRef.current = false;
    }
    // Position cursor after prefix if input only contains prefix
    if (inputValueRef.current === prefix) {
      setTimeout(() => {
        e.target.setSelectionRange(prefix.length, prefix.length);
      }, 0);
    }
  };

  // Handle input blur - restart animation if empty
  const handleBlur = () => {
    const prefix = 'I am a ';
    const userInput = inputValueRef.current.substring(prefix.length);
    if (userInput.length === 0) {
      setIsAnimating(true);
      isAnimatingRef.current = true;
        setCurrentCharIndex(0);
        currentCharIndexRef.current = 0;
        setIsTyping(true);
        isTypingRef.current = true;
        setCurrentTagIndex(0);
        currentTagIndexRef.current = 0;
        setDisplayText(prefix);
        displayTextRef.current = prefix;
        animationStartedRef.current = false;
        // Start animation after state updates
        setTimeout(() => {
          startAnimation();
        }, 100);
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
              <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                {displayText.substring('I am a '.length)}
              </span>
              <span className="hero-cursor" style={{ 
                display: 'inline-block',
                width: '2px',
                height: '16px',
                background: displayText.substring('I am a '.length).length > 0 ? 'var(--accent)' : 'var(--foreground)',
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

