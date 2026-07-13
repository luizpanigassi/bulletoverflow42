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

	if state == WebSocketPeer.STATE_OPEN and not is_network_connected:
		is_network_connected = true
		network_connected.emit()
		print("Conectado com sucesso!")

	# Drena os pacotes fora do "if state == OPEN": se o server manda uma
	# última mensagem e já fecha em seguida, o estado pode virar CLOSING no
	# mesmo poll — e a mensagem ainda bufferizada não pode ficar presa atrás
	# de um "elif" que só olha o estado de conexão.
	while socket.get_available_packet_count() > 0:
		var packet = socket.get_packet()
		var text = packet.get_string_from_utf8()
		var json = JSON.parse_string(text)
		if json is Dictionary:
			event_received.emit(json)

	if state == WebSocketPeer.STATE_CLOSING or state == WebSocketPeer.STATE_CLOSED:
		if is_network_connected:
			is_network_connected = false
			network_disconnected.emit()
			print("Desconectado do servidor!")
			set_process(false)

func send_message(data: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(data)
		socket.send_text(json_string)
