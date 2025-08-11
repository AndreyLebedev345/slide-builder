import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';

interface SlidePresentationProps {
  theme: string;
  slides: string[];
  onSlideChange?: (index: number) => void;
}

export interface SlidePresentationRef {
  addSlide: (html: string, position?: number) => void;
  updateSlide: (index: number, html: string) => void;
  deleteSlide: (index: number) => void;
  navigateToSlide: (index: number) => void;
  getCurrentSlideIndex: () => number;
  sync: () => void;
}

const SlidePresentation = forwardRef<SlidePresentationRef, SlidePresentationProps>(
  ({ theme, slides, onSlideChange }, ref) => {
    const deckRef = useRef<Reveal | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const slidesContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Reveal.js
    useEffect(() => {
      if (!containerRef.current) return;

      const deck = new Reveal(containerRef.current, {
        embedded: true,
        width: '100%',
        height: '100%',
        margin: 0,
        minScale: 1,
        maxScale: 1,
        hash: true,
        controls: true,
        progress: true,
        center: true,
        transition: 'slide'
      });

      deck.initialize();
      deckRef.current = deck;

      // Listen for slide changes
      deck.on('slidechanged', (event: any) => {
        if (onSlideChange) {
          onSlideChange(event.indexh);
        }
      });

      return () => {
        deck.destroy();
      };
    }, []);

    // Sync Reveal.js when slides prop changes
    useEffect(() => {
      if (deckRef.current) {
        // Give React time to update the DOM
        setTimeout(() => {
          deckRef.current?.sync();
        }, 0);
      }
    }, [slides]);

    // Update theme
    useEffect(() => {
      const link = document.getElementById('reveal-theme') as HTMLLinkElement;
      if (link) {
        link.href = `/node_modules/reveal.js/dist/theme/${theme}.css`;
      }
    }, [theme]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addSlide: (html: string, position?: number) => {
        // This method is now handled by React state in App.tsx
        // We only need to navigate to the new slide after it's added
        if (deckRef.current) {
          setTimeout(() => {
            const targetIndex = position !== undefined ? position : deckRef.current!.getTotalSlides() - 1;
            deckRef.current!.slide(targetIndex);
          }, 100);
        }
      },

      updateSlide: (_index: number, _html: string) => {
        // This method is now handled by React state in App.tsx
        // Sync will be triggered by the slides prop change
        if (deckRef.current) {
          setTimeout(() => {
            deckRef.current!.sync();
          }, 100);
        }
      },

      deleteSlide: (_index: number) => {
        // This method is now handled by React state in App.tsx
        // Sync will be triggered by the slides prop change
        if (deckRef.current) {
          setTimeout(() => {
            deckRef.current!.sync();
          }, 100);
        }
      },

      navigateToSlide: (index: number) => {
        if (deckRef.current) {
          deckRef.current.slide(index);
        }
      },

      getCurrentSlideIndex: () => {
        return deckRef.current ? deckRef.current.getIndices().h : 0;
      },

      sync: () => {
        if (deckRef.current) {
          deckRef.current.sync();
        }
      }
    }), []);

    return (
      <>
        <link
          id="reveal-theme"
          rel="stylesheet"
          href={`/node_modules/reveal.js/dist/theme/${theme}.css`}
        />
        <div ref={containerRef} className="reveal h-full w-full">
          <div ref={slidesContainerRef} className="slides">
            {slides.length === 0 ? (
              <section style={{ padding: '32px' }}>
                <h1>Welcome to Slide Builder</h1>
                <p>Use the AI Assistant to create or edit slides</p>
              </section>
            ) : (
              slides.map((slide, index) => (
                <section key={index} style={{ padding: '32px' }} dangerouslySetInnerHTML={{ __html: slide }} />
              ))
            )}
          </div>
        </div>
      </>
    );
  }
);

SlidePresentation.displayName = 'SlidePresentation';

export default SlidePresentation;