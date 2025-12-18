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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tagsLoadedRef = useRef(false);
  
  // Refs to track current values for animation
  const stateRefs = useRef({
    isAnimating: true,
    tags: [] as Tag[],
    currentTagIndex: 0,
    currentCharIndex: 0,
    isTyping: true,
    inputValue: 'I am a ',
    displayText: 'I am a '
  });

  // Keep refs in sync with state
  stateRefs.current.isAnimating = isAnimating;
  stateRefs.current.tags = tags;
  stateRefs.current.currentTagIndex = currentTagIndex;
  stateRefs.current.currentCharIndex = currentCharIndex;
  stateRefs.current.isTyping = isTyping;
  stateRefs.current.inputValue = inputValue;
  stateRefs.current.displayText = displayText;

  // Animation step function using refs to avoid stale closures
  const runAnimationStep = useCallback(() => {
    // Clear any existing timeout first
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }

    const prefix = 'I am a ';
    const state = stateRefs.current;
    const userInput = state.inputValue.substring(prefix.length);
    
    // Stop animation if conditions aren't met
    if (!state.isAnimating || state.tags.length === 0 || userInput.length > 0) {
      return;
    }

    const currentTag = state.tags[state.currentTagIndex];
    if (!currentTag) {
      // If no tag at current index, reset to first tag
      if (state.tags.length > 0) {
        state.currentTagIndex = 0;
        state.currentCharIndex = 0;
        state.isTyping = true;
        state.displayText = prefix;
        setCurrentTagIndex(0);
        setCurrentCharIndex(0);
        setIsTyping(true);
        setDisplayText(prefix);
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 100);
      }
      return;
    }

    const baseText = 'I am a ';
    const fullTagText = formatTagName(currentTag.name);

    if (state.isTyping) {
      // Typing: add characters left to right
      if (state.currentCharIndex < fullTagText.length) {
        const nextCharIndex = state.currentCharIndex + 1;
        const newDisplayText = baseText + fullTagText.substring(0, nextCharIndex);
        
        // Update refs first, then state
        state.currentCharIndex = nextCharIndex;
        state.displayText = newDisplayText;
        
        // Update state
        setDisplayText(newDisplayText);
        setCurrentCharIndex(nextCharIndex);
        
        // Schedule next step
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 100); // 100ms per character
      } else {
        // Finished typing, wait a bit then start deleting
        animationRef.current = setTimeout(() => {
          state.isTyping = false;
          setIsTyping(false);
          runAnimationStep();
        }, 2000); // Wait 2 seconds before deleting
      }
    } else {
      // Deleting: remove characters right to left
      if (state.currentCharIndex > 0) {
        const nextCharIndex = state.currentCharIndex - 1;
        const newDisplayText = baseText + fullTagText.substring(0, nextCharIndex);
        
        // Update refs first, then state
        state.currentCharIndex = nextCharIndex;
        state.displayText = newDisplayText;
        
        // Update state
        setDisplayText(newDisplayText);
        setCurrentCharIndex(nextCharIndex);
        
        // Schedule next step
        animationRef.current = setTimeout(() => {
          runAnimationStep();
        }, 50); // 50ms per character (faster deletion)
      } else {
        // Finished deleting, move to next tag
        const nextTagIndex = (state.currentTagIndex + 1) % state.tags.length;
        
        // Update refs first
        state.currentTagIndex = nextTagIndex;
        state.currentCharIndex = 0;
        state.isTyping = true;
        state.displayText = baseText;
        
        // Update state
        setIsTyping(true);
        setCurrentTagIndex(nextTagIndex);
        setCurrentCharIndex(0);
        setDisplayText(baseText);
        
        // Schedule next step
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
    
    const state = stateRefs.current;
    
    // Check conditions
    if (!state.isAnimating || state.tags.length === 0 || state.inputValue !== 'I am a ') {
      return;
    }
    
    // Initialize animation state
    const initialText = 'I am a ';
    state.currentTagIndex = 0;
    state.currentCharIndex = 0;
    state.isTyping = true;
    state.displayText = initialText;
    
    // Update state
    setCurrentTagIndex(0);
    setCurrentCharIndex(0);
    setIsTyping(true);
    setDisplayText(initialText);
    
    // Start the animation
    setTimeout(() => {
      runAnimationStep();
    }, 100);
  }, [runAnimationStep]);

  // Fetch tags using ref callback pattern
  const containerRefCallback = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node && !tagsLoadedRef.current) {
      tagsLoadedRef.current = true;
      fetch('/api/tags')
        .then(response => response.json())
        .then(data => {
          if (data.tags && data.tags.length > 0) {
            setTags(data.tags);
            stateRefs.current.tags = data.tags;
            // Start animation when tags are loaded
            setTimeout(() => {
              startAnimation();
            }, 200);
          }
        })
        .catch(error => {
          console.error('Error fetching tags:', error);
        });
    }
  }, [startAnimation]);

  // Start animation when conditions are met
  if (isAnimating && tags.length > 0 && inputValue === 'I am a ' && !animationRef.current) {
    setTimeout(() => {
      startAnimation();
    }, 0);
  }
  
  // Stop animation if needed
  if (!isAnimating && animationRef.current) {
    clearTimeout(animationRef.current);
    animationRef.current = null;
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
    stateRefs.current.inputValue = value;
    
    // Stop animation when user starts typing
    if (userInput.length > 0 && isAnimating) {
      setIsAnimating(false);
      stateRefs.current.isAnimating = false;
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    } else if (userInput.length === 0) {
      // Restart animation when input is cleared (only prefix remains)
      setIsAnimating(true);
      stateRefs.current.isAnimating = true;
      setCurrentCharIndex(0);
      stateRefs.current.currentCharIndex = 0;
      setIsTyping(true);
      stateRefs.current.isTyping = true;
      setCurrentTagIndex(0);
      stateRefs.current.currentTagIndex = 0;
      setDisplayText(prefix);
      stateRefs.current.displayText = prefix;
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
    const userInput = stateRefs.current.inputValue.substring(prefix.length);
    if (userInput.length === 0 && stateRefs.current.isAnimating) {
      setIsAnimating(false);
      stateRefs.current.isAnimating = false;
      if (animationRef.current) {
        clearTimeout(animationRef.current);
        animationRef.current = null;
      }
    }
    // Position cursor after prefix if input only contains prefix
    if (stateRefs.current.inputValue === prefix) {
      setTimeout(() => {
        e.target.setSelectionRange(prefix.length, prefix.length);
      }, 0);
    }
  };

  // Handle input blur - restart animation if empty
  const handleBlur = () => {
    const prefix = 'I am a ';
    const userInput = stateRefs.current.inputValue.substring(prefix.length);
    if (userInput.length === 0) {
      setIsAnimating(true);
      stateRefs.current.isAnimating = true;
      setCurrentCharIndex(0);
      stateRefs.current.currentCharIndex = 0;
      setIsTyping(true);
      stateRefs.current.isTyping = true;
      setCurrentTagIndex(0);
      stateRefs.current.currentTagIndex = 0;
      setDisplayText(prefix);
      stateRefs.current.displayText = prefix;
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

