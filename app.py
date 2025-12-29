from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Load guest manifest
with open('MANIFEST.json', 'r') as f:
    MANIFEST = json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/check-guest', methods=['POST'])
def check_guest():
    email = request.json.get('email', '').lower()
    guest = MANIFEST.get(email)
    
    if guest:
        return jsonify({
            'found': True,
            'events': guest['events']
        })
    return jsonify({'found': False})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
