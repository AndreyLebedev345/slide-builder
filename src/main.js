import './style.css'
import Reveal from 'reveal.js'
import { initChat } from './chat.js'

let deck = null;
let slideCount = 1;

function initReveal() {
  deck = new Reveal({
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
}

function addSlide() {
  slideCount++;
  const slidesContainer = document.getElementById('slides-container');
  
  const newSlide = document.createElement('section');
  newSlide.innerHTML = `
    <h2>Slide ${slideCount}</h2>
    <p>This is slide number ${slideCount}</p>
  `;
  
  slidesContainer.appendChild(newSlide);
  
  if (deck) {
    deck.sync();
    deck.slide(deck.getTotalSlides() - 1);
  }
  
  updateSlideList();
}

function reorderSlide(fromIndex, toIndex) {
  const slidesContainer = document.getElementById('slides-container');
  const slides = slidesContainer.querySelectorAll('section');

  if (
    fromIndex < 0 || fromIndex >= slides.length ||
    toIndex < 0 || toIndex >= slides.length
  ) {
    console.error('Invalid indices for reorderSlide');
    return;
  }

  const slideToMove = slides[fromIndex];

  // Remove the slide from its current position
  slidesContainer.removeChild(slideToMove);

  // Insert before the target index (if moving forward, adjust target)
  if (toIndex >= slides.length) {
    slidesContainer.appendChild(slideToMove);
  } else {
    slidesContainer.insertBefore(slideToMove, slides[toIndex]);
  }

  // Refresh Reveal.js so it knows about the new order
  if (deck) {
    deck.sync();
    deck.slide(toIndex);
  }

  // Update the clickable slide list
  updateSlideList();
}

function updateSlide(slideIndex, content) {
  const slidesContainer = document.getElementById('slides-container');
  const slides = slidesContainer.querySelectorAll('section');
  
  if (slideIndex < 0 || slideIndex >= slides.length) {
    console.error('Invalid slide index');
    return;
  }
  
  slides[slideIndex].innerHTML = content;
  
  if (deck) {
    deck.sync();
  }
  
  updateSlideList();
}

function deleteSlide(slideIndex) {
  const slidesContainer = document.getElementById('slides-container');
  const slides = slidesContainer.querySelectorAll('section');
  
  if (slideIndex < 0 || slideIndex >= slides.length) {
    console.error('Invalid slide index');
    return;
  }
  
  if (slides.length <= 1) {
    console.warn('Cannot delete the last slide');
    return;
  }
  
  slides[slideIndex].remove();
  
  if (deck) {
    deck.sync();
    const currentSlideIndex = deck.getIndices().h;
    if (currentSlideIndex >= slides.length - 1) {
      deck.slide(Math.max(0, slideIndex - 1));
    }
  }
  
  slideCount = slidesContainer.querySelectorAll('section').length;
  updateSlideList();
}

function updateSlideList() {
  const slideList = document.getElementById('slide-list');
  const slides = document.querySelectorAll('.slides section');
  
  slideList.innerHTML = '';
  slides.forEach((slide, index) => {
    const slideItem = document.createElement('div');
    slideItem.className = 'slide-item';
    
    const slideTitle = document.createElement('span');
    slideTitle.textContent = `Slide ${index + 1}`;
    slideTitle.onclick = () => {
      if (deck) {
        deck.slide(index);
      }
    };
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'slide-buttons';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏';
    editBtn.title = 'Edit slide';
    editBtn.onclick = (e) => {
      e.stopPropagation();
      openEditModal(index);
    };
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete slide';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSlide(index);
    };
    
    buttonContainer.appendChild(editBtn);
    buttonContainer.appendChild(deleteBtn);
    
    slideItem.appendChild(slideTitle);
    slideItem.appendChild(buttonContainer);
    slideList.appendChild(slideItem);
  });
}

// Expose slide API globally for AI agent integration
window.slideAPI = {
  addSlide: (html, position) => {
    const slidesContainer = document.getElementById('slides-container');
    const newSlide = document.createElement('section');
    newSlide.innerHTML = html;
    
    if (position !== undefined && position >= 0) {
      const slides = slidesContainer.querySelectorAll('section');
      if (position < slides.length) {
        slidesContainer.insertBefore(newSlide, slides[position]);
      } else {
        slidesContainer.appendChild(newSlide);
      }
    } else {
      slidesContainer.appendChild(newSlide);
    }
    
    if (deck) {
      deck.sync();
      deck.slide(position !== undefined ? position : deck.getTotalSlides() - 1);
    }
    
    updateSlideList();
    slideCount = document.querySelectorAll('.slides section').length;
  },
  
  updateSlide: (index, html) => {
    const slides = document.querySelectorAll('.slides section');
    if (slides[index]) {
      slides[index].innerHTML = html;
      if (deck) {
        deck.sync();
      }
    }
  },
  
  deleteSlide: (index) => {
    const slides = document.querySelectorAll('.slides section');
    if (slides[index] && slides.length > 1) {
      slides[index].remove();
      if (deck) {
        deck.sync();
      }
      updateSlideList();
      slideCount = document.querySelectorAll('.slides section').length;
    }
  },
  
  getSlideContent: (index) => {
    const slides = document.querySelectorAll('.slides section');
    return slides[index] ? slides[index].innerHTML : null;
  },
  
  getAllSlides: () => {
    const slides = document.querySelectorAll('.slides section');
    return Array.from(slides).map(s => s.innerHTML);
  },
  
  getCurrentSlideIndex: () => {
    return deck ? deck.getIndices().h : 0;
  },
  
  navigateToSlide: (index) => {
    if (deck) {
      deck.slide(index);
    }
  },
  
  getTotalSlides: () => {
    return document.querySelectorAll('.slides section').length;
  },
  
  changeTheme: (themeName) => {
    // List of valid themes
    const validThemes = ['black', 'white', 'league', 'beige', 'night', 'serif', 'simple', 'solarized', 'moon', 'dracula', 'sky', 'blood'];
    
    if (!validThemes.includes(themeName)) {
      console.error(`Invalid theme: ${themeName}`);
      return false;
    }
    
    // Find the theme link element
    const themeLink = document.querySelector('link[href*="theme/"]');
    if (themeLink) {
      // Update the theme CSS link
      themeLink.href = `/node_modules/reveal.js/dist/theme/${themeName}.css`;
      return true;
    }
    
    console.error('Theme link element not found');
    return false;
  },
  
  clearAllSlides: () => {
    const slidesContainer = document.getElementById('slides-container');
    // Keep at least one slide
    slidesContainer.innerHTML = '<section><h2>Presentation Cleared</h2><p>Ready for new content</p></section>';
    if (deck) {
      deck.sync();
      deck.slide(0);
    }
    updateSlideList();
    slideCount = 1;
  },
  
  replaceAllSlides: (slidesHtml) => {
    const slidesContainer = document.getElementById('slides-container');
    slidesContainer.innerHTML = '';
    
    // Add new slides
    slidesHtml.forEach(html => {
      const newSlide = document.createElement('section');
      newSlide.innerHTML = html;
      slidesContainer.appendChild(newSlide);
    });
    
    if (deck) {
      deck.sync();
      deck.slide(0);
    }
    updateSlideList();
    slideCount = slidesHtml.length;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  updateSlideList();
  initChat();
  
  const addSlideBtn = document.getElementById('add-slide-btn');
  if (addSlideBtn) {
    addSlideBtn.addEventListener('click', addSlide);
  }

  const reorderSlideBtn = document.getElementById('reorder-slide-btn');
  if (reorderSlideBtn) {
    reorderSlideBtn.addEventListener('click', () => {
      const from = parseInt(prompt("Enter the current slide number to move:"), 10) - 1;
      const to = parseInt(prompt("Enter the new position for the slide:"), 10) - 1;

      if (isNaN(from) || isNaN(to)) {
        alert("Invalid input. Please enter valid numbers.");
        return;
      }

      reorderSlide(from, to);
    });
  }
});