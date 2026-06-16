extends RefCounted
class_name PowerupState

var powerup_id: int
var powerup_type: int
var position: Vector2

static func from_dict(data: Dictionary) -> PowerupState:
	var state := PowerupState.new()
	
	state.powerup_id = int(data["powerup_id"])
	
	state.powerup_type = int(data["powerup_type"])
	
	state.position = Vector2(
		float(data["position_x"]),
		float(data["position_y"])
	)
	
	return state
