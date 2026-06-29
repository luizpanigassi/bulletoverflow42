extends Node

var controlled_player: Player
var target_player: Player
var difficulty: String = "easy"

const BULLET_SPEED := 700.0
const OPTIMAL_DISTANCE := 300.0
const DODGE_RANGE := 220.0
const AIM_DOT_MEDIUM := 0.85
const AIM_DOT_HARD := 0.92

func _process(_delta: float) -> void:
	if !is_instance_valid(controlled_player):
		return
		
	match difficulty:
		"easy": _process_easy()
		"medium": _process_medium()
		"hard": _process_hard()

func _process_easy() -> void:
	var snapshot := InputSnapshot.new()
	var to_target := target_player.global_position - controlled_player.global_position
	var dir := to_target.normalized()
	snapshot.aim_direction = dir
	
	if to_target.length() > 150:
		snapshot.move_direction = dir
	
	if randf() < 0.03:
		snapshot.shoot_pressed = true	
	controlled_player.set_external_input(snapshot)

func _process_medium() -> void:
	var snapshot := InputSnapshot.new()
	var to_target := target_player.global_position - controlled_player.global_position
	var distance := to_target.length()
	
	var time_to_hit := distance / BULLET_SPEED
	var predicted_pos := target_player.global_position + target_player.velocity * time_to_hit
	var aim_dir := (predicted_pos - controlled_player.global_position).normalized()
	snapshot.aim_direction = aim_dir
	
	var perp := Vector2(-to_target.normalized().y, to_target.normalized().x)
	var orbit := perp * sin(Time.get_ticks_msec() * 0.002)
	if distance > OPTIMAL_DISTANCE + 50:
		snapshot.move_direction = (to_target.normalized() + orbit * 0.5).normalized()
	elif distance < OPTIMAL_DISTANCE - 50:
		snapshot.move_direction = (-to_target.normalized() + orbit * 0.5).normalized()
	else:
		snapshot.move_direction = orbit.normalized() if orbit.length() > 0.01 else Vector2.RIGHT
		
	var raw_dir := to_target.normalized()
	if aim_dir.dot(raw_dir) > AIM_DOT_MEDIUM:
		snapshot.shoot_pressed = true
		
	if controlled_player.current_ammo == 0:
		snapshot.reload_pressed = true
		
	controlled_player.set_external_input(snapshot)
	
func _process_hard() -> void:
	var snapshot := InputSnapshot.new()
	var to_target := target_player.global_position - controlled_player.global_position
