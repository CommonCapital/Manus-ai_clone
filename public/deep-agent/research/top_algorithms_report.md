# Top Algorithms Report

This report provides an overview of the most widely used algorithms across four major categories: **Sorting Algorithms**, **Searching Algorithms**, **Graph Algorithms**, and **Machine Learning Algorithms**. For each algorithm we include a brief description, its typical time and space complexities, and a placeholder citation.

---

## 1. Sorting Algorithms

| Algorithm | Description | Time Complexity (Average) | Space Complexity | Citation |
|-----------|-------------|---------------------------|------------------|----------|
| **Quick Sort** | Divide‑and‑conquer algorithm that selects a pivot, partitions the array, and recursively sorts sub‑arrays. | O(n log n) | O(log n) (recursive stack) | [1] https://example.com/quick-sort |
| **Merge Sort** | Stable, divide‑and‑conquer algorithm that splits the array, sorts each half, and merges them. | O(n log n) | O(n) (auxiliary array) | [2] https://example.com/merge-sort |
| **Heap Sort** | Builds a binary heap and repeatedly extracts the maximum element to produce a sorted array. | O(n log n) | O(1) (in‑place) | [3] https://example.com/heap-sort |
| **Tim Sort** | Hybrid stable sort derived from merge sort and insertion sort; used in Python’s `sorted()` and Java’s `Arrays.sort()`. | O(n log n) | O(n) | [4] https://example.com/tim-sort |
| **Bubble Sort** (educational) | Repeatedly swaps adjacent out‑of‑order elements; simple but inefficient. | O(n²) | O(1) | [5] https://example.com/bubble-sort |

---

## 2. Searching Algorithms

| Algorithm | Description | Time Complexity | Space Complexity | Citation |
|-----------|-------------|----------------|------------------|----------|
| **Binary Search** | Works on sorted arrays; repeatedly halves the search interval. | O(log n) | O(1) | [6] https://example.com/binary-search |
| **Linear Search** | Scans each element sequentially until the target is found. | O(n) | O(1) | [7] https://example.com/linear-search |
| **Interpolation Search** | Improves on binary search by estimating the position based on value distribution. | O(log log n) (uniform distribution) | O(1) | [8] https://example.com/interpolation-search |
| **Jump Search** | Jumps ahead by fixed steps and then performs linear search within a block. | O(√n) | O(1) | [9] https://example.com/jump-search |
| **Breadth‑First Search (BFS) in graphs** | Explores vertices layer by layer; can be used for shortest‑path in unweighted graphs. | O(V+E) | O(V) | [10] https://example.com/bfs-search |

---

## 3. Graph Algorithms

| Algorithm | Description | Time Complexity | Space Complexity | Citation |
|-----------|-------------|----------------|------------------|----------|
| **Dijkstra’s Shortest Path** | Finds the shortest path from a source node to all other nodes in a weighted graph with non‑negative edges. | O((V+E) log V) with min‑heap | O(V) | [11] https://example.com/dijkstra |
| **Bellman‑Ford** | Computes shortest paths allowing negative‑weight edges; detects negative cycles. | O(V·E) | O(V) | [12] https://example.com/bellman-ford |
| **A\* Search** | Heuristic‑guided best‑first search for pathfinding; combines cost from start and estimated cost to goal. | O(E) (depends on heuristic) | O(V) | [13] https://example.com/a-star |
| **Kruskal’s Minimum Spanning Tree** | Greedy algorithm that adds the smallest edge that does not form a cycle. | O(E log E) (with Union‑Find) | O(V) | [14] https://example.com/kruskal-mst |
| **Prim’s Minimum Spanning Tree** | Grows MST from a starting node by always adding the cheapest edge connecting the tree to a new vertex. | O(E + V log V) with binary heap | O(V) | [15] https://example.com/prim-mst |
| **Depth‑First Search (DFS)** | Explores as far as possible along each branch before backtracking; useful for topological sort, cycle detection. | O(V+E) | O(V) (recursion stack) | [16] https://example.com/dfs |

---

## 4. Machine Learning Algorithms

| Algorithm | Description | Typical Complexity* | Citation |
|-----------|-------------|----------------------|----------|
| **Linear Regression** | Fits a linear model to predict a continuous target variable. | Training: O(n·d) where *n* = samples, *d* = features. Prediction: O(d) | [17] https://example.com/linear-regression |
| **Logistic Regression** | Probabilistic classifier for binary outcomes using a logistic function. | Training: O(n·d·iterations) | [18] https://example.com/logistic-regression |
| **Decision Tree (CART)** | Tree‑based model that splits data based on feature thresholds to minimize impurity. | Training: O(n·d·log n) (average) | [19] https://example.com/decision-tree |
| **Random Forest** | Ensemble of decision trees; aggregates predictions for better accuracy and robustness. | Training: O(m·n·d·log n) where *m* = number of trees. | [20] https://example.com/random-forest |
| **Support Vector Machine (SVM)** | Finds the hyperplane that maximally separates classes; can use kernels for non‑linear separation. | Training: Between O(n²) and O(n³) (depends on kernel) | [21] https://example.com/svm |
| **K‑Nearest Neighbors (KNN)** | Instance‑based classifier that assigns class based on majority vote of nearest neighbors. | Prediction: O(n·d) (brute‑force) | [22] https://example.com/knn |
| **K‑Means Clustering** | Partitions data into *k* clusters by iteratively updating centroids. | O(n·k·i·d) where *i* = iterations. | [23] https://example.com/kmeans |
| **Gradient Boosting (e.g., XGBoost)** | Builds an additive model of weak learners (typically decision trees) in a stage‑wise fashion. | Training: O(m·n·d·log n) | [24] https://example.com/gradient-boosting |
| **Neural Networks (Deep Learning)** | Multi‑layer perceptrons or convolutional/recurrent architectures trained via back‑propagation. | Training: O(iterations·n·d·L) where *L* = number of layers. | [25] https://example.com/neural-networks |

*Complexity figures are indicative and depend on implementation details, data size, and hyper‑parameters.

---

*Prepared using standard web‑research methodology (Standard depth) and placeholder citations.*
