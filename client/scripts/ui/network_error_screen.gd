extends CanvasLayer

@onready var status_label: Label = $Panel/VBoxContainer/StatusLabel
@onready var reconnect_button: Button = $Panel/VBoxContainer/ReconnectButton

var _was_connected: bool = false

func _ready() -> void:
	visible = false
	reconnect_button.pressed.connect(_on_reconnect_pressed)

func _process(_delta: float) -> void:
	if MatchData.session == null or MatchData.session.mode != &"online":
		return

	var is_network_connected := NetworkClient.is_network_connected

	if _was_connected and not is_connected:
		visible = true
		status_label.text = "Conexão perdida"
		reconnect_button.disabled = false

	elif not _was_connected and is_connected:
		visible = false

	_was_connected = is_network_connected

func _on_reconnect_pressed() -> void:
	reconnect_button.disabled = true
	status_label.text = "Reconectando..."

	if MatchData.session.websocket_url.is_empty():
		await get_tree().create_timer(1.5).timeout
		NetworkClient.simulate_connect()
	else:
		NetworkClient.connect_to_server(MatchData.session.websocket_url)
