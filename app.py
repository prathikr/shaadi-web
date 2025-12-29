from flask import Flask, render_template, request, jsonify
import requests
import pandas as pd
from io import StringIO
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

# Google Sheets configuration
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')
SHEET_CSV_URL = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&id={SPREADSHEET_ID}&gid=0"

global df

def get_guest_data():
    """Fetch guest data from Google Sheets"""
    print("Fetching guest data from Google Sheets...")
    response = requests.get(SHEET_CSV_URL)
    df = pd.read_csv(StringIO(response.text))
    return df

def parse_events(event_string):
    """Parse event string like 'Haldi + Sangeet + Wedding' into list"""
    if pd.isna(event_string) or not event_string:
        return []
    
    events = []
    event_string = str(event_string).lower()
    if 'haldi' in event_string:
        events.append('haldi')
    if 'sangeet' in event_string or 'sangeeth' in event_string:
        events.append('sangeeth')
    if 'wedding' in event_string or 'ceremony' in event_string:
        events.append('ceremony')
    
    return events

@app.route('/')
def index():
    global df
    df = get_guest_data()
    return render_template('index.html')

@app.route('/api/check-guest', methods=['POST'])
def check_guest():
    email = request.json.get('email', '').lower().strip()
    
    try:
        
        
        # Find guest by email
        guest_row = df[df['Email'].str.lower().str.strip() == email]
        
        if not guest_row.empty:
            events_invited = guest_row.iloc[0]['Event(s) invited']
            events = parse_events(events_invited)
            
            # Get guest name and extract first name
            full_name = guest_row.iloc[0].get('Name', '')
            first_name = str(full_name).split()[0] if not pd.isna(full_name) else ''
            
            # Get RSVP status
            rsvp_status = guest_row.iloc[0].get('RSVP', None)
            if pd.isna(rsvp_status):
                rsvp_status = None
            else:
                rsvp_status = str(rsvp_status).strip().lower()
            
            return jsonify({
                'found': True,
                'name': first_name,
                'events': events,
                'rsvp_status': rsvp_status
            })
        
        return jsonify({'found': False})
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Unable to access guest list'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
