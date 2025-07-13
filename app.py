import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'vendor'))

from flask import Flask, render_template, request, jsonify, send_from_directory
import re

home_directory = os.path.expanduser("~")
app = Flask(__name__)

connectionsFile = os.path.join(home_directory, '.ssh', 'sshfs.json')

def parse_ssh_config():
    ssh_config_path = os.path.join(home_directory, '.ssh', 'config')
    hosts = {}

    try:
        with open(ssh_config_path, 'r') as f:
            current_host = None
            for line in f:
                line = line.strip()
                if line.startswith('Host ') and not line.startswith('Host *'):
                    current_host = line.split()[1]
                    hosts[current_host] = {}
                elif current_host and line:
                    if ' ' in line:
                        key, value = line.split(None, 1)
                        hosts[current_host][key.lower()] = value
    except FileNotFoundError:
        pass

    return hosts

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/connection')
def connection():
    return render_template('connection.html')

@app.route('/api/connections', methods=['GET'])
def get_connections():
    try:
        with open(connectionsFile, 'r') as f:
            connections = json.load(f)

        # Adiciona status de montagem para cada conexão
        for conn in connections:
            conn['mounted'] = is_mounted(conn.get('localPath', ''))

        return jsonify(connections)
    except FileNotFoundError:
        return jsonify([])

@app.route('/api/ssh-hosts', methods=['GET'])
def get_ssh_hosts():
    hosts = parse_ssh_config()
    return jsonify(hosts)

def is_mounted(local_path):
    try:
        if not os.path.exists(local_path):
            return False
        file_count = len([f for f in os.listdir(local_path) if os.path.isfile(os.path.join(local_path, f))])
        return file_count > 0
    except:
        return False

@app.route('/api/check-mount', methods=['POST'])
def check_mount():
    data = request.json
    mounted = is_mounted(data['localPath'])
    return jsonify({'mounted': mounted})

@app.route('/api/connect', methods=['POST'])
def connect_sshfs():
    data = request.json
    print(data)

    try:
        import subprocess
        cmd = ["sshfs", f"{data['username']}@{data['host']}:{data['remotePath']}", f"{data['localPath']}", "-p", f"{data['port']}"]

        if data.get('identityFile'):
            cmd.append("-o")
            cmd.append( f"IdentityFile={data['identityFile']}")

        cmd.append("-v")

        print(" ".join(cmd))

        try:
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            outs, errs = process.communicate(timeout=5) # Timeout after 5 seconds
            print(f"Stdout: {outs.decode()}")
            print(f"Stderr: {errs.decode()}")
        except subprocess.TimeoutExpired:
            process.kill() # Terminate the process if timeout occurs
            outs, errs = process.communicate() # Get any remaining output
            print(f"Process timed out. Killed.")
            print(f"Stdout (partial): {outs.decode()}")
            print(f"Stderr (partial): {errs.decode()}")

        print(process)

        stat = False if errs else True
        #return '{"error":"'+errs.decode()+'","success":'+stat+', "cmd": "'+cmd+'"}'
        return jsonify({'success': stat, 'error': errs.decode(), 'cmd': cmd, 'message': 'Conectado com sucesso'})

        #
        #result = subprocess.Popen(cmd, shell=True, text=True)
        #print(result.stderr)
        #print(result.stdout)

        if process.stderr == None:
            return jsonify({'success': True, 'message': 'Conectado com sucesso'})
        else:
            return jsonify({'success': False, 'error': process.stderr})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/connections/<connection_id>', methods=['DELETE'])
def delete_connection(connection_id):
    try:
        if os.path.exists(connectionsFile):
            with open(connectionsFile, 'r') as f:
                connections = json.load(f)
        else:
            return jsonify({'success': False, 'error': 'Arquivo não encontrado'})

        connections = [conn for conn in connections if conn.get('id') != connection_id]

        with open(connectionsFile, 'w') as f:
            json.dump(connections, f, indent=2)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/connections', methods=['POST'])
def save_connection():
    data = request.json
    data['id'] = str(len(data) + int(data.get('createdAt', '0').replace('-', '').replace(':', '').replace('T', '').replace('Z', '').replace('.', '')[:10]))

    try:
        if os.path.exists(connectionsFile):
            with open(connectionsFile, 'r') as f:
                connections = json.load(f)
        else:
            connections = []

        connections.append(data)

        with open(connectionsFile, 'w') as f:
            json.dump(connections, f, indent=2)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/vendor/<path:filename>')
def vendor_files(filename):
    return send_from_directory('vendor', filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)