extends Node

signal connected
signal disconnected
signal event_received(data: Dictionary)

var socket := WebSocketPeer.new()
var is_network_connected := false

func _ready() -> void:
	set_process(false)

func connect_to_server(url: String) -> void:
	print("conectando ao servidor WebSocket: ", url)
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
		if not is_connected:
			is_network_connected = true
			connected.emit()
			print("Conectado com sucesso!")

			while socket.get_available_packet_count() > 0:
				var packet = socket.get_packet()
				var text = packet.get_string_from_utf8()
				var json = JSON.parse_string(text)
				if json is Dictionary:
					event_received.emit(json)
		
		elif state == WebSocketPeer.STATE_CLOSING or state == WebSocketPeer.STATE_CLOSED:
			if is_connected:
				is_network_connected = false
				disconnected.emit()
				print("Desconectado do servidor!")
				set_process(false)

func send_message(data: Dictionary) -> void:
	if socket.get_ready_state() == WebSocketPeer.STATE_OPEN:
		var json_string = JSON.stringify(data)
		socket.send_text(json_string)
