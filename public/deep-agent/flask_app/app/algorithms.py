"""Algorithm implementations used by the Flask UI.

Provides six classic algorithms:
- quick_sort
- merge_sort
- heap_sort
- bfs (Breadth‑First Search)
- dfs (Depth‑First Search)
- dijkstra (shortest‑path)

Each function works on plain Python data structures (lists or dicts) and returns a new
result without mutating the caller's input.
"""

# ---------- Sorting ----------

def quick_sort(arr):
    """Return a new list containing the elements of *arr* sorted using QuickSort.
    The implementation is recursive and uses the middle element as pivot.
    """
    if len(arr) <= 1:
        return arr[:]
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)


def merge_sort(arr):
    """Return a new list containing the elements of *arr* sorted using MergeSort.
    This implementation is top‑down recursive.
    """
    if len(arr) <= 1:
        return arr[:]
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return _merge(left, right)


def _merge(left, right):
    merged = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i])
            i += 1
        else:
            merged.append(right[j])
            j += 1
    merged.extend(left[i:])
    merged.extend(right[j:])
    return merged


def heap_sort(arr):
    """Sort *arr* in ascending order using HeapSort and return the sorted list.
    The algorithm works in‑place on a copy of the input to avoid side effects.
    """
    a = list(arr)  # make a copy
    n = len(a)

    # Build max‑heap
    for i in range(n // 2 - 1, -1, -1):
        _heapify(a, n, i)

    # Extract elements from heap one by one
    for end in range(n - 1, 0, -1):
        a[0], a[end] = a[end], a[0]  # swap max to the end
        _heapify(a, end, 0)
    return a


def _heapify(a, heap_size, root_index):
    largest = root_index
    left = 2 * root_index + 1
    right = 2 * root_index + 2

    if left < heap_size and a[left] > a[largest]:
        largest = left
    if right < heap_size and a[right] > a[largest]:
        largest = right
    if largest != root_index:
        a[root_index], a[largest] = a[largest], a[root_index]
        _heapify(a, heap_size, largest)

# ---------- Graph Traversal ----------

from collections import deque
import heapq


def bfs(graph, start):
    """Return a list of nodes in the order they are visited by BFS.
    *graph* is a dict mapping a node to an iterable of its neighbours.
    *start* is the source node.
    """
    visited = set([start])
    order = []
    queue = deque([start])
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return order


def dfs(graph, start):
    """Return a list of nodes in the order they are visited by DFS.
    *graph* is a dict mapping a node to an iterable of its neighbours.
    *start* is the source node.
    """
    visited = set()
    order = []

    def _visit(node):
        visited.add(node)
        order.append(node)
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                _visit(neighbor)

    _visit(start)
    return order


def dijkstra(graph, start):
    """Return a dict mapping each node to its shortest‑path distance from *start*.
    *graph* is a dict where ``graph[u]`` is a dict of neighbours ``v`` with edge weight ``w``.
    Example: { 'A': {'B': 5, 'C': 2}, 'B': {'C': 1, 'D': 3}, ... }
    """
    dist = {node: float('inf') for node in graph}
    dist[start] = 0
    heap = [(0, start)]  # (distance, node)
    while heap:
        cur_dist, u = heapq.heappop(heap)
        if cur_dist > dist[u]:
            continue  # stale entry
        for v, w in graph.get(u, {}).items():
            alt = cur_dist + w
            if alt < dist.get(v, float('inf')):
                dist[v] = alt
                heapq.heappush(heap, (alt, v))
    return dist
