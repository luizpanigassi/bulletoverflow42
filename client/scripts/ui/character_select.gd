extends Control

@onready var p1_character_name: Label = $P1Panel/P1CharacterName
@onready var p2_character_name: Label = $P2Panel/P2CharacterName
@onready var p1_ready_label: Label = $P1Panel/P1ReadyLabel
@onready var p2_ready_label: Label = $P2Panel/P2ReadyLabel
@onready var p1_prev_button: Button = $P1Panel/HBoxContainer/P1Prev
@onready var p2_prev_button: Button = $P2Panel/HBoxContainer/P2Prev
@onready var p1_next_button: Button = $P1Panel/HBoxContainer/P1Next
@onready var p2_next_button: Button = $P2Panel/HBoxContainer/P2Next
@onready var p1_ready_button: Button = $P1Panel/P1Ready
@onready var p2_ready_button: Button = $P2Panel/P2Ready
@onready var start_match_button: Button = $StartButton
@onready var input_handler_p1: Node = $InputHandlerP1
@onready var simulate_online_button: Button = $SimulateOnlineButton
@onready var p1_username_input: LineEdit = $P1Panel/P1UsernameInput
@onready var p2_username_input: LineEdit = $P2Panel/P2UsernameInput

@export var player_id: int = 1

var characters: Array[CharacterData] = []

var p1_index: int = 0
var p2_index: int = 0
var p1_ready: bool = false
var p2_ready: bool = false

func _ready() -> void:
	characters = [
		preload("res://client/data/resources/characters/adventurer.tres"),
		preload("res://client/data/resources/characters/crimson_warrior.tres"),
		preload("res://client/data/resources/characters/explorer.tres"),
	]
	
	input_handler_p1.set_player_id(1)
		
	p1_prev_button.pressed.connect(_on_p1_prev_pressed)
	p1_next_button.pressed.connect(_on_p1_next_pressed)
	p1_ready_button.pressed.connect(_on_p1_ready_pressed)
	
	p2_prev_button.pressed.connect(_on_p2_prev_pressed)
	p2_next_button.pressed.connect(_on_p2_next_pressed)
	p2_ready_button.pressed.connect(_on_p2_ready_pressed)
	
	start_match_button.pressed.connect(try_start_match)
	simulate_online_button.pressed.connect(_on_simulate_online_pressed)
	
	update_ui()

	MatchData.load_session_from_web()

func _process(_delta: float) -> void:
	input_handler_p1.process_input()
	
	if input_handler_p1.prev_pressed:
		_on_p1_prev_pressed()
	elif input_handler_p1.next_pressed:
		_on_p1_next_pressed()
		
	if input_handler_p1.confirm_pressed:
		_on_p1_ready_pressed()

#p1 buttons
func _on_p1_prev_pressed() -> void:
	if p1_ready:
		return
	p1_index = wrapi(p1_index - 1, 0, characters.size())
	update_ui()
	
func _on_p1_next_pressed() -> void:
	if p1_ready:
		return
	p1_index = wrapi(p1_index + 1, 0, characters.size())
	update_ui()
	
func _on_p1_ready_pressed() -> void:
	p1_ready = not p1_ready
	update_ui()

#p2 buttons
func _on_p2_prev_pressed() -> void:
	if p2_ready:
		return
	p2_index = wrapi(p2_index - 1, 0, characters.size())
	update_ui()
	
func _on_p2_next_pressed() -> void:
	if p2_ready:
		return
	p2_index = wrapi(p2_index + 1, 0, characters.size())
	update_ui()
	
func _on_p2_ready_pressed() -> void:
	p2_ready = not p2_ready
	update_ui()
	
func update_ui() -> void:
	p1_character_name.text = characters[p1_index].character_name
	p2_character_name.text = characters[p2_index].character_name
	
	p1_ready_label.text = "READY!" if p1_ready else "NOT READY"
	p2_ready_label.text = "READY!" if p2_ready else "NOT READY"

	p1_prev_button.disabled = p1_ready
	p1_next_button.disabled = p1_ready
	p2_prev_button.disabled = p2_ready
	p2_next_button.disabled = p2_ready

	start_match_button.disabled = not p1_ready or not p2_ready

func try_start_match() -> void:
	if not p1_ready or not p2_ready:
		return
		
	var username_p1 := p1_username_input.text.strip_edges()
	var username_p2 := p2_username_input.text.strip_edges()
	if username_p1.is_empty():
		username_p1 = "Player 1"
		
	if username_p2.is_empty():
		username_p2 = "Player 2"

	MatchData.set_local_session(
		characters[p1_index].character_id,
		characters[p2_index].character_id,
		username_p1,
		username_p2
	)

	get_tree().change_scene_to_file("res://client/scenes/game.tscn")

func _on_simulate_online_pressed() -> void:
	if not p1_ready or not p2_ready:
		return
		
	var username_p1 := p1_username_input.text.strip_edges()
	var username_p2 := p2_username_input.text.strip_edges()
	if username_p1.is_empty():
		username_p1 = "Player 1"
	if username_p2.is_empty():
		username_p2 = "Player 2"
	
	MatchData.set_online_session_mock(
		characters[p1_index].character_id,
		characters[p2_index].character_id,
		1,
		username_p1,
		username_p2
	)

	get_tree().change_scene_to_file("res://client/scenes/game.tscn")
