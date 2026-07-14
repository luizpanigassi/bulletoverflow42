extends CanvasLayer

@onready var status_label: Label = $Panel/VBoxContainer/StatusLabel
@onready var claim_victory_button: Button = $Panel/VBoxContainer/ClaimVictoryButton

const FORFEIT_WAIT_SECONDS := 60.0

var _waiting: bool = false
var _elapsed: float = 0.0

func _ready() -> void:
	visible = false
	claim_victory_button.disabled = true
	claim_victory_button.pressed.connect(_on_claim_victory_pressed)
	
	GameEvents.opponent_disconnected.connect(_on_opponent_disconnected)
	GameEvents.player_state_updated.connect(_on_player_state_updated)
	
func _process(delta: float) -> void:
	if not _waiting:
		return
	
	_elapsed += delta
	var remaining := FORFEIT_WAIT_SECONDS - _elapsed
	
	if remaining <= 0.0:
		status_label.text = "Opponent disconnected. Click to claim your victory!"
		claim_victory_button.disabled = false
	else:
		status_label.text = "Opponent disconnected. Waiting for him... (%ds)" % int(ceil(remaining))
		
func _on_opponent_disconnected() -> void:
	_elapsed = 0.0
	_waiting = true
	visible = true
	claim_victory_button.disabled = true

func _on_player_state_updated(_data: Dictionary) -> void:
	if not _waiting:
		return
	
	_waiting = false
	visible = false
	claim_victory_button.disabled = true
	
func _on_claim_victory_pressed() -> void:
	claim_victory_button.disabled = true
	GameEvents.forfeit_victory_claimed.emit()
