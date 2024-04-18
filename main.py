from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import random
import re
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SECRET_KEY'] = 'jbh*/o*/- 3-3/**-4gh -boniogd-/24-/jbo235ihgdino, kp-*/34jfhgv33y*-/buno'
db = SQLAlchemy(app)
socketio = SocketIO(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True)
    password = db.Column(db.String(50))

with app.app_context(): 
    db.create_all()

players = {}
rooms = {"default": {}}

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/slither')
def slither():
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
# ////////////////////////////////////////////////////////////////////

@app.route('/signup', methods=['GET', 'POST'])

def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        confirmed_password = request.form.get('confirmed_password')

        if password != confirmed_password:
            
            return redirect(url_for('signup', ErrorPassword=True))
        
        password_errors = []
        if len(password) < 8:
            password_errors.append("Le mot de passe doit contenir au moins 8 caractères.")
        if not re.search("[a-z]", password):
            password_errors.append("Le mot de passe doit contenir des lettres minuscules.")
        if not re.search("[A-Z]", password):
            password_errors.append("Le mot de passe doit contenir des lettres majuscules.")
        if not re.search("[0-9]", password):
            password_errors.append("Le mot de passe doit contenir des chiffres.")
        if not re.search("[!@#$%^&*?]", password):
            password_errors.append("Le mot de passe doit contenir des caractères spéciaux.")

        if password_errors:
            # S'il y a des erreurs de mot de passe, renvoyer vers le formulaire avec les erreurs.
            return redirect(url_for('signup', PasswordNotSecure=True, password_errors=password_errors))

        # Vérifier si le user existe déjà
        userVerif = User.query.filter_by(username=username).first()
        if userVerif:
            return redirect(url_for('signup', ErrorUsername=True))

        # Créer l'utilisateur mais ne pas encore le committer dans la base de données
        new_user = User(username=username, password=password)
        db.session.add(new_user)

        # Ne pas encore committer l'utilisateur dans la base de données ici
        db.session.commit()

        return redirect(url_for('index'))

    else:
        return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        user = User.query.filter_by(username=username).first()

        if user and user.password == password:
            session['id'] = user.id  
            session['username'] = user.username
            session['password'] = user.password
            return redirect(url_for('slither', Success=True))
        else: 
            return redirect(url_for('login', ErrorLogin=True))

    else:
        return render_template('login.html')

if __name__ == '__main__':
    socketio.run(app, debug=True, host="0.0.0.0", port=8080)

