extends CanvasLayer

@onready var p1_score_label: Label = $Control/VBoxContainer/P1ScoreLabel
@onready var p2_score_label: Label = $Control/VBoxContainer2/P2ScoreLabel
@onready var p1_ammo_label: Label = $Control/VBoxContainer/P1AmmoLabel
@onready var p2_ammo_label: Label = $Control/VBoxContainer2/P2AmmoLabel

func update_score(player1_score: int, player2_score: int) -> void:
	p1_score_label.text = "P1 Score: %d" %player1_score
	p2_score_label.text = "P2 Score: %d" %player2_score
	
func update_ammo(player_id: int, ammo: int) -> void:
	if player_id == 1:
		p1_ammo_label.text = "AMMO: %d" % ammo
	elif player_id == 2:
		p2_ammo_label.text = "AMMO: %d" % ammo
