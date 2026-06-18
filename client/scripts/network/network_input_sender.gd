extends Node

func send_input(snapshot: InputSnapshot, player_slot: int) -> void:
	var payload := snapshot.to_dict()
	
	payload["type"] = "player_input"
	payload["player_slot"] = player_slot
	
	MockMatchServer.receive_input(payload)
