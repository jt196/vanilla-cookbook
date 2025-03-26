# Ingredients

As the ingredient parser is an important part of the way that Vanilla works, there's a separate part of the manual dedicated to it.

Each ingredient line is analysed by the system and separated into 4 different sections:

- Quantity
- Unit
- Ingredient
- Extra

In practice, you won't really see much of this, except the **Quantity** shows up as bold, the _Unit_ shows up as italic, and the Ingredient in regular font.

## Quantity

_tldr;_ scale your recipe, with a variety of formats!

This can be:

A number/decimal or range with an optional fraction and unit joined, or with a space. e.g.

- 4 vanilla beans (number) => **4** vanilla beans
- 4.5 vanilla beans (decimal) => **4.5** vanilla beans
- 4-5 vanilla beans (range) => **4-5** vanilla beans
- 1 tsp vanilla essence (attached fraction) => **1** _teaspoon_ vanilla essence
- 1 ½ tbsp vanilla essence (spaced fraction) => **1.5** _tablespoons_ vanilla essence

The parser will normalise any fractions to decimals e.g.

**1½** and **1 ½** will become **1.5**.

The parser will attempt process any ranges in the ingredient line as well, e.g. **4-5** vanilla beans.

"What's the point in all this?" I hear you say! When we identify the numbers, we can run calculations with them, e.g. scale recipes.

## Units

Units of measurement, e.g.

- gram
- ounce
- pint
- cup

If you want to dig under the hood, have a look at the [lang.eng.js](https://github.com/jt196/recipe-ingredient-parser/blob/main/src/i18n/lang.eng.js) file from the parser module.

```js
const units = {
    ...
    bottle: ['bottle', 'btl', 'btl.'],
    container: ['container', 'cont', 'cont.'],
    cup: ['cup', 'c', 'c.'],
    kilogram: ['kilogram', 'kg', 'kg.'],
    stick: ['stick', 'sticks'],
    tablespoon: ['tablespoon', 'tbs', 'tbsp', 'tbspn', 'tbs.', 'tbsp.', 'tbspn.'],
    ...
}
```

We're basically looking for units like can, cup, stick, then **normalising** them with a standard unit, e.g.

- **1** _btl_ milk => **1** _bottle_ milk.
- **1** _kg_ sugar => **1** _kilogram_ sugar.

The idea being, if we know what to expect in the ingredients, they're easier to read and manipulate.

### Plurals

When the quantity is over 1, the units will return as plural, e.g.

- 1 tsp sugar => **1** _teaspoon_ sugar
- 2 tsp sugar => **2** _teaspoons_ sugar

### Languages

_tldr;_ change your default language in the user settings.

Obviously, different units and even numbers look different depending on your native tongue.

- **1.5** _kilogram_ potatoes in German => **1,5** _Kilogramm_ Kartoffeln

The above ingredients need to be interpreted differently, depending on what language they're in.

In our user [options](usage.md#settings), we need to set the language to the one closest to our mother tongue, or turn off parsing altogether (check **Display Original** in the settings, or individual recipe).

If your native language isn't supported, hit me up with an [issue](https://github.com/jt196/vanilla-cookbook/issues) and I'll try to get it added asap.

Have a look at this demo for an example of language switching:

<video width="640" height="360" controls>
  <source src="../../videos/lang_settings.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>

## Ingredient and Extra

_tldr;_ the bit that goes after the ingredient, hidden by default.

I'll talk about these together, as they're intrinsically related.

A common pattern of recipes is to include any instructions or specifics after the recipe in brackets, or separated by one or more commas, e.g.

- 1 cup of sugar, granulated => **1** _cup_ sugar _| granulated_
- 1 cup of sugar, granulated, caster is fine. => **1** _cup_ sugar _| granulated, caster is fine._
- 200g flour (sifted) => **200** _grams_ flour _| sifted_

You'll also notice that the "of" has been removed, yep, it's doing that. All in the interest of brevity = readability.

By default, the Extra is hidden, to allow for a clean ingredients list. You can change the default setting in the user [options](usage.md#settings) section.

### Parsing Errors

If your ingredients are looking a bit wonky, then this is likely the cause of it. Our parser doesn't like:

- Ingredient separated from unit by comma: "1 teaspoon, sugar"
- Double brackets: "1 cup water (bottled water is great, pond water is best (muddier the better))"

I'll try to add to more of these (or fix the parsing error) as and when they come up.

If it's truly borked and you don't want to edit the recipe, just check **Display Original**.

## Conversion

_tldr;_ Set your default measurement system in the settings, or change it in the dropdown below the ingredients. Metric, imperial are supported well, US Cups/Volumetric is supported, kind of.

At the bottom of the ingredients section is a rather nifty feature, ingredient conversion.

Weight and volumes of liquid are easy enough to convert from one system to another as they involve relatively simple calculations. US Volumetric is it's own headache for most of us non-American users. So many of the internet's recipes use this, so I wanted to find a way to convert them. It turns out to be non-trivial, but it's working, kinda.

- **US Cups to Metric** - Measurement Dropdown

- 1 cup vegetable oil => **216** _grams_ vegetable oil | _Vegetable oil (216 g/cup)_

That last bit isn't the extra, but the **Cup Match** - unchecked by default, I've included it so folks can feel reassured that they're not adding an incorrect match to their baking recipe.

"How do you perform this feat of conjuring"? I hear you ask!

First we figure out the measurement system from the units contained within the ingredients.

- grams + kilograms + litres => **Metric**
- pounds + ounces + fluid ounces => **Imperial**
- cups => **US Cups**

If they're mixed, it'll try and get the system by counting the instances of each one belonging to whatever category, e.g. grams _ 2, cups _ 1 => metric. If they're equal, it'll get a bit confused. They shouldn't be there anyway, so take them out!

Note, teaspoons/tablespoons is system agnostic, as many folks use them for smaller ingredient quantities in recipes. However, if the system is found to be **US Cups**, it will attempt to convert them to grams. You can prevent this behaviour by checking **Use teaspoons and tablespoons instead of grams.** in the user settings.

Once we have a **Measurement System**, we can work out what conversion to do. Select the system you want to use in the dropdown (or select a default in the user options), and watch Vanilla perform its magic.

What we have is a big list of ingredients, and their approximate volumetric weight in grams, we can use this to run the conversion. It'll help if the ingredient is as simple as possible to run this. If it fails, it'll use the default weight, which is the cup weight of water, or 237g, you'll see an asterisk.

- 1 cup Madagascan weeping bee honey => **237** _grams_ Madagascan weeping bee honey \*
- 1 cup honey => **336** _grams_ honey | _Honey (336 g/cup)_

* Converted using default water density

As you can see the longer honey ingredient failed. If you want it to work better, just move the extra bit to after a comma or in brackets:

- 1 cup honey, Madagascan weeping bee => **336** _grams_ honey _| Madagascan weeping bee | Honey (336 g/cup)_
