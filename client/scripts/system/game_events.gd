extends Node

signal match_event_received(data)

signal match_started(data)
signal round_started(data)

signal player_spawned(data)
signal player_state_updated(state)

signal entity_wrapped(player_slot: int, new_position: Vector2)

signal player_died(player_id)

signal projectile_spawn(data)
signal projectile_destroy(projectile_id)

signal powerup_spawned(state)
signal powerup_collected(data)
signal powerup_removed(powerup_id)

signal round_ended(winner_id)
signal score_updated(state)
signal match_ended(state)
