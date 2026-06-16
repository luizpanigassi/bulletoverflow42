extends Node

var packet_count := 0
var position := Vector2(100, 200)

func receive_input(data: Dictionary) -> void:
	position.x = float(data["move_x"]) * 5
	position.y = float(data["move_y"]) * 3
	
	var player_state := {
		"type": "player_state",
		"player_slot": 1,
		"position_x": position.x,
		"position_y": position.y,
		"velocity_x": 0,
		"velocity_y": 0,
		"aim_x": data["aim_x"],
		"aim_y": data["aim_y"]
	}
	
	GameEvents.match_event_received.emit(player_state)
