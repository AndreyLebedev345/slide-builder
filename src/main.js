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

function updateSlideList() {
  const slideList = document.getElementById('slide-list');
  const slides = document.querySelectorAll('.slides section');
  
  slideList.innerHTML = '';
  slides.forEach((slide, index) => {
    const slideItem = document.createElement('div');
    slideItem.className = 'slide-item';
    slideItem.textContent = `Slide ${index + 1}`;
    slideItem.onclick = () => {
      if (deck) {
        deck.slide(index);
      }
    };
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
});
