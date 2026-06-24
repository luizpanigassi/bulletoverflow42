extends Node

var elapsed: float = 0.0

var controlled_player: Player
var target_player: Player
var player_slot: int

func _physics_process(delta: float) -> void:
	elapsed += delta
	
	var pos: Vector2 = Vector2(600 + sin(elapsed) * 300, 300)
	GameEvents.match_event_received.emit({
		"type": "player_state",
		"player_slot": 2,
		"position_x": pos.x,
		"position_y": pos.y,
		"velocity_x": cos(elapsed) * 300,
		"velocity_y": 0
	})
