extends CanvasLayer

@onready var winner_label = $WinnerLabel
@onready var score_label = $ScoreLabel
@onready var special_label = $SpecialLabel

func show_round_result(winner_id: int, score_p1: int, score_p2: int) -> void:
	visible = true
	
	winner_label.text = "PLAYER %d WINS THE ROUND!" % winner_id
	score_label.text = "Player 1: %d x Player 2: %d" % [score_p1, score_p2]
	
	special_label.text = ""
	
	if score_p1 == 4 and score_p2 == 4:
		special_label.text = "FINAL ROUND!"
	if score_p1 == 4 or score_p2 == 4:
		special_label.text = "MATCH POINT!"
	
func hide_screen() -> void:
	visible = false
