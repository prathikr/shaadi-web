# Prathik & Pallavi's Wedding Website

A Flask-based single-page application for our wedding at Niner Winery, Paso Robles.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
python app.py
```

3. Open your browser to `http://localhost:5000`

## Testing

Use any of the test emails from `MANIFEST.json` to view the site:
- `guest1@example.com` - Invited to all events (haldi, sangeeth, ceremony)
- `guest2@example.com` - Invited to ceremony only
- `guest5@example.com` - Invited to ceremony only
- etc.

## Features

- Email-based guest authentication
- Personalized event invitations based on guest list
- Single-page application with smooth scrolling
- Sticky navigation bar
- "Our Story" section with placeholder images
- Travel and accommodation information
- Indian regal wedding meets wine country theme

## Structure

- `app.py` - Flask application
- `MANIFEST.json` - Guest list with event invitations
- `templates/index.html` - Main HTML template
- `static/style.css` - Styling
- `static/script.js` - JavaScript functionality
