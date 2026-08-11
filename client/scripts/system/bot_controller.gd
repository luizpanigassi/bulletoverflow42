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
	if not is_instance_valid(controlled_player) or not is_instance_valid(target_player):
		return
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
	if not is_instance_valid(controlled_player) or not is_instance_valid(target_player):
		return
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
	if not is_instance_valid(controlled_player) or not is_instance_valid(target_player):
		return
	var snapshot := InputSnapshot.new()
	var to_target := target_player.global_position - controlled_player.global_position
	var distance := to_target.length()
	
	var time_to_hit := distance / BULLET_SPEED
	var predicted_pos := target_player.global_position + target_player.velocity * time_to_hit
	var aim_dir := (predicted_pos - controlled_player.global_position).normalized()
	snapshot.aim_direction = aim_dir
	
	var dodge_dir := _get_dodge_direction()
	
	var perp := Vector2(-to_target.normalized().y, to_target.normalized().x)
	var orbit := perp * sin(Time.get_ticks_msec() * 0.003)
	var base_move: Vector2
	if distance > OPTIMAL_DISTANCE + 50:
		base_move = to_target.normalized()
	elif distance < OPTIMAL_DISTANCE - 50:
		base_move = -to_target.normalized()
	else:
		base_move = orbit
	
	if dodge_dir != Vector2.ZERO:
		snapshot.move_direction = dodge_dir
		snapshot.dash_pressed = true
	else:
		var powerup_dir := _get_nearest_powerup_direction()
		var move := (base_move + orbit * 0.5).normalized()
		if powerup_dir != Vector2.ZERO:
			move = (move + powerup_dir * 0.4).normalized()
		snapshot.move_direction = move
		
	var raw_dir := to_target.normalized()
	if aim_dir.dot(raw_dir) > AIM_DOT_HARD:
		snapshot.shoot_pressed = true
		
	if controlled_player.current_ammo == 0:
		snapshot.reload_pressed = true
	
	controlled_player.set_external_input(snapshot)

func _get_dodge_direction() -> Vector2:
	for p in get_tree().get_nodes_in_group("projectiles"):
		if not is_instance_valid(p):
			continue
		var proj := p as Node2D
		if proj == null:
			continue
		if proj.get("owner_id") == controlled_player.player_id:
			continue
		var to_bot := controlled_player.global_position - proj.global_position
		if to_bot.length() > DODGE_RANGE:
			continue
		var proj_dir: Vector2 = proj.get("direction") if proj.get("direction") != null else Vector2.ZERO
		if proj_dir == Vector2.ZERO:
			continue
		if proj_dir.dot(to_bot.normalized()) > 0.6:
			return to_bot.normalized().rotated(PI / 2)
	return Vector2.ZERO
		
func _get_nearest_powerup_direction() -> Vector2:
	var powerups := get_tree().get_nodes_in_group("powerups")
	if powerups.is_empty():
		return Vector2.ZERO
	var nearest: Node2D = null
	var nearest_dist := INF
	for p in powerups:
		if not is_instance_valid(p):
			continue
		var d := controlled_player.global_position.distance_to((p as Node2D).global_position)
		if d > nearest_dist:
			nearest_dist = d
			nearest = p as Node2D
	if nearest == null or nearest_dist > 500.0:
		return Vector2.ZERO
	return(nearest.global_position - controlled_player.global_position).normalized()
	
