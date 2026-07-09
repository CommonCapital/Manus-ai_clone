"""
Flask REST API for managing tasks.
Endpoints:
- GET /api/tasks - List all tasks
- POST /api/tasks - Create a new task
- DELETE /api/tasks/<id> - Delete a task
"""
from flask import Flask, jsonify, request
import uuid

app = Flask(__name__)

# In-memory task storage
tasks = []

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """List all tasks"""
    return jsonify({'tasks': tasks})

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    task = {
        'id': str(uuid.uuid4()),
        'title': data['title'],
        'completed': data.get('completed', False)
    }
    tasks.append(task)
    
    return jsonify({'task': task}), 201

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task by ID"""
    global tasks
    
    for i, task in enumerate(tasks):
        if task['id'] == task_id:
            tasks.pop(i)
            return '', 204
    
    return jsonify({'error': 'Task not found'}), 404

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)