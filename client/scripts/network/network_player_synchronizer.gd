extends Node

var players := {}

func _ready() -> void:
	GameEvents.player_state_updated.connect(_on_player_state_updated)
	GameEvents.player_spawned.connect(_on_player_spawned)
	GameEvents.powerup_collected.connect(_on_powerup_collected)
	GameEvents.entity_wrapped.connect(_on_entity_wrapped)
	GameEvents.player_wrap_synced.connect(_on_player_wrapped_synced)

func register_player(player: Player) -> void:
	if MatchData.session == null or MatchData.session.mode == &"local":
		player.is_network_controlled = false
	else:
		player.is_network_controlled = true
	
	players[player.player_id] = player
	
func unregister_player(player_id: int) -> void:
	if players.has(player_id):
		players.erase(player_id)

func _on_player_state_updated(data: Dictionary) -> void:
	if MatchData.session == null or MatchData.session.mode == &"local":
		return
		
	var slot: int = int(data.get("player_slot", 0))
	var server_pos: Vector2 = Vector2(float(data["position_x"]), float(data["position_y"]))
	
	var server_seq = int(data.get("last_processed_seq", 0))
	
	var player: Player = players.get(slot)
	
	if not is_instance_valid(player):
		return
	
	if slot == MatchData.local_player_slot:
		player.reconcile(server_pos, server_seq)
		return
	
	player.last_processed_seq = server_seq
	player.network_target_position = server_pos

func _on_player_spawned(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	var pos := Vector2(float(data["position_x"]), float(data["position_y"]))

	var player = players.get(slot)
	
	if player == null:
		return
		
	if not is_instance_valid(player):
		players.erase(slot)
		return
		
	if is_instance_valid(player):
		player.global_position = pos
		player.network_target_position = pos
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

func _on_player_wrapped_synced(slot: int, new_position: Vector2) -> void:
	if slot == MatchData.local_player_slot:
		return
		
	var player: Player = players.get(slot)
	if not is_instance_valid(player):
		return
		
	player.global_position = new_position
	player.network_target_position = new_position
