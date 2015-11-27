# Set this variable to "threading", "eventlet" or "gevent" to test the
# different async modes, or leave it set to None for the application to choose
# the best option based on available packages.
async_mode = 'eventlet'
import eventlet
eventlet.monkey_patch()


from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room, send
from osc import OSC
import signal
import sys
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode)
try:
    OSC_RECEIVE_ADDRESS = ('192.168.1.100', 9999)
    osc_server = OSC.OSCServer(OSC_RECEIVE_ADDRESS)
except Exception, e:
    print e
    OSC_RECEIVE_ADDRESS = ('localhost', 9999)
    osc_server = OSC.OSCServer(OSC_RECEIVE_ADDRESS)
thread = threading.Thread(target=osc_server.serve_forever)

  
@app.route('/')
def index():
    return render_template('main.html')

@app.route('/testws')
def test_ws():
    return render_template('test_web_sockets.html')

@socketio.on('my event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']})

@socketio.on('my broadcast event', namespace='/test')
def test_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)

@socketio.on('connect', namespace='/test')
def test_connect():
    emit('my response', {'data': 'Connected'})
    print('Client connected')

@socketio.on('disconnect', namespace='/test')
def test_disconnect():
    print('Client disconnected')

@socketio.on('join', namespace='/test')
def join(message):
    room_name = message['room'] 
    join_room(room_name)
    emit('my response', {'data': 'In room %s' % room_name}, namespace='/test', room=room_name)
    print('Client joined room %s' % room_name)

def test_handler(addr, tags, stuff, source):
    print(' - Got OSC message')
    room_name = str(stuff[0])
    data = ','.join([str(e) for e in stuff[1:]]) + ' | from %s' % OSC.getUrlStr(source)
    if room_name != '0':
        socketio.emit('my response', {'data': data}, namespace='/test', room=room_name)
    else:
        socketio.emit('my response', {'data': data}, namespace='/test')

def dismiss_handler(addr, tags, stuff, source):
    pass

def acc_intensity_handler(addr, tags, stuff, source):
    data = ','.join([str(e) for e in stuff[1:]]) + ' | from %s' % OSC.getUrlStr(source)
    print data
    socketio.emit('my response', {'data': data}, namespace='/test')


LISTENING_KICK = True
def kick_handler(addr, tags, stuff, source):
    global LISTENING_KICK
    intensity = stuff[0]
    kick_value = stuff[1]

    if kick_value == 0.0 and LISTENING_KICK == False:
        LISTENING_KICK = True

    if kick_value == 1.0:
         print intensity
    if intensity > 0.5 and LISTENING_KICK and kick_value == 1.0:
       
        socketio.emit('kick', {'data': 'kick'}, namespace='/test')
        LISTENING_KICK = False

    

COUNT = 0
def raw_handler(addr, tags, stuff, source):
    global COUNT
    COUNT  += 1
    if COUNT % 100 == 0:
        print 'RAW',
        print stuff
        socketio.emit('my response', {'data': stuff}, namespace='/test')

def exit_signal_handler(signal, frame):
    print('Closing OSC server...')
    osc_server.close()
    thread.join()
    sys.exit(0)
signal.signal(signal.SIGINT, exit_signal_handler)

if __name__ == '__main__':
    # Configure and start osc server
    ignore = [
        '/1/spin',
        '/1/still',
        '/1/raw',
        '/1/quat',
        '/1/euler',
        '/1/acc-intensity',
        '/1/freefall',
        '/1/gyr-intensity',
        '/1/shake',
    ]
    for add in ignore:
        osc_server.addMsgHandler(add, dismiss_handler)    
    osc_server.addMsgHandler("/1/kick", kick_handler)
    thread.start()
    print " * Receiving OSC messages at %s:%i" % (OSC_RECEIVE_ADDRESS[0], OSC_RECEIVE_ADDRESS[1])
    #print "Registered Callback-functions are:"
    #for addr in osc_server.getOSCAddressSpace():
    #   print addr

    # Start web server
    socketio.run(app, host='0.0.0.0', port=5000)



