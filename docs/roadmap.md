_Grouped by priority, unordered otherwise._

# Higher Priority Features

## User themes/dark mode

I guess light/dark mode might be a nice easy win for an hour or so work.

See (closed) [Issue #173](https://github.com/jt196/vanilla-cookbook/issues/173)

## Parsing the Text For Ingredients

e.g. "Add 1 litre of water to the pan" gets scaled to "Add 2 litres...".

I can see the logic in this, and it does fit in with the minimal intervention aesthetic.

See (closed) [Issue #94](https://github.com/jt196/vanilla-cookbook/issues/94)

## Adding a Note to the Log

Not totally sure about this, it might be a bit overkill, but it could be useful to see what went wrong etc and have a little note next to it.

See (closed) [Issue #176](https://github.com/jt196/vanilla-cookbook/issues/176)

## Markdown Text Shortcuts

Simple text editing features like ctrl + i for italic, bullet/numbered lists etc.

This does fit in with the aesthetic of text edit/markdown. GitHub has this, I guess there may be a lib for it.

See (closed) [Issue #191](https://github.com/jt196/vanilla-cookbook/issues/191)

## Backup Database

Options set in the user interface, or maybe the .env file?

Could also be run automatically on `prisma migrate` command?

Number of copies of db kept specified in .env or admin user table. I'd be tempted to keep it to the .env file.

See (closed) [Issue #194](https://github.com/jt196/vanilla-cookbook/issues/194)

# Medium Priority

## Categories

I know, it's a shitshow right now. I've half a mind to just remove them frankly.

This is terrible on mobile right now, I think it needs simplification - perhaps a simpler method, like text filtering/scrolling.

    Checkbox next to each category
    User checks the category they want to move
    Then the user is presented with the list (minus their category)
    They check another item to make it the parent
    User can filter the list if they want
    Confirm make parent button

I don't want to faff around with the Category edit on the new recipe or edit page, but when we want to add some, save and add a back option to the category edit page.

See (closed) [Issue #126](https://github.com/jt196/vanilla-cookbook/issues/126)

## Browser Extensions

We already have a bookmarklet, but how hard can it be to code a simple extension with an option for the URL of your server, possibly even popping up the new recipe page inline.

See (closed) [Issue #142](https://github.com/jt196/vanilla-cookbook/issues/142)

- user sign in / enter credentials
- GitHub repo for Firefox and Chrome extensions
- specify domain
- add recipe
- go to recipe? Might be a bit heavy polling the backend every time you go to a new page though.

## Cook Mode

Parsing timing in directions etc. Not totally sure if I'd ever use this.

See (closed) [Issue #78](https://github.com/jt196/vanilla-cookbook/issues/78)

## Fork It! Recipe forking

I thought it might be nice to be able to fork recipes, and with a bunch of users, you could visualise this.

I practice, I'd have thought the system would only be used by 1-2 people, so may not be worth the work.

See (closed) [Issue #172](https://github.com/jt196/vanilla-cookbook/issues/172)

## Cookbook Library Stats

- Top 10 categories
- Top 10 sources - perhaps use the url base?
- Number of recipes
- Number of sources by URL

See (closed) [Issue #111](https://github.com/jt196/vanilla-cookbook/issues/111)

# Low Priority

## Ingredient List view

e.g. Similar to the recipe list page but with ingredients, infinite scroll, search, filter.

Click through to the a search of your recipes that has them.

I'm not sure about the value of this vs the hassle. I've got nearly 1000 recipes inside my instance, that's going to be a rather long page. Not accounting for duplicates etc.

See (closed) [Issue #83](https://github.com/jt196/vanilla-cookbook/issues/83)

## Share Recipe with Specified Users

I guess a table to say who can see a recipe or not? Very very far down the line though...

See (closed) [Issue #167](https://github.com/jt196/vanilla-cookbook/issues/167)
