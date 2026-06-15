extends Node

func send_input(snapshot: InputSnapshot) -> void:
	var payload := {
		"type": "player_input",
		
		"move_x": snapshot.move_direction.x,
		"move_y": snapshot.move_direction.y,
		
		"aim_x": snapshot.aim_direction.x,
		"aim_y": snapshot.aim_direction.y,
		
		"shoot": snapshot.shoot_pressed,
		"dash": snapshot.dash_pressed,
		"reload": snapshot.reload_pressed,
	}
	
	print(JSON.stringify(payload))
	
