extends Node

func send_input(snapshot: InputSnapshot, player_slot: int) -> void:
	var payload := snapshot.to_dict()
	
	payload["type"] = "player_input"
	payload["player_slot"] = player_slot
	
	if MatchData.session and MatchData.session.mode == &"online":
		if NetworkClient.is_network_connected:
			NetworkClient.send_message(payload)
		else:
			MockMatchServer.receive_input(payload)
