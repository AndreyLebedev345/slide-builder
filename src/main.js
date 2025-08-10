import './style.css'
import Reveal from 'reveal.js'

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

document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  updateSlideList();
  
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