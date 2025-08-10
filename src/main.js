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

function openEditModal(slideIndex) {
  const slidesContainer = document.getElementById('slides-container');
  const slides = slidesContainer.querySelectorAll('section');
  
  if (slideIndex < 0 || slideIndex >= slides.length) {
    return;
  }
  
  const currentContent = slides[slideIndex].innerHTML;
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'edit-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Edit Slide ${slideIndex + 1}</h3>
      <textarea id="slide-content-editor" rows="10">${currentContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
      <div class="modal-buttons">
        <button id="save-slide-btn">Save</button>
        <button id="cancel-edit-btn">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Focus on textarea
  const editor = document.getElementById('slide-content-editor');
  editor.focus();
  editor.select();
  
  // Save button handler
  document.getElementById('save-slide-btn').onclick = () => {
    const newContent = editor.value;
    updateSlide(slideIndex, newContent);
    document.body.removeChild(modal);
  };
  
  // Cancel button handler
  document.getElementById('cancel-edit-btn').onclick = () => {
    document.body.removeChild(modal);
  };
  
  // Close on escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.body.removeChild(modal);
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
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