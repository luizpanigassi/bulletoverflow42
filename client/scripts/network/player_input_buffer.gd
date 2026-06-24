extends Node

var sequence: int = 0
var pending_inputs: Array = []

func register_input(snapshot: InputSnapshot) -> int:
	sequence += 1
	pending_inputs.append({
		"seq": sequence,
		"snapshot": snapshot
	})
	
	return sequence

func get_unacknowledged_inputs(last_seq: int) -> Array:
	var result: Array[InputSnapshot] = []
	var new_buffer: Array = []
	for input in pending_inputs:
		var seq: int = input["seq"]
		if seq > last_seq:
			result.append(input["snapshot"])
			new_buffer.append(input)
	
	pending_inputs = new_buffer
	return result
