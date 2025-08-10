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
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.title = 'Delete slide';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteSlide(index);
    };
    
    slideItem.appendChild(slideTitle);
    slideItem.appendChild(deleteBtn);
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
});
