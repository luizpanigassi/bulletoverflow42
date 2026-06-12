extends CanvasLayer

@onready var title_label = $TitleLabel
@onready var number_label = $NumberLabel

signal countdown_finished

func _ready() -> void:
	pass

func start_countdown() -> void:
	visible = true
	await get_tree().process_frame
	
	title_label.text = "Round starting in..."
	
	for number in [3, 2, 1]:
		number_label.text = str(number)
		await get_tree().create_timer(1.0).timeout
		
	title_label.text = "OVERFLOW!"
	number_label.text = ""
	
	await get_tree().create_timer(0.5).timeout
	
	visible = false
	
	countdown_finished.emit()
