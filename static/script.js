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
    
    try {
        const response = await fetch('/api/check-guest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        
        if (data.found) {
            // Hide landing page and show main site
            document.getElementById('landing-page').classList.add('hidden');
            document.getElementById('main-site').classList.remove('hidden');
            
            // Show only the events the guest is invited to
            showEvents(data.events);
        } else {
            errorMessage.textContent = 'Email not found. Please check your email or contact the couple.';
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred. Please try again.';
        console.error('Error:', error);
    }
}

// Show only invited events
function showEvents(events) {
    // Hide all event cards first
    document.getElementById('event-haldi').classList.add('hidden');
    document.getElementById('event-sangeeth').classList.add('hidden');
    document.getElementById('event-ceremony').classList.add('hidden');
    
    // Show only invited events
    events.forEach(event => {
        const eventCard = document.getElementById(`event-${event}`);
        if (eventCard) {
            eventCard.classList.remove('hidden');
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

// Allow pressing Enter to submit email
document.getElementById('guest-email')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkGuest();
    }
});
