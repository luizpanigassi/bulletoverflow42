extends CanvasLayer

@onready var winner_label = $WinnerLabel
@onready var score_label = $ScoreLabel
@onready var special_label = $SpecialLabel

func show_round_result(winner_name: String, player_1_name: String, player_2_name: String, score_p1: int, score_p2: int) -> void:
	visible = true
	
	special_label.remove_theme_color_override("font_color")
	
	winner_label.text = "%s WINS THE ROUND!" % winner_name
	score_label.text = "%s: %d x %s 2: %d" % [player_1_name, score_p1, player_2_name, score_p2]
	
	special_label.text = ""
	
	if score_p1 == 4 and score_p2 == 4:
		special_label.add_theme_color_override("font_color", Color.RED)
		special_label.text = "FINAL ROUND!"
	elif score_p1 == 4 or score_p2 == 4:
		special_label.add_theme_color_override("font_color", Color.RED)
		special_label.text = "MATCH POINT!"
		
	
func hide_screen() -> void:
	visible = false
