from flask import Flask, send_from_directory
import os

# Define the path to the Vite build output (dist folder)
build_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'dist')
app = Flask(__name__, static_folder=build_path)

# Serve the main page (index.html)
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

# Serve static files (JS, CSS, images, etc.)
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    # Fallback to index.html for client-side routing
    return index()

if __name__ == '__main__':
    app.run(debug=True)