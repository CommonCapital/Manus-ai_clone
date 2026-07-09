from flask import Flask, render_template_string

app = Flask(__name__)

# Home page
@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Flask App - Home</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
            h1 { color: #333; }
            nav { margin: 20px; }
            nav a { margin: 10px; text-decoration: none; color: #0066cc; }
        </style>
    </head>
    <body>
        <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
        </nav>
        <h1>Welcome to my Flask App</h1>
    </body>
    </html>
    '''

# About page
@app.route('/about')
def about():
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Flask App - About</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 50px; text-align: center; }
            h1 { color: #333; }
            p { color: #666; max-width: 600px; margin: 20px auto; }
            nav { margin: 20px; }
            nav a { margin: 10px; text-decoration: none; color: #0066cc; }
        </style>
    </head>
    <body>
        <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
        </nav>
        <h1>About</h1>
        <p>This is a simple Flask web application demonstrating basic routing and template rendering. It features a home page and an about page to showcase the fundamentals of Flask development.</p>
    </body>
    </html>
    '''

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)