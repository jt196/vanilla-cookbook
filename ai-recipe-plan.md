# New/Edit Recipe Page

## AI Summaries

- the summarize directions can remove volumes or units in the directions, when they're not in the ingredients, one is left wondering what to do.
- In the clean ingredients, I've had some mixed units (e.g. cups/grams), perhaps a list needs providing based on the users units. Feel free to ask me about how to explore this.
- have an undo button against both the clean/summarize on the new/edit page if we're not happy with the results.
- Would it make sense to have just a new data field for these cleaned ingredients/summarized directions? If they exist, then display.
- We could easily restore them that way
- And perhaps we have a switch to show the long-form version of the directions on the recipe page?

## Spinners

- when the recipe is being scraped, the banner on the top should have some sort of spinner - I think at the moment it just appears.
- When the recipe is being saved, either new or edit, we should see a spinner overlay on the page, until it saves and the page redirect happens.
- We have a <Spinner> component for this.
