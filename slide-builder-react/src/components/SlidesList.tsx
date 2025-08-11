import React from 'react';
import { Button } from './ui/button';
import { Trash2, Edit3, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlidesListProps {
  slides: string[];
  currentSlide: number;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onEditSlide: (index: number) => void;
  onNavigateToSlide: (index: number) => void;
}

const SlidesList: React.FC<SlidesListProps> = ({
  slides,
  currentSlide,
  onAddSlide,
  onDeleteSlide,
  onEditSlide,
  onNavigateToSlide
}) => {
  const getSlideTitle = (html: string, index: number) => {
    // Try to extract title from HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const h1 = tempDiv.querySelector('h1');
    const h2 = tempDiv.querySelector('h2');
    const title = h1?.textContent || h2?.textContent || `Slide ${index + 1}`;
    return title.substring(0, 30) + (title.length > 30 ? '...' : '');
  };

  return (
    <div className="h-full flex flex-col">

      {/* Slides List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {slides.length === 0 ? (
          <div className="text-center py-8">
            <Presentation className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No slides yet</p>
            <p className="text-gray-400 text-xs mt-1">Use the assistant to create slides</p>
          </div>
        ) : (
          slides.map((slide, index) => (
            <div
              key={index}
              className={cn(
                "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                "hover:shadow-md border",
                currentSlide === index 
                  ? "bg-blue-50 border-blue-300 shadow-sm" 
                  : "bg-white border-gray-200 hover:border-gray-300"
              )}
              onClick={() => onNavigateToSlide(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      currentSlide === index 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-600"
                    )}>
                      {index + 1}
                    </span>
                    {currentSlide === index && (
                      <span className="text-xs text-blue-600 font-medium">Current</span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm font-medium truncate",
                    currentSlide === index ? "text-blue-900" : "text-gray-800"
                  )}>
                    {getSlideTitle(slide, index)}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:bg-blue-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSlide(index);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 hover:bg-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(index);
                    }}
                    disabled={slides.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Slide Count */}
      {slides.length > 0 && (
        <div className="pt-3 mt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            {slides.length} slide{slides.length !== 1 ? 's' : ''} • Slide {currentSlide + 1} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default SlidesList;