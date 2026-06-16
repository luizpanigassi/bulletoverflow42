extends RefCounted
class_name ProjectileState

@export var projectile_id: String = ""
@export var owner_slot: int = 0

@export var position: Vector2
@export var direction: Vector2
@export var speed: float = 0.0

func to_dict() -> Dictionary:
	return {
		"projectile_id": projectile_id,
		"owner_slot": owner_slot,
		
		"position_x": position.x,
		"position_y": position.y,
		
		"direction_x": direction.x,
		"direction_y": direction.y,
		
		"speed": speed
	}
	
static func from_dict(data: Dictionary) -> ProjectileState:
	var state := ProjectileState.new()
	
	state.projectile_id = String(data.get("projectile_id", ""))
	state.owner_slot = int(data.get("owner_slot", 0))
	
	state.position = Vector2(
		float(data.get("position_x", 0.0)),
		float(data.get("position_y", 0.0))
	)
	
	state.direction = Vector2(
		float(data.get("direction_x", 0.0)),
		float(data.get("direction_y", 0.0))
	)
	
	state.speed = float(data.get("speed", 0.0))
	
	return state
