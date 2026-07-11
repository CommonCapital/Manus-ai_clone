"""Flask routes for the algorithms UI.

The UI consists of a home page where the user selects an algorithm and
provides input data. Submitting the form posts to `/run/<algorithm>` which
executes the corresponding function from ``algorithms.py`` and renders the
result.
"""

from flask import Blueprint, render_template, request, redirect, url_for
from . import algorithms

bp = Blueprint('algorithms', __name__)

# Mapping from algorithm name to the callable and a short description
ALGORITHM_MAP = {
    "quick_sort": {
        "func": algorithms.quick_sort,
        "description": "Quick Sort – divide and conquer sorting",
        "input_type": "list",
    },
    "merge_sort": {
        "func": algorithms.merge_sort,
        "description": "Merge Sort – divide and conquer sorting",
        "input_type": "list",
    },
    "heap_sort": {
        "func": algorithms.heap_sort,
        "description": "Heap Sort – in‑place sorting using a heap",
        "input_type": "list",
    },
    "bfs": {
        "func": algorithms.bfs,
        "description": "Breadth‑First Search – graph traversal",
        "input_type": "graph",
    },
    "dfs": {
        "func": algorithms.dfs,
        "description": "Depth‑First Search – graph traversal",
        "input_type": "graph",
    },
    "dijkstra": {
        "func": algorithms.dijkstra,
        "description": "Dijkstra's shortest‑path algorithm",
        "input_type": "weighted_graph",
    },
}

@bp.route('/')
def index():
    """Render the home page with a list of available algorithms."""
    return render_template('index.html', algorithms=ALGORITHM_MAP)

@bp.route('/run/<algo>', methods=['POST'])
def run_algorithm(algo):
    """Execute the selected algorithm with user‑provided input.

    The form fields differ based on the algorithm's expected input type.
    """
    if algo not in ALGORITHM_MAP:
        return redirect(url_for('algorithms.index'))
    config = ALGORITHM_MAP[algo]
    # Parse input based on expected type
    if config['input_type'] == 'list':
        # Expect a comma‑separated list of numbers
        raw = request.form.get('list_input', '')
        try:
            numbers = [int(x.strip()) for x in raw.split(',') if x.strip()]
        except ValueError:
            return render_template('result.html', algo=algo, error='Invalid number list.')
        result = config['func'](numbers)
    elif config['input_type'] == 'graph':
        # Expect edges as "a:b,c:d" (directed) – we build an adjacency dict
        raw = request.form.get('graph_input', '')
        graph = {}
        for edge in raw.split(','):
            if ':' not in edge:
                continue
            src, dst = edge.split(':')
            src = src.strip()
            dst = dst.strip()
            graph.setdefault(src, []).append(dst)
        start = request.form.get('start_node', '').strip()
        if not start:
            return render_template('result.html', algo=algo, error='Start node required.')
        result = config['func'](graph, start)
    elif config['input_type'] == 'weighted_graph':
        # Expect edges as "a:b:5,c:d:2" where last part is weight
        raw = request.form.get('graph_input', '')
        graph = {}
        for edge in raw.split(','):
            parts = edge.split(':')
            if len(parts) != 3:
                continue
            src, dst, weight = parts
            src = src.strip()
            dst = dst.strip()
            weight = float(weight.strip())
            graph.setdefault(src, {})[dst] = weight
        start = request.form.get('start_node', '').strip()
        if not start:
            return render_template('result.html', algo=algo, error='Start node required.')
        result = config['func'](graph, start)
    else:
        return render_template('result.html', algo=algo, error='Unsupported input type.')

    return render_template('result.html', algo=algo, result=result)
