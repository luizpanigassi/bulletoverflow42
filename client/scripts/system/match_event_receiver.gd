extends Node

func _ready() -> void:
	GameEvents.match_event_received.connect(receive_event)
	NetworkClient.event_received.connect(receive_event)

func receive_event(data: Dictionary) -> void:
	var type: String = data.get("type", "")
	
	match type:
		"player_state":
			_handle_player_state(data)
			
		"match_start":
			_handle_match_start(data)
			
		"round_start":
			_handle_round_start(data)
			
		"player_spawn":
			_handle_player_spawn(data)
		
		"player_died":
			_handle_player_died(data)
		
		"projectile_spawn":
			_handle_projectile_spawn(data)
		
		"projectile_destroy":
			_handle_projectile_destroy(data)
		
		"powerup_spawn":
			_handle_powerup_spawn(data)
			
		"powerup_collected":
			_handle_powerup_collected(data)
			
		"powerup_removed":
			_handle_powerup_removed(data)
			
		"round_end":
			_handle_round_end(data)
			
		"match_end":
			_handle_match_end(data)
			
		"score_update":
			_handle_score_update(data)
			
		"player_wrapped":
			_handle_player_wrapped(data)
			
		"request_state_sync":
			GameEvents.state_sync_requested.emit()
		
		"state_sync":
			GameEvents.state_sync_received.emit(data)
			
		"opponent_disconnected":
			GameEvents.opponent_disconnected.emit()

func _handle_player_state(data: Dictionary) -> void:
	GameEvents.player_state_updated.emit(data)

func _handle_match_start(data: Dictionary) -> void:
	print("Match started! ID: ", data.get("match_id", "unknown"))
	if MatchData.session:
		MatchData.session.match_id = StringName(data.get("match_id", ""))
	GameEvents.match_started.emit(data)

func _handle_round_start(data: Dictionary) -> void:
	GameEvents.round_started.emit(data)
	
func _handle_player_spawn(data: Dictionary) -> void:
	GameEvents.player_spawned.emit(data)
	
func _handle_player_died(data: Dictionary) -> void:
	GameEvents.player_died.emit(int(data["player_slot"]))

func _handle_projectile_spawn(data: Dictionary) -> void:
	var state := ProjectileState.from_dict(data)
	
	GameEvents.projectile_spawn.emit(state)

func _handle_projectile_destroy(data: Dictionary) -> void:
	GameEvents.projectile_destroy.emit(String(data["projectile_id"]))

func _handle_powerup_spawn(data: Dictionary) -> void:
	var state := PowerupState.from_dict(data)
	
	GameEvents.powerup_spawned.emit(state)
	
func _handle_powerup_collected(data: Dictionary) -> void:
	var player_slot: int = int(data["player_slot"])
	var powerup_type: int = int(data["powerup_type"])

	GameEvents.powerup_collected.emit({
		"player_slot": player_slot,
		"powerup_type": powerup_type
	})
	
func _handle_powerup_removed(data: Dictionary) -> void:
	GameEvents.powerup_removed.emit(int(data["powerup_id"]))
	
func _handle_round_end(data: Dictionary) -> void:
	GameEvents.round_ended.emit(int(data["winner_slot"]))
	
func _handle_match_end(data: Dictionary) -> void:
	var state := MatchState.from_dict(data)
	
	GameEvents.match_ended.emit(state)
	
func _handle_score_update(data: Dictionary) -> void:
	var state := MatchState.from_dict(data)
	
	GameEvents.score_updated.emit(state)

func _handle_player_wrapped(data: Dictionary) -> void:
	var slot: int = int(data["player_slot"])
	var pos := Vector2(float(data["new_pos_x"]), float(data["new_pos_y"]))
	
	GameEvents.player_wrap_synced.emit(slot, pos)
