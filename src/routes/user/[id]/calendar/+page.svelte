<script>
	import Calendar from '@event-calendar/core'
	import TimeGrid from '@event-calendar/time-grid'
	import '@event-calendar/core/index.css'

	let plugins = [TimeGrid]
	let options = {
		view: 'timeGridWeek',
		events: [
			// your list of events
		]
	}
</script>

<Calendar {plugins} {options} />
