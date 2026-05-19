extends Node

@export var left_action: String = "p1_left"
@export var right_action: String = "p1_right"
@export var jump_action: String = "p1_jump"
@export var shoot_action: String = "p1_shoot"

var move_input: float = 0.0
var jump_pressed: bool = false
var jump_held: bool = false
var shoot_pressed: bool = false

func process_input():
	move_input = Input.get_axis(left_action, right_action)
	jump_pressed = Input.is_action_just_pressed(jump_action)
	jump_held = Input.is_action_pressed(jump_action)
	shoot_pressed = Input.is_action_just_pressed(shoot_action)
