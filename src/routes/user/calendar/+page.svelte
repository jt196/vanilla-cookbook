<script>
	import Calendar from '@event-calendar/core'
	import TimeGrid from '@event-calendar/time-grid'
	import DayGrid from '@event-calendar/day-grid'
	import List from '@event-calendar/list'
	import '@event-calendar/core/index.css'

	export let data
	console.log('🚀 ~ data:', data)

	function parseLogs() {
		const events = data.logs.map((item) => {
			const cookedDate = new Date(item.cooked)
			return {
				start: cookedDate,
				end: new Date(cookedDate.getTime() + 10800000), // add 1 hour
				resourceId: item.id,
				title: {
					html: '<a href="/recipe/' + item.recipe.uid + '/view">' + item.recipe.name + '</a>'
				}
			}
		})
		return events
	}

	let plugins = [TimeGrid, DayGrid, List]
	let options = {
		view: 'timeGridWeek',
		events: parseLogs(),
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
		},
		scrollTime: '09:00:00',
		views: {
			timeGridWeek: { pointer: true },
			resourceTimeGridWeek: { pointer: true }
		},
		dayMaxEvents: true,
		nowIndicator: true,
		selectable: true
	}

	function createEvents() {
		let days = []
		for (let i = 0; i < 7; ++i) {
			let day = new Date()
			let diff = i - day.getDay()
			day.setDate(day.getDate() + diff)
			days[i] = day.getFullYear() + '-' + _pad(day.getMonth() + 1) + '-' + _pad(day.getDate())
		}

		return [
			{ start: days[0] + ' 00:00', end: days[0] + ' 09:00', resourceId: 1, display: 'background' },
			{ start: days[1] + ' 12:00', end: days[1] + ' 14:00', resourceId: 2, display: 'background' },
			{ start: days[2] + ' 17:00', end: days[2] + ' 24:00', resourceId: 1, display: 'background' },
			{
				start: days[0] + ' 10:00',
				end: days[0] + ' 14:00',
				resourceId: 1,
				title: 'The calendar can display background and regular events',
				color: '#FE6B64'
			},
			{
				start: days[1] + ' 16:00',
				end: days[2] + ' 08:00',
				resourceId: 2,
				title: 'An event may span to another day',
				color: '#B29DD9'
			},
			{
				start: days[2] + ' 09:00',
				end: days[2] + ' 13:00',
				resourceId: 2,
				title:
					'Events can be assigned to resources and the calendar has the resources view built-in',
				color: '#779ECB'
			},
			{
				start: days[3] + ' 14:00',
				end: days[3] + ' 20:00',
				resourceId: 1,
				title: '',
				color: '#FE6B64'
			},
			{
				start: days[3] + ' 15:00',
				end: days[3] + ' 18:00',
				resourceId: 1,
				title: 'Overlapping events are positioned properly',
				color: '#779ECB'
			},
			{
				start: days[5] + ' 10:00',
				end: days[5] + ' 16:00',
				resourceId: 2,
				title: { html: 'You have complete control over the <i><b>display</b></i> of events…' },
				color: '#779ECB'
			},
			{
				start: days[5] + ' 14:00',
				end: days[5] + ' 19:00',
				resourceId: 2,
				title: '…and you can drag and drop the events!',
				color: '#FE6B64'
			},
			{
				start: days[5] + ' 18:00',
				end: days[5] + ' 21:00',
				resourceId: 2,
				title: '',
				color: '#B29DD9'
			},
			{
				start: days[1],
				end: days[3],
				resourceId: 1,
				title: 'All-day events can be displayed at the top',
				color: '#B29DD9',
				allDay: true
			}
		]
	}

	function _pad(num) {
		let norm = Math.floor(Math.abs(num))
		return (norm < 10 ? '0' : '') + norm
	}
</script>

<Calendar {plugins} {options} />
