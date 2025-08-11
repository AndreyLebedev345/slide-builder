import { useState, useRef } from 'react';
import SlidePresentation from './components/SlidePresentation';
import type { SlidePresentationRef } from './components/SlidePresentation';
import SlidesList from './components/SlidesList';
import ChatInterface from './components/ChatInterface';
import { Button } from './components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { Textarea } from './components/ui/textarea';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import type { SlideAPI } from './lib/slide-tools';
import { cn } from '@/lib/utils';
import './App.css';

function App() {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [theme] = useState('black'); // Default theme, can be changed via AI
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(true);
  
  const presentationRef = useRef<SlidePresentationRef>(null);

  // Create slideAPI object for chat interface
  const slideAPI: SlideAPI = {
    addSlide: (html: string, position?: number) => {
      console.log('[App.addSlide] Called with position:', position);
      console.log('[App.addSlide] Current slides count:', slides.length);
      
      setSlides(prev => {
        const newSlides = [...prev];
        if (position !== undefined && position >= 0 && position < newSlides.length) {
          console.log('[App.addSlide] Inserting at position:', position);
          newSlides.splice(position, 0, html);
        } else {
          console.log('[App.addSlide] Appending to end');
          newSlides.push(html);
        }
        console.log('[App.addSlide] New slides count will be:', newSlides.length);
        return newSlides;
      });
      
      // Navigate to the new slide after React has updated
      setTimeout(() => {
        if (presentationRef.current) {
          const targetIndex = position !== undefined && position >= 0 && position < slides.length 
            ? position 
            : slides.length; // New slide will be at the end
          presentationRef.current.navigateToSlide(targetIndex);
        }
      }, 100);
    },
    updateSlide: (index: number, html: string) => {
      setSlides(prev => {
        const newSlides = [...prev];
        newSlides[index] = html;
        return newSlides;
      });
      // Sync will happen automatically via useEffect in SlidePresentation
    },
    deleteSlide: (index: number) => {
      if (slides.length > 1) {
        // If deleting the current slide, navigate to previous slide or first slide
        const currentIndex = presentationRef.current?.getCurrentSlideIndex() || 0;
        if (currentIndex === index) {
          const newIndex = index > 0 ? index - 1 : 0;
          setTimeout(() => {
            presentationRef.current?.navigateToSlide(newIndex);
          }, 100);
          setCurrentSlide(newIndex);
        } else if (currentIndex > index) {
          // Adjust current slide index if it's after the deleted slide
          setCurrentSlide(currentIndex - 1);
        }
        
        setSlides(prev => prev.filter((_, i) => i !== index));
        // Sync will happen automatically via useEffect in SlidePresentation
      }
    },
    getSlideContent: (index: number) => {
      return slides[index] || null;
    },
    getAllSlides: () => {
      return slides;
    },
    getCurrentSlideIndex: () => {
      return currentSlide;
    },
    navigateToSlide: (index: number) => {
      if (presentationRef.current) {
        presentationRef.current.navigateToSlide(index);
        setCurrentSlide(index);
      }
    },
    getTotalSlides: () => {
      return slides.length;
    },
    changeTheme: (themeName: string) => {
      const THEMES = ['black', 'white', 'league', 'beige', 'night', 'serif', 'simple', 'solarized', 'moon', 'dracula', 'sky', 'blood'];
      if (THEMES.includes(themeName)) {
        // Update theme directly in SlidePresentation
        const link = document.getElementById('reveal-theme') as HTMLLinkElement;
        if (link) {
          link.href = `/node_modules/reveal.js/dist/theme/${themeName}.css`;
        }
        return true;
      }
      return false;
    },
    replaceAllSlides: (newSlides: string[]) => {
      setSlides(newSlides);
      setCurrentSlide(0);
      // The SlidePresentation component will re-render with new slides
      // We'll use a setTimeout to ensure React has updated before syncing
      setTimeout(() => {
        if (presentationRef.current) {
          presentationRef.current.sync();
          presentationRef.current.navigateToSlide(0);
        }
      }, 0);
    },
    clearAllSlides: () => {
      setSlides([]);
      setCurrentSlide(0);
      // The SlidePresentation component will re-render with empty slides
      setTimeout(() => {
        if (presentationRef.current) {
          presentationRef.current.sync();
        }
      }, 0);
    }
  };

  const handleAddSlide = () => {
    const newSlide = `<h2>New Slide</h2>\n<p>Click edit to modify this slide</p>`;
    slideAPI.addSlide(newSlide);
  };

  const handleEditSlide = (index: number) => {
    setEditingSlideIndex(index);
    setEditingContent(slides[index] || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingSlideIndex !== null) {
      slideAPI.updateSlide(editingSlideIndex, editingContent);
    }
    setEditModalOpen(false);
    setEditingSlideIndex(null);
    setEditingContent('');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar - Slides (Collapsible) */}
      <aside className={`${leftSidebarCollapsed ? 'w-12' : 'w-64'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {leftSidebarCollapsed ? (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setLeftSidebarCollapsed(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => slideAPI.navigateToSlide(index)}
                  className={cn(
                    "w-full py-2 text-xs font-medium transition-colors",
                    currentSlide === index 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                  title={`Go to slide ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-800">Slides</h1>
              <button
                type="button"
                onClick={() => setLeftSidebarCollapsed(true)}
                className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <SlidesList
                slides={slides}
                currentSlide={currentSlide}
                onAddSlide={handleAddSlide}
                onDeleteSlide={(index) => slideAPI.deleteSlide(index)}
                onEditSlide={handleEditSlide}
                onNavigateToSlide={(index) => slideAPI.navigateToSlide(index)}
              />
            </div>
          </>
        )}
      </aside>

      {/* Main Content - Presentation with margin and rounded corners */}
      <main className="flex-1 p-6 bg-gray-100">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <SlidePresentation
            ref={presentationRef}
            theme={theme}
            slides={slides}
            onSlideChange={setCurrentSlide}
          />
        </div>
      </main>

      {/* Right Sidebar - Chat (Narrower, Cursor-style) */}
      <aside className="w-80 bg-white border-l border-gray-200">
        <ChatInterface slideAPI={slideAPI} />
      </aside>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Slide {editingSlideIndex !== null ? editingSlideIndex + 1 : ''}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Enter HTML content for the slide..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;