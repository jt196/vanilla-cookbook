<script>
	import Calendar from '@event-calendar/core'
	import TimeGrid from '@event-calendar/time-grid'
	import DayGrid from '@event-calendar/day-grid'
	import Interaction from '@event-calendar/interaction'
	import List from '@event-calendar/list'
	import '@event-calendar/core/index.css'
	import { updateEventInBackend, deleteEventInBackend } from '$lib/utils/crud.js'

	/** @type {{data: any}} */
	let { data } = $props();

	let logs = data.logs
	let calendarInstance = $state()

	function parseLogs() {
		const events = logs.map((item) => {
			const cookedDate = new Date(item.cooked)
			// Add one hour to the above date if no end time is set
			const cookedDateEnd = item.cookedEnd
				? new Date(item.cookedEnd)
				: new Date(cookedDate.getTime() + 10800000)
			return {
				start: cookedDate,
				end: cookedDateEnd,
				resourceId: item.id,
				title: '<a href="/recipe/' + item.recipe.uid + '/view">' + item.recipe.name + '</a>'
			}
		})
		return events
	}

	let plugins = [TimeGrid, DayGrid, List, Interaction]
	let options = {
		view: 'timeGridWeek',
		events: parseLogs(),
		headerToolbar: {
			start: 'prev,next today',
			center: 'title',
			end: 'dayGridMonth,timeGridWeek,listWeek'
		},
		eventContent: function (info) {
			// Check if the current view is the 'dayGridMonth'
			if (info.view.type === 'dayGridMonth') {
				// Return simpler content for 'dayGridMonth' view
				return info.event.display === 'auto'
					? { html: `<div class="ec-event-title">${info.event.title}</div>` }
					: '';
			} else {
				// Return more detailed content for other views
					return info.event.display === 'auto'
						? {
							html: `<div class="ec-event-time">${info.timeText}</div>
								<button class="delete-btn">Delete</button>
								<div class="ec-event-title">${info.event.title}</div>`
						}
						: '';
				}
			},
		eventClick: function (info) {
			if (info.event.display === 'auto') {
				let btn = info.el.querySelector('.delete-btn');
				if (info.jsEvent.target === btn) {
					removeEvent(info.event.id, info.event.resourceIds[0]);
				}
			}
		},
		scrollTime: '09:00:00',
		views: {
			timeGridWeek: { pointer: true },
			resourceTimeGridWeek: { pointer: true }
		},
		dayMaxEvents: true,
		nowIndicator: true,
		pointer: false,
		eventDrop: handleEventDrop,
		eventResize: handleEventDrop
		// selectable: true // This is for creating new events with a drag selection
	}

	// Event handler for when an event is dropped to a new time
	function handleEventDrop(eventDropInfo) {
		// Extract the new start and end times, and the event's ID
		const { event } = eventDropInfo
		console.log('🚀 ~ handleEventDrop ~ event:', event)
		const newStart = event.start
		const newEnd = event.end
		const id = event.resourceIds[0]

		// Update the event in your backend
		updateEventInBackend(id, newStart, newEnd)
	}

    function removeEvent(eventId, logId) {
		deleteEventInBackend(logId)
        if (calendarInstance) {
            console.log("🚀 ~ removeEventById ~ event resource ID:", event)
			calendarInstance.removeEventById(eventId)
        }
    }

</script>

<Calendar {plugins} {options} bind:this={calendarInstance} />

