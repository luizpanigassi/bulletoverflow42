extends Node

var players := {}

func _ready() -> void:
	GameEvents.player_state_updated.connect(_on_player_state_updated)
	GameEvents.player_spawned.connect(_on_player_spawned)
	GameEvents.powerup_collected.connect(_on_powerup_collected)
	GameEvents.entity_wrapped.connect(_on_entity_wrapped)

func register_player(player: Player) -> void:
	if MatchData.session == null or MatchData.session.mode == &"local":
		player.is_network_controlled = false
	else:
		player.is_network_controlled = true
	
	players[player.player_id] = player
	
func unregister_player(player_id: int) -> void:
	players.erase(player_id)

func _on_player_state_updated(data: Dictionary) -> void:
	var slot: int = int(data.get("player_slot", 0))

	if slot == MatchData.local_player_slot:
		return
	var player: Player = players.get(slot)
	
	if not is_instance_valid(player):
		return
		
	var server_pos = Vector2(float(data.get("position_x", 0.0)), float(data.get("position_y", 0.0)))
	var server_velocity = Vector2(float(data.get("velocity_x", 0.0)), float(data.get("velocity_y", 0.0)))
	
	player.global_position = server_pos
	player.velocity = server_velocity

func _on_player_spawned(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	var pos := Vector2(float(data["position_x"]), float(data["position_y"]))

	var player = players.get(slot)
	if is_instance_valid(player):
		player.global_position = pos
		if MatchData.session == null or MatchData.session.mode == &"local":
			MockMatchServer.player_positions[slot] = pos

func _on_powerup_collected(data: Dictionary) -> void:
	var player = players.get(int(data["player_slot"]))
	if is_instance_valid(player):
		player.apply_powerup(data["powerup_type"] as PowerupTypes.Type)

func _on_entity_wrapped(player_slot: int, new_position: Vector2) -> void:
	if MatchData.session.mode != &"online":
		return
	
	var payload := {
		"type": "player_wrapped",
		"player_slot": player_slot,
		"new_pos_x": new_position.x,
		"new_pos_y": new_position.y,
	}

	if NetworkClient.is_network_connected:
		NetworkClient.send_message(payload)
	else:
		MockMatchServer.receive_wrap(payload)
