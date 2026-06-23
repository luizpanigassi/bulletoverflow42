extends Node

func send_input(snapshot: InputSnapshot, player_slot: int) -> void:
	if MatchData.session == null:
		return
	
	var payload := snapshot.to_dict()
	var seq = PlayerInputBuffer.register_input(snapshot)
	
	payload["seq"] = seq
	payload["type"] = "player_input"
	payload["player_slot"] = player_slot
	
	if MatchData.session and MatchData.session.mode == &"online":
		if NetworkClient.is_network_connected:
			NetworkClient.send_message(payload)
		else:
			MockMatchServer.receive_input(payload)
	else:
		MockMatchServer.receive_input(payload)

func is_bot_match() -> bool:
	return MatchData.session and MatchData.session.game_type == &"vs_bot"
