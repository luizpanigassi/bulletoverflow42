extends RefCounted
class_name MatchState

var player1_score: int
var player2_score: int
var winner_slot: int

static func from_dict(data: Dictionary) -> MatchState:
	var state := MatchState.new()
	
	state.player1_score = int(data["player1_score"])
	state.player2_score = int(data["player2_score"])
	state.winner_slot = int(data.get("winner_slot", 0))

	return state
