extends Resource
class_name InputSnapshot

var move_direction: Vector2 = Vector2.ZERO
var last_move_direction: Vector2 = Vector2.RIGHT
var aim_direction: Vector2 = Vector2.ZERO
var shoot_pressed: bool = false
var dash_pressed: bool = false
var reload_pressed: bool = false
var jump_pressed: bool = false
var jump_held: bool = false
var prev_pressed: bool = false
var next_pressed: bool = false
var confirm_pressed: bool = false

func to_dict() -> Dictionary:
	return {
		"move_x": move_direction.x,
		"move_y": move_direction.y,
		
		"aim_x": aim_direction.x,
		"aim_y": aim_direction.y,
		
		"shoot": shoot_pressed,
		"dash": dash_pressed,
		"reload": reload_pressed,
	}

static func from_dict(data: Dictionary) -> InputSnapshot:
	var snapshot := InputSnapshot.new()
	
	snapshot.move_direction = Vector2(
		float(data.get("move_x", 0.0)),
		float(data.get("move_y", 0.0))
	)
	
	snapshot.aim_direction = Vector2(
		float(data.get("aim_x", 0.0)),
		float(data.get("aim_y", 0.0))
	)
	
	snapshot.shoot_pressed = bool(data.get("shoot", false))
	snapshot.dash_pressed = bool(data.get("dash", false))
	snapshot.reload_pressed = bool(data.get("reload", false))
	
	return snapshot
