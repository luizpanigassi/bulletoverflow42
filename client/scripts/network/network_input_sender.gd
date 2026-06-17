extends Node

func send_input(snapshot: InputSnapshot) -> void:
	var payload := snapshot.to_dict()
	
	payload["type"] = "player_input"
	
	MockMatchServer.receive_input(payload)
