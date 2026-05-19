extends Node

@export var left_action: String = "p1_left"
@export var right_action: String = "p1_right"
@export var jump_action: String = "p1_jump"
@export var shoot_action: String = "p1_shoot"
@export var dash_action: String = "p1_dash"
@export var reload_action: String = "p1_reload"
@export var up_action: String = "p1_up"
@export var down_action: String = "p1_down"

var move_input: float = 0.0
var jump_pressed: bool = false
var jump_held: bool = false
var shoot_pressed: bool = false
var dash_pressed: bool = false
var reload_pressed: bool = false
var aim_direction: Vector2 = Vector2.ZERO

func process_input():
	move_input = Input.get_axis(left_action, right_action)
	jump_pressed = Input.is_action_just_pressed(jump_action)
	jump_held = Input.is_action_pressed(jump_action)
	shoot_pressed = Input.is_action_just_pressed(shoot_action)
	dash_pressed = Input.is_action_just_pressed(dash_action)
	reload_pressed = Input.is_action_just_pressed(reload_action)
	
	var horizontal: float = Input.get_axis(left_action, right_action)
	var vertical: float = Input.get_axis(up_action, down_action)
	
	aim_direction = Vector2(horizontal, vertical).normalized()
	
	move_input = horizontal
