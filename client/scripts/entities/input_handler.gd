extends Node
class_name InputHandler

const InputSnapshotRef = preload("res://client/scripts/system/input_snapshot.gd")

@export_range(1, 4, 1) var player_id: int = 1

var left_action: String = ""
var right_action: String = ""
var jump_action: String = ""
var shoot_action: String = ""
var dash_action: String = ""
var reload_action: String = ""
var up_action: String = ""
var down_action: String = ""
var move_input: float = 0.0
var move_vector: Vector2 = Vector2.ZERO
var move_direction: Vector2 = Vector2.ZERO
var last_move_direction: Vector2 = Vector2.RIGHT
var jump_pressed: bool = false
var jump_held: bool = false
var shoot_pressed: bool = false
var dash_pressed: bool = false
var reload_pressed: bool = false
var aim_direction: Vector2 = Vector2.ZERO
var prev_pressed: bool = false
var next_pressed: bool = false
var confirm_pressed: bool = false
@onready var player_node: Node2D = get_parent() as Node2D

func _ready() -> void:
	_apply_mapping()
	
func set_player_id(value: int) -> void:
	player_id = value
	_apply_mapping()
	
func _apply_mapping() -> void:
	var prefix: String = "p%d" % player_id
	left_action = "%s_left" % prefix
	right_action = "%s_right" % prefix
	jump_action = "%s_jump" % prefix
	shoot_action = "%s_shoot" % prefix
	dash_action = "%s_dash" % prefix
	reload_action = "%s_reload" % prefix
	up_action = "%s_up" % prefix
	down_action = "%s_down" % prefix

func process_input() -> void:
	var horizontal: float = Input.get_axis(left_action, right_action)
	var vertical: float = Input.get_axis(up_action, down_action)
	
	move_input = horizontal
	move_vector = Vector2(horizontal, vertical)
	if move_vector != Vector2.ZERO:
		move_direction = move_vector.normalized()
		last_move_direction = move_direction
	else:
		move_direction = Vector2.ZERO
	shoot_pressed = Input.is_action_just_pressed(shoot_action)
	dash_pressed = Input.is_action_just_pressed(dash_action)
	reload_pressed = Input.is_action_just_pressed(reload_action)
	
	if player_node:
		var mouse_position: Vector2 = player_node.get_global_mouse_position()
		var mouse_direction: Vector2 = mouse_position - player_node.global_position
		aim_direction = mouse_direction.normalized()
	else:
		aim_direction = Vector2.ZERO
	
	prev_pressed = Input.is_action_just_pressed(left_action)
	next_pressed = Input.is_action_just_pressed(right_action)
	confirm_pressed = Input.is_action_just_pressed(dash_action)
	move_input = horizontal

func get_snapshot() -> InputSnapshot:
	var snapshot := InputSnapshotRef.new()
	
	snapshot.move_direction = move_direction
	snapshot.last_move_direction = last_move_direction
	snapshot.aim_direction = aim_direction
	snapshot.shoot_pressed = shoot_pressed
	snapshot.dash_pressed = dash_pressed
	snapshot.reload_pressed = reload_pressed
	snapshot.prev_pressed = prev_pressed
	snapshot.next_pressed = next_pressed
	snapshot.confirm_pressed = confirm_pressed
	return snapshot
