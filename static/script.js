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
    
    // Update attire info based on invited events
    const attireInfo = document.getElementById('attire-info');
    if (attireInfo) {
        let attireHTML = '';
        const hasHaldi = events.includes('haldi');
        const hasSangeet = events.includes('sangeeth');
        const hasCeremony = events.includes('ceremony');
        
        // Build the pre-reception events list
        let preReceptionEvents = [];
        if (hasHaldi) preReceptionEvents.push('Haldi');
        if (hasSangeet) preReceptionEvents.push('Sangeet');
        if (hasCeremony) preReceptionEvents.push('Wedding Ceremony');
        
        if (preReceptionEvents.length > 0) {
            const eventsList = preReceptionEvents.join(', ');
            attireHTML = `<p>• ${eventsList}: Indian Formal</p>`;
        }
        
        // Wedding reception always has the option for black tie or Indian
        if (hasCeremony) {
            attireHTML += '<p>• Wedding Reception: Western or Indian Formal</p>';
        }
        
        attireInfo.innerHTML = attireHTML;
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
            currentIndex: 0
        };
        
        // Show/hide arrows based on number of images
        const arrows = gallery.querySelectorAll('.gallery-arrow');
        if (images.length <= 1) {
            arrows.forEach(arrow => arrow.style.display = 'none');
        } else {
            arrows.forEach(arrow => arrow.style.display = 'block');
        }
        
        // Create dots
        const dotsContainer = gallery.querySelector('.gallery-dots');
        if (dotsContainer && images.length > 1) {
            dotsContainer.innerHTML = '';
            images.forEach((_, index) => {
                const dot = document.createElement('div');
                dot.className = 'gallery-dot' + (index === 0 ? ' active' : '');
                dot.onclick = () => goToImage(galleryName, index);
                dotsContainer.appendChild(dot);
            });
        }
    }
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
    const data = galleryData[galleryName];
    
    if (!data || data.images.length <= 1) return;
    
    // Update index
    data.currentIndex = (data.currentIndex + direction + data.images.length) % data.images.length;
    
    // Update image
    const img = gallery.querySelector('.gallery-image');
    img.src = data.images[data.currentIndex];
    
    // Update dots
    updateDots(gallery, data.currentIndex);
}

function goToImage(galleryName, index) {
    const data = galleryData[galleryName];
    if (!data) return;
    
    data.currentIndex = index;
    
    // Find the gallery element
    const gallery = document.querySelector(`[data-gallery="${galleryName}"]`);
    const img = gallery.querySelector('.gallery-image');
    img.src = data.images[data.currentIndex];
    
    // Update dots
    updateDots(gallery, data.currentIndex);
}

function updateDots(gallery, activeIndex) {
    const dots = gallery.querySelectorAll('.gallery-dot');
    dots.forEach((dot, index) => {
        if (index === activeIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Allow pressing Enter to submit email
document.getElementById('guest-email')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkGuest();
    }
});
