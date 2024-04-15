from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room
import random

app = Flask(__name__)
socketio = SocketIO(app)

players = {}
rooms = {"default": {}}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected:', request.sid)
    if request.sid in players:
        del players[request.sid]

@socketio.on('updatePosition')
def handle_update_position(positions, roomName):
    print("here==> ", positions, roomName)
    players[request.sid] = positions
    print(players)
    emit('updatePositions', players, broadcast=True)

@socketio.on('joinRoom')
def handle_join_room(roomName):
    join_room(roomName)  # Fonction pour rejoindre une room
    print(f"Client {request.sid} joined room: {roomName}")

    if roomName not in players:
        players[roomName] = {}
    players[roomName][request.sid] = "snake"+str(len(players[roomName]))
    
    rooms[roomName]['food'] = []

    emit('initSnake', {'snake': players[roomName]}, room=roomName)

@socketio.on('Position')
def handle_position(data):
    emit('updatePosition', data, room=data['roomName'])

@socketio.on('eatFood')
def handle_eat_food(data):
    if data['quantity'] > 1 and len(rooms[data['roomName']]['food']) > 1:
        emit('addFood',rooms[data['roomName']]['food'],room=data['roomName'])
        print("here")
        return

    for i in range(data['quantity']):
        if data['index'] == -1:
            rooms[data['roomName']]['food'].append({
            'x': random.randint(0, 600/20),
            'y': random.randint(0, 600/20)
        })
        else:
            if rooms[data['roomName']].get('food') is not None:
                rooms[data['roomName']]['food'][data['index']] = {
                    'x': random.randint(0, 600/20),
                    'y': random.randint(0, 600/20)
                }

    emit('addFood',rooms[data['roomName']]['food'],room=data['roomName'])

@socketio.on('gameOver')
def handle_game_over(data):
    emit('gameOver', data, room=data['roomName'])

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=8080)