from flask import Flask, jsonify, request

app = Flask(__name__)

# In-memory storage for tasks
tasks = []
next_id = 1

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """List all tasks"""
    return jsonify(tasks), 200

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    global next_id
    
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    task = {
        'id': next_id,
        'title': data['title'],
        'description': data.get('description', ''),
        'completed': data.get('completed', False)
    }
    
    tasks.append(task)
    next_id += 1
    
    return jsonify(task), 201

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task by ID"""
    global tasks
    
    task = next((t for t in tasks if t['id'] == task_id), None)
    
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    
    tasks = [t for t in tasks if t['id'] != task_id]
    
    return jsonify({'message': 'Task deleted successfully'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)