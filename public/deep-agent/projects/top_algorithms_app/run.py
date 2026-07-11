from flask import Flask, jsonify

app = Flask(__name__)

# Placeholder algorithm implementations

def quicksort(arr):
    """Simple quicksort placeholder using Python's built-in sorted."""
    return sorted(arr)

def mergesort(arr):
    return sorted(arr)

def heapsort(arr):
    return sorted(arr)

def binary_search(arr, target):
    """Placeholder binary search returning index or -1."""
    try:
        return arr.index(target)
    except ValueError:
        return -1

def linear_search(arr, target):
    for i, v in enumerate(arr):
        if v == target:
            return i
    return -1

def bfs(graph, start):
    return []  # placeholder

def dfs(graph, start):
    return []  # placeholder

def dijkstra(graph, start):
    return {}  # placeholder

def linear_regression(data):
    return {"coef": 0, "intercept": 0}

def kmeans(data, k=3):
    return []

def decision_tree(data):
    return {}

# Algorithm name lists
SORT_ALGS = ["QuickSort", "MergeSort", "HeapSort"]
SEARCH_ALGS = ["Binary Search", "Linear Search"]
GRAPH_ALGS = ["Breadth-First Search", "Depth-First Search", "Dijkstra's Algorithm"]
ML_ALGS = ["Linear Regression", "K-Means Clustering", "Decision Tree"]

@app.route('/sort')
def sort_endpoint():
    return jsonify(SORT_ALGS)

@app.route('/search')
def search_endpoint():
    return jsonify(SEARCH_ALGS)

@app.route('/graph')
def graph_endpoint():
    return jsonify(GRAPH_ALGS)

@app.route('/ml')
def ml_endpoint():
    return jsonify(ML_ALGS)

if __name__ == '__main__':
    # Run the Flask app on localhost:5000
    app.run(host='0.0.0.0', port=5000, debug=True)
