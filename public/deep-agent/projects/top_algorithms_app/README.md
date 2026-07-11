# Top Algorithms Flask App

This project demonstrates placeholder implementations of several classic algorithms using a simple Flask web application.

## Endpoints

- **GET `/sort`** – Returns a JSON list of sorting algorithm names.
- **GET `/search`** – Returns a JSON list of searching algorithm names.
- **GET `/graph`** – Returns a JSON list of graph algorithm names.
- **GET `/ml`** – Returns a JSON list of machine learning algorithm names.

## Running the Application

1. **Create a virtual environment (optional but recommended)**
   ```bash
   python3 -m venv venv
   source venv/bin/activate   # On Windows use `venv\Scripts\activate`
   ```

2. **Install Flask**
   ```bash
   pip install Flask
   ```

3. **Start the server**
   ```bash
   python run.py
   ```

   The app will be available at `http://localhost:5000`.

4. **Test the endpoints**
   ```bash
   curl http://localhost:5000/sort
   curl http://localhost:5000/search
   curl http://localhost:5000/graph
   curl http://localhost:5000/ml
   ```

## Project Structure

```
projects/top_algorithms_app/
├── run.py        # Main Flask application entry point
└── README.md    # This file
```

Feel free to expand the placeholder functions with real algorithm implementations!
