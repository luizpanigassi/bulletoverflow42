extends RefCounted
class_name RoundState

var winner_slot: int

static func from_dict(data: Dictionary) -> RoundState:
	var state := RoundState.new()
	
	state.winner_slot = int(data["winner_slot"])
	
	return state
