extends Node

signal network_connected
signal network_disconnected
signal event_received(data: Dictionary)

var socket := WebSocketPeer.new()
var is_network_connected := false

func _ready() -> void:
	set_process(false)

func connect_to_server(url: String) -> void:
	print("Conectando ao servidor WebSocket: ", url)
	if socket.get_ready_state() != WebSocketPeer.STATE_CLOSED:
		socket.close()
	var err = socket.connect_to_url(url)
	if err != OK:
		print("Erro iniciando a conexão: ", err)
		return
	is_network_connected = false
	set_process(true)

func _process(_delta: float) -> void:
	socket.poll()
	var state = socket.get_ready_state()

	if state == WebSocketPeer.STATE_OPEN:
		if not is_network_connected:
			is_network_connected = true
			network_connected.emit()
			print("Conectado com sucesso!")

		while socket.get_available_packet_count() > 0:
			var packet = socket.get_packet()
			var text = packet.get_string_from_utf8()
			var json = JSON.parse_string(text)
			if json is Dictionary:
				event_received.emit(json)
		
	elif state == WebSocketPeer.STATE_CLOSING or state == WebSocketPeer.STATE_CLOSED:
		if is_network_connected:
			is_network_connected = false
			network_disconnected.emit()
			print("Desconectado do servidor!")
			set_process(false)

func send_message(data: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(data)
		socket.send_text(json_string)

func simulate_disconnect() -> void:
	is_network_connected = false
	network_disconnected.emit
		
func simulate_connect() -> void:
	if not is_network_connected:
		is_network_connected = true
		network_connected.emit()
