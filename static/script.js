// Smooth scrolling for navigation links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            const navHeight = document.querySelector('.sticky-nav').offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// Check guest email and show appropriate events
async function checkGuest() {
    const emailInput = document.getElementById('guest-email');
    const email = emailInput.value.trim().toLowerCase();
    const errorMessage = document.getElementById('error-message');
    
    if (!email) {
        errorMessage.textContent = 'Please enter your email address';
        return;
    }
    
    if (!isValidEmail(email)) {
        errorMessage.textContent = 'Please enter a valid email address';
        return;
    }
    
    // Retry logic with up to 2 retries
    const maxRetries = 2;
    let lastError;
    let lastData;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch('/api/check-guest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email })
            });
            
            const data = await response.json();
            lastData = data;
            
            if (data.found) {
                // Hide landing page and show main site
                document.getElementById('landing-page').classList.add('hidden');
                document.getElementById('main-site').classList.remove('hidden');
                
                // Show only the events the guest is invited to
                showEvents(data.events, data.rsvp_status, data.name);
                return; // Success, exit function
            }
            
            // Email not found, retry
            if (attempt < maxRetries) {
                errorMessage.textContent = 'Logging in...';
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
            
        } catch (error) {
            lastError = error;
            console.error(`Attempt ${attempt + 1} failed:`, error);
            
            // If not the last attempt, wait before retrying
            if (attempt < maxRetries) {
                errorMessage.textContent = 'Logging in...';
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            }
        }
    }
    
    // All retries failed
    if (lastData && !lastData.found) {
        errorMessage.textContent = 'Email not found. Please check your email or contact the couple.';
    } else {
        errorMessage.textContent = 'An error occurred. Please try again.';
    }
    console.error('All retry attempts failed:', lastError || 'Email not found');
}

// Show only invited events with RSVP status
function showEvents(events, rsvpStatus, firstName) {
    // Update events intro with first name
    const eventsIntro = document.querySelector('.events-intro');
    if (eventsIntro && firstName) {
        eventsIntro.innerHTML = `<strong>${firstName}</strong>, we hope you can make it to the following celebrations:`;
    }
    
    // Hide all event cards first
    document.getElementById('event-haldi').classList.add('hidden');
    document.getElementById('event-sangeeth').classList.add('hidden');
    document.getElementById('event-ceremony').classList.add('hidden');
    
    // Show only invited events
    events.forEach(event => {
        const eventCard = document.getElementById(`event-${event}`);
        if (eventCard) {
            eventCard.classList.remove('hidden');
            
            // Add RSVP status indicator
            let rsvpIndicator = eventCard.querySelector('.rsvp-indicator');
            if (!rsvpIndicator) {
                rsvpIndicator = document.createElement('div');
                rsvpIndicator.className = 'rsvp-indicator';
                eventCard.insertBefore(rsvpIndicator, eventCard.firstChild);
            }
            
            // Set RSVP indicator content based on status
            if (rsvpStatus === 'going') {
                rsvpIndicator.innerHTML = '<span class="rsvp-going">✓</span>';
            } else if (rsvpStatus === 'not going') {
                rsvpIndicator.innerHTML = '<span class="rsvp-not-going">✗</span>';
            } else {
                rsvpIndicator.innerHTML = '<span class="rsvp-pending">Yet to RSVP</span>';
            }
        }
    });
    
    // Adjust section height based on number of events
    const eventsSection = document.getElementById('events');
    const numEvents = events.length;
    
    if (numEvents === 1) {
        eventsSection.style.minHeight = '50vh';
    } else if (numEvents === 2) {
        eventsSection.style.minHeight = '70vh';
    } else {
        eventsSection.style.minHeight = '100vh';
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Gallery functionality
const galleryData = {};

// Initialize galleries on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeGalleries();
});

async function initializeGalleries() {
    const galleries = document.querySelectorAll('.story-gallery');
    
    for (const gallery of galleries) {
        const galleryName = gallery.getAttribute('data-gallery');
        const baseImage = gallery.querySelector('.gallery-image').src;
        const images = [baseImage]; // Start with the base image
        let imageIndex = 1;
        
        // Try to load images with pattern {gallery_name}-{number}.jpg
        while (imageIndex <= 20) { // Check up to 20 images
            const imageUrl = `/static/images/${galleryName}-${imageIndex}.jpg`;
            
            // Check if image exists
            const exists = await checkImageExists(imageUrl);
            if (exists) {
                images.push(imageUrl);
                imageIndex++;
            } else {
                break;
            }
        }
        
        // Store gallery data
        galleryData[galleryName] = {
            images: images,
            currentIndex: 0,
            timer: null,
            isAnimating: false
        };
        
        // Show/hide arrows based on number of images
        const arrows = gallery.querySelectorAll('.gallery-arrow');
        if (images.length <= 1) {
            arrows.forEach(arrow => arrow.style.display = 'none');
        } else {
            arrows.forEach(arrow => arrow.style.display = 'block');
            startAutoRotation(galleryName);
        }
        
        // Add touch swipe support for mobile
        addSwipeSupport(gallery, galleryName);
    }
}

