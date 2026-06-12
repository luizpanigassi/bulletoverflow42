extends Node

var controlled_player: Player
var target_player: Player

func _process(_delta: float) -> void:
	if !is_instance_valid(controlled_player):
		return
	
	if !is_instance_valid(target_player):
		return
		
	var snapshot := InputSnapshot.new()
	
	var dir := (target_player.global_position - controlled_player.global_position).normalized()
	
	var distance := controlled_player.global_position.distance_to(target_player.global_position)
	
	if distance > 150:
		snapshot.move_direction = dir
	else:
		snapshot.move_direction = Vector2.ZERO
	
	snapshot.aim_direction = dir
	
	if randf() < 0.03:
		snapshot.shoot_pressed = true
		
	controlled_player.set_external_input(snapshot)
