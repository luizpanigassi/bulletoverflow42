extends Node

var packet_count := 0
var position := Vector2(100, 200)
var next_powerup_id := 1

const MOVE_SPEED := 300.0
const TICK := 1.0/60.0

func _ready() -> void:
	pass

func receive_input(data: Dictionary) -> void:
	position += Vector2(data["move_x"], data["move_y"]) * MOVE_SPEED * TICK
	
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

func spawn_mock_powerup() -> void:
	var packet := {
		"type": "powerup_spawn",
		"powerup_id": next_powerup_id,
		"powerup_type": PowerupTypes.Type.SHIELD,
		"position_x": 500,
		"position_y": 300
	}
	
	next_powerup_id += 1
	GameEvents.match_event_received.emit(packet)

func remove_mock_powerup(powerup_id: int) -> void:
	GameEvents.match_event_received.emit({
		"type": "powerup_removed",
		"powerup_id": powerup_id
	})

func spawn_mock_projectile() -> void:
	GameEvents.match_event_received.emit({
		"type": "projectile_spawn",
		"projectile_id": "proj_01",
		"owner_slot": 1,
		"position_x": 400,
		"position_y": 300,
		
		"direction_x": 1,
		"direction_y": 0,
		
		"speed": 500
	})
