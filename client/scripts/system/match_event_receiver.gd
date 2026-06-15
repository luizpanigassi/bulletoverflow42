extends Node

func receive_event(data: Dictionary) -> void:
	var type: String = data.get("type", "")
	
	match type:
		"match_start":
			_handle_match_start(data)
			
		"round_start":
			_handle_round_start(data)
			
		"player_spawn":
			_handle_player_spawn(data)
		
		"player_died":
			_handle_player_died(data)
		
		"powerup_spawn":
			_handle_powerup_spawn(data)
			
		"powerup_collected":
			_handle_powerup_collected(data)
			
		"round_end":
			_handle_round_end(data)
			
		"match_end":
			_handle_match_end(data)
			
		"score_update":
			_handle_score_update(data)

func _handle_match_start(data: Dictionary) -> void:
	pass

func _handle_round_start(data: Dictionary) -> void:
	pass
	
func _handle_player_spawn(data: Dictionary) -> void:
	pass
	
func _handle_player_died(data: Dictionary) -> void:
	GameEvents.player_died.emit(int(data["player_slot"]))

func _handle_powerup_spawn(data: Dictionary) -> void:
	pass
	
func _handle_powerup_collected(data: Dictionary) -> void:
	pass
	
func _handle_round_end(data: Dictionary) -> void:
	GameEvents.round_ended.emit(int(data["winner_slot"]))
	
func _handle_match_end(data: Dictionary) -> void:
	pass
	
func _handle_score_update(data: Dictionary) -> void:
	pass
