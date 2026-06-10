extends CanvasLayer

@onready var p1_score_label: Label = $Control/VBoxContainer/P1ScoreLabel
@onready var p2_score_label: Label = $Control/VBoxContainer2/P2ScoreLabel

func update_score(player1_score: int, player2_score: int) -> void:
	p1_score_label.text = "P1 Score: %d" %player1_score
	p2_score_label.text = "P2 Score: %d" %player2_score
