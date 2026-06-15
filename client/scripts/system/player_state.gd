extends Resource
class_name PlayerState

@export var player_slot: int
@export var position: Vector2
@export var velocity: Vector2

@export var aim_direction: Vector2

@export var hp: int = 1
@export var shield_active: bool = false


func to_dict() -> Dictionary:
	return {
		"player_slot": player_slot,
		
		"position_x": position.x,
		"position_y": position.y,
		
		"velocity_x": velocity.x,
		"velocity_y": velocity.y,
		
		"aim_x": aim_direction.x,
		"aim_y": aim_direction.y,
		
		"hp": hp,
		"shield_active": shield_active,
	}

static func from_dict(data: Dictionary) -> PlayerState:
	var state := PlayerState.new()
	
	state.player_slot = int(data.get("player_slot", 0))
	
	state.position = Vector2(
		float(data.get("position_x", 0.0)),
		float(data.get("position_y", 0.0))
		)
	
	state.velocity = Vector2(
		float(data.get("velocity_x", 0.0)),
		float(data.get("velocity_y", 0.0))
	)
	
	state.aim_direction = Vector2(
		float(data.get("aim_x", 0.0)),
		float(data.get("aim_y", 0.0))
	)
	
	state.hp = int(data.get("hp", 1))
	state.shield_active = bool(data.get("shield_active", false))
	
	return state