function startAutoRotation(galleryName) {
    const data = galleryData[galleryName];
    if (data.timer) clearInterval(data.timer);
    data.timer = setInterval(() => {
        navigateGalleryByName(galleryName, 1);
    }, 5000);
}

function resetAutoRotation(galleryName) {
    const data = galleryData[galleryName];
    if (data.timer) clearInterval(data.timer);
    startAutoRotation(galleryName);
}

function checkImageExists(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

function navigateGallery(button, direction) {
    const gallery = button.closest('.story-gallery');
    const galleryName = gallery.getAttribute('data-gallery');
    
    navigateGalleryByName(galleryName, direction);
    resetAutoRotation(galleryName);
}

// Add swipe support for mobile
function addSwipeSupport(gallery, galleryName) {
    let touchStartX = 0;
    let touchEndX = 0;
    
    gallery.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    gallery.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe(gallery, galleryName);
    }, { passive: true });
    
    function handleSwipe(gallery, galleryName) {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left - next image
                navigateGalleryByName(galleryName, 1);
            } else {
                // Swipe right - previous image
                navigateGalleryByName(galleryName, -1);
            }
            resetAutoRotation(galleryName);
        }
    }
}

function navigateGalleryByName(galleryName, direction) {
    const data = galleryData[galleryName];
    if (!data || data.images.length <= 1 || data.isAnimating) return;
    
    data.isAnimating = true;
    const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
    const currentImg = gallery.querySelector('.gallery-image');
    
    // Calculate new index
    data.currentIndex = (data.currentIndex + direction + data.images.length) % data.images.length;
    const nextImageUrl = data.images[data.currentIndex];
    
    // Create new image element
    const nextImg = document.createElement('img');
    nextImg.src = nextImageUrl;
    nextImg.className = 'gallery-image animating';
    nextImg.alt = currentImg.alt;
    
    // Set initial position for next image
    // If direction is 1 (Next), slide in from Right (150% -> 50%)
    // If direction is -1 (Prev), slide in from Left (-50% -> 50%)
    nextImg.style.left = direction > 0 ? '150%' : '-50%';
    
    // Append to gallery
    // Insert before arrows to stay behind correct z-index
    const firstArrow = gallery.querySelector('.gallery-arrow');
    gallery.insertBefore(nextImg, firstArrow);
    
    // Fix gallery height during animation to prevent collapse
    gallery.style.height = gallery.offsetHeight + 'px';
    
    // Prepare current image for animation
    currentImg.classList.add('animating');
    currentImg.style.left = '50%'; // Ensure it starts at center
    
    // Force reflow
    void nextImg.offsetWidth;
    
    // Start animation
    // Next: Current goes -50%, Next goes 50%
    // Prev: Current goes 150%, Next goes 50%
    currentImg.style.left = direction > 0 ? '-50%' : '150%';
    nextImg.style.left = '50%';
    
    // Cleanup after animation
    setTimeout(() => {
        if (gallery.contains(currentImg)) {
            gallery.removeChild(currentImg);
        }
        nextImg.classList.remove('animating');
        nextImg.style.left = ''; // Reset to flow
        nextImg.style.transform = ''; // Reset transform
        gallery.style.height = ''; // Reset height auto
        data.isAnimating = false;
    }, 500); // Match CSS transition time
}

// Allow pressing Enter to submit email
document.getElementById('guest-email')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkGuest();
    }
});

// Countdown Timer
function updateCountdown() {
    const weddingDate = new Date('June 16, 2028 00:00:00').getTime();
    const now = new Date().getTime();
    const distance = weddingDate - now;

    if (distance < 0) {
        document.getElementById('countdown').innerHTML = "We're Married!";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    if (daysEl) {
        daysEl.innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').innerText = seconds.toString().padStart(2, '0');
    }
}

setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call
