import fs from 'fs'
import path from 'path'
import axios from 'axios'
import pkg from 'js-beautify'
const { html: beautify } = pkg
import { urlToFilename } from './parseTesting.js'

/**
 * Recipe Downloader and Saver
 *
 * This script provides utilities for downloading and saving recipes from various websites.
 * It primarily focuses on extracting JSON-LD formatted recipe data, to save on space
 * but can also save the entire HTML content if needed.
 * If the page has already been downloaded, it'll skip the download.
 * The sites array is the list of sites it'll attempt to download
 * Currently this just contains the list of failing sites
 * These have been commented out for ease of debugging
 * sitePasses are all the sites that have passed tests
 * sitesCantFix are all the unfixable/unscrapable sites
 * siteErrors are the sites that failed to download
 * The recipeParse.test.js also uses the sites array for testing
 *
 * @module recipeDownloader
 *
 * @author Your Name
 * @version 1.0.0
 *
 * @tutorial
 * 1. Ensure you have all the required dependencies installed.
 * 2. Uncomment the sites.forEach at the bottom of this file
 * 3. Run the script from the command line: `node src/lib/utils/parse/downloadRecipes.js`
 * 4. The script will attempt to extract recipe data in JSON-LD format.
 * 5. If found, only the recipe data will be saved. Otherwise, the entire HTML content will be saved.
 * 6. The content will be saved in the 'src/lib/data/recipe_html' directory by default.
 */

// These are all passing the parsing tests
export const sitePasses = [
	'https://www.750g.com/gateau-au-yaourt-leger-et-moelleux-r60818.htm',
	'https://www.kingarthurbaking.com/recipes/grilled-flatbread-recipe',
	'https://www.allrecipes.com/recipe/239541/chef-johns-fresh-salmon-cakes/',
	'https://claudia.abril.com.br/receitas/canudinho-de-mousse-de-cocada-preta/',
	'https://www.acouplecooks.com/oatmeal-recipe/',
	'https://addapinch.com/skillet-lasagna-recipe/',
	'https://www.ah.nl/allerhande/recept/R-R1195141/beef-chimichurri',
	'https://alltommat.expressen.se/recept/lemon-posset-sotsyrlig-citrondessert/',
	'https://altonbrown.com/recipes/cottage-cheese-cheesecakes/',
	'https://amazingribs.com/best-barbecue-ribs-recipe/',
	'https://www.ambitiouskitchen.com/chickpea-apple-broccoli-salad-with-honey-dijon-dressing/',
	'https://www.archanaskitchen.com/mangalorean-style-lobia-gazzi-recipe-black-eyed-peas-in-coconut-curry-recipe',
	'https://www.arla.se/recept/ranchdressing/',
	'https://www.atelierdeschefs.fr/recettes/21192/aubergines-farcies-a-la-mozzarella/',
	'https://www.averiecooks.com/thai-chicken-coconut-curry/',
	'https://www.afghankitchenrecipes.com/recipe/kishmish-panir-cheese-and-raisins/',
	'https://www.baking-sense.com/2023/08/31/sourdough-banana-bread/',
	'https://bakingmischief.com/penne-alla-vodka-for-one/',
	'https://www.bbc.co.uk/food/recipes/meatballs_tomato_burrata_82300',
	'https://www.bbcgoodfood.com/recipes/super-smoky-bacon-tomato-spaghetti',
	'https://www.bettybossi.ch/de/Rezept/ShowRezept/BB_BBZG190815_0003A-40-de?title=Caponata-mit-Burrata',
	'https://www.bettycrocker.com/recipes/impossibly-easy-lasagna-pie/63877762-d0cb-4e42-ba7e-c64616f96dab',
	'https://biancazapatka.com/en/vegan-blueberry-cake/',
	'https://www.bigoven.com/recipe/blackberry-brie-grilled-cheese/3032640',
	'https://www.blueapron.com/recipes/glazed-pork-belly-ramen-noodles-with-corn-soft-boiled-eggs-miso-butter-sauce',
	'https://bluejeanchef.com/recipes/drunken-noodles/',
	'https://www.bonappetit.com/recipe/mac-n-cheese',
	'https://www.bodybuilding.com/content/spiced-pear-cookie-butter-proats.html',
	'https://www.bongeats.com/recipe/taaler-luchi',
	'https://www.bowlofdelicious.com/green-goddess-pasta-salad/',
	'https://www.budgetbytes.com/chicken-noodle-soup/',
	'https://www.castironketo.net/blog/keto-stuffed-peppers/',
	'https://www.cdkitchen.com/recipes/recs/41/Spinach_Quiche2898.shtml',
	'https://www.chefkoch.de/rezepte/92981036508577/Tomatensuppe-mit-Fleischkloesschen.html',
	'https://www.chefnini.com/salade-de-pasteque-grillee-tomates-cerises-et-asperges-vertes/',
	'https://chefsavvy.com/thai-peanut-zucchini-noodles/',
	'https://www.closetcooking.com/buffalo-coleslaw/',
	'https://cookeatshare.com/recipes/grilled-blue-marlin-with-lemon-butter-sauce-677197',
	'https://cookieandkate.com/crispy-apple-kohlrabi-salad-recipe/',
	'https://www.countryliving.com/food-drinks/a43668000/lasagna-soup-recipe/',
	'https://ninjatestkitchen.eu/recipe/raspberry-white-chocolate-blondies/',
	'https://www.eatingwell.com/recipe/8069828/vegetarian-stuffed-onions/',
	'https://cookpad.com/uk/recipes/17000197-red-cabbage-salad-with-sesame-dressing',
	'https://copykat.com/olive-garden-cappellini-pomodoro/',
	'https://creativecanning.com/elderberry-jelly/',
	'https://www.cuisineaz.com/recettes/tarte-fine-aux-figues-de-cyril-lignac-116607.aspx',
	'https://cybercook.com.br/receitas/legumes/receita-de-couve-flor-assada-vegana-122859',
	'https://www.davidlebovitz.com/summer-fruit-tart-berries-almond-cream/',
	'https://www.delish.com/cooking/recipe-ideas/recipes/a49383/apple-crisp-cookie-cups-recipe/',
	'https://www.ditchthecarbs.com/garlic-keto-naan-bread-almond-flour/',
	'https://domesticate-me.com/stovetop-stuffing-with-sausage-apple-and-onion/',
	'https://www.eatingbirdfood.com/baked-turkey-meatballs/',
	'https://www.eatingwell.com/recipe/8069828/vegetarian-stuffed-onions/',
	'https://eatsmarter.com/recipes/grilled-vegetables-with-miso-dressing',
	'https://emmikochteinfach.de/original-bruschetta-rezept-mit-tomaten/',
	'https://en.wikibooks.org/wiki/Cookbook:Cr%C3%A8me_Anglaise',
	'https://eatwhattonight.com/2022/06/steamed-tofu-with-century-egg-and-meat-floss/',
	'https://www.ethanchlebowski.com/cooking-techniques-recipes/steak-amp-corn-salsa-tostada',
	'https://www.epicurious.com/recipes/food/views/stovetop-apple-crisp',
	'https://www.fifteenspatulas.com/thomas-kellers-buttermilk-fried-chicken/',
	'https://www.finedininglovers.com/recipes/appetizer/green-salad-seaweed-red-prawns',
	'https://food52.com/recipes/89440-best-grilled-spatchcocked-chicken',
	'https://foodnetwork.co.uk/recipes/tom-kerridges-spinach-and-mint-raita',
	'https://www.foodrepublic.com/1366849/grilled-chilean-sea-bass-with-garlic-butter-recipe/',
	'https://www.forksoverknives.com/recipes/vegan-pasta-noodles/butternut-mac-and-cheese-broccoli/',
	'https://forktospoon.com/blackstone-tilapia/',
	'https://fredriksfika.allas.se/fredriks-middagstips/pesto-med-pistage/',
	'https://www.food.com/recipe/lebanese-lentil-salad-47961',
	'https://ricette.giallozafferano.it/Parmigiana-di-melanzane.html',
	'https://www.gimmesomeoven.com/grilled-peaches-bourbon-caramel-sauce/',
	'https://www.godt.no/oppskrifter/kaker/frukt-og-baerkaker/9826/enkel-og-saftig-eplekake',
	'https://goodfooddiscoveries.com/shrimp-scampi-garlic-bread/',
	'https://www.gonnawantseconds.com/alton-brown-meatloaf-recipe/',
	'https://www.greatbritishchefs.com/recipes/beef-bibimbap-recipe',
	'https://www.halfbakedharvest.com/broccoli-cheddar-chicken/',
	'https://handletheheat.com/pumpkin-bars-with-brown-sugar-frosting/',
	'https://www.hassanchef.com/2021/09/banjara-kebab.html',
	'https://headbangerskitchen.com/steak-creamed-spinach/',
	'https://www.heb.com/recipe/recipe-item/grilled-asparagus/1392765670705',
	'https://www.hellofresh.co.uk/recipes/market/serrano-ham-fig-jam-and-mozzarella-salad-64cc52602864fe111ef99af9',
	'https://hostthetoast.com/20-minute-corn-carbonara/',
	'https://www.ica.se/recept/billig-vegolasagne-729889/',
	'https://im-worthy.com/best-watermelon-cucumber-salad-recipe/',
	'https://www.indianhealthyrecipes.com/lauki-sabzi/',
	'https://insanelygoodrecipes.com/sweet-potato-fries/',
	'https://inspiralized.com/carrot-and-potato-chickpea-curry-with-lentils/',
	'https://izzycooking.com/sous-vide-chuck-roast/',
	'https://www.jamieoliver.com/recipes/chicken-recipes/chicken-goujons/',
	'https://jimcooksfoodgood.com/greek-chicken-and-orzo/',
	'https://joyfoodsunshine.com/the-most-amazing-chocolate-chip-cookies/',
	'https://www.justataste.com/frankenstein-rice-krispie-treats-recipe/',
	'https://www.justonecookbook.com/zucchini-corn-stir-fry/',
	'https://kennymcgovern.com/scottish-square-sausage',
	'https://www.thekitchn.com/french-onion-chicken-thighs-recipe-23562341',
	'https://www.kitchenstories.com/de/rezepte/gegrillter-lachs',
	'https://www.kochbar.de/rezept/547756/Omelette-mit-Pilzen-und-Garnelen.html',
	'https://www.koket.se/pasta-med-kramig-svampsas',
	'https://kuchnia-domowa.pl/przepisy/dodatki-do-dan/621-fasolka-szparagowa-w-migdalach',
	'https://www.lecremedelacrumb.com/cilantro-lime-grilled-chicken-thighs/',
	'https://www.lecker.de/bauernfruehstueck-rueckenwind-77094.html',
	'https://www.lekkerensimpel.com/tortellini-met-tomatensaus/',
	'https://littlespicejar.com/mexican-shrimp-cocktail-stuffed-avocados/',
	'https://livelytable.com/spanish-potato-and-chorizo-soup/',
	'https://lovingitvegan.com/vegan-brownies/',
	'https://www.mob.co.uk/recipes/high-protein-chopped-broccoli-salad',
	'https://momswithcrockpots.com/crockpot-stuffed-pepper-soup/',
	'https://www.motherthyme.com/2018/01/pork-egg-roll-bowl.html',
	'https://www.mybakingaddiction.com/raspberry-lemon-cookies/',
	'https://mykitchen101.com/%e6%9d%be%e8%bd%af%e9%a6%99%e5%96%b7%e5%96%b7%e7%9a%84%e7%83%a4%e5%92%96%e5%95%a1%e9%b8%a1%e8%9b%8b%e7%b3%95/',
	'https://mykitchen101en.com/eggless-lemon-peach-baked-cheesecake/',
	'https://www.myrecipes.com/recipe/grilled-bone-in-chicken-thighs',
	'https://www.maangchi.com/recipe/dwaeji-kimchi-duruchigi',
	'https://madensverden.dk/kalkun-i-paprikasauce/',
	'https://www.madewithlau.com/recipes/sesame-chicken',
	'https://madsvin.com/surdejspizza/',
	'https://www.marmiton.org/recettes/recette_salade-estivale-mozzarella-basilic-melon-et-tomate_338438.aspx',
	'https://www.marthastewart.com/1545904/wild-salmon-and-romanesco-pilaf',
	'https://www.melskitchencafe.com/oatmeal-chocolate-chip-peanut-butter-toffee-cookies/',
	'https://www.mindmegette.hu/paradicsomos-kaposzta-vi.recept/',
	'https://minimalistbaker.com/easy-vegan-stuffed-shells/',
	'https://ministryofcurry.com/overnight-oats-with-chia-seeds/',
	'https://www.misya.info/ricetta/borek-di-carne.htm',
	'https://www.nosalty.hu/recept/szaftos-brassoi-apropecsenye',
	'https://nourishedbynutrition.com/healthy-tuna-salad-no-mayo/',
	'https://www.number-2-pencil.com/honey-chipotle-shredded-beef-tacos/',
	'https://cooking.nytimes.com/recipes/1024544-cold-sesame-noodles-with-cucumber-corn-and-basil',
	'https://ohsheglows.com/2011/01/31/15-minute-creamy-avocado-pasta/',
	'https://omnivorescookbook.com/black-pepper-chicken/',
	'https://www.101cookbooks.com/raw-tuscan-kale-salad/',
	'https://www.paleorunningmomma.com/paleo-chicken-cutlets-whole30/',
	'https://panelinha.com.br/receita/caponata-de-forno',
	'https://www.persnicketyplates.com/crock-pot-honey-bourbon-chicken/',
	'https://www.pickuplimes.com/recipe/berries-cream-instant-oatmeal-1025',
	'https://www.pingodoce.pt/receitas/panquecas-japonesas/',
	'https://pinkowlkitchen.com/southern-candied-yams-old-fashioned-soul-food-recipe/',
	'https://www.platingpixels.com/slow-cooker-shredded-chicken/',
	'https://creativecanning.com/canning-beef-pot-pie-filling/',
	'https://pressureluckcooking.com/instant-pot-pasta-bolognese/',
	'https://www.primaledgehealth.com/cheese-ball-recipe-no-nuts/',
	'https://www.przepisy.pl/przepis/gulasz-wegierski-z-ziemniakami',
	'https://rainbowplantlife.com/the-best-vegan-crunchwrap-supreme/',
	'https://realfood.tesco.com/recipes/jamies-rogue-ratatouille-risotto.html',
	'https://www.realsimple.com/grilled-swordfish-with-couscous-and-tomatoes-7963013',
	'https://www.receitasnestle.com.br/receitas/receita-de-crumble-de-pera',
	'https://reciperunner.com/chicken-blt-salad/',
	'https://www.recipetineats.com/one-pot-baked-greek-chicken-orzo-risoni/',
	'https://redhousespice.com/peking-duck/',
	'https://www.rezeptwelt.de/brot-broetchen-rezepte/croissant-xl-hoernchen/5g5qz9pu-d6d98-490713-cfcd2-n3rrs0lq',
	'https://ricetta.it/torta-frangipane-alla-ricotta-e-fichi',
	'https://sallysbakingaddiction.com/cinnamon-swirl-quick-bread/',
	'https://saltpepperskillet.com/recipes/pulled-pork/#wprm-recipe-container-13727',
	'https://www.saveur.com/recipes/brockton-villa-french-toast/',
	'https://www.seriouseats.com/fingerling-potato-salad-with-chorizo-onion-and-arugula',
	'https://simple-veganista.com/vegan-banana-tea-bread/',
	'https://www.simplyquinoa.com/breakfast-potatoes/',
	'https://www.simplywhisked.com/key-lime-pie/',
	'https://www.simply-cookit.com/de/rezepte/granita',
	'https://www.skinnytaste.com/orange-chicken-makeover/',
	'https://sobors.hu/receptek/cikoriasalata-recept/',
	'https://southerncastiron.com/herb-and-cheese-drop-biscuits/',
	'https://www.southernliving.com/recipes/strawberry-swirl-cream-cheese-pound-cake-recipe',
	'https://www.spendwithpennies.com/egg-noodles/',
	'https://www.springlane.de/magazin/rezeptideen/walnussmus/',
	'https://www.staysnatched.com/smoked-queso-dip/',
	'https://steamykitchen.com/208514-chipotle-lime-shrimp-bowl-with-cilantro-jalapeno-yogurt-sauce-recipe.html',
	'https://sundpaabudget.dk/shawarma-bowl/',
	'https://www.sunset.com/recipe/miang-pla-lettuce-wraps-with-whole-fried-pompano',
	'https://sweetcsdesigns.com/the-best-easy-air-fryer-cornish-game-hens-recipe/',
	'https://sweetpeasandsaffron.com/ultra-crispy-air-fryer-tofu/',
	'https://www.taste.com.au/recipes/roast-butter-chicken-smashed-potatoes-recipe/4ottk54j',
	'https://www.tasteofhome.com/recipes/crispy-fried-chicken/',
	'https://tastesbetterfromscratch.com/chicken-and-dumplings/',
	'https://www.tastesoflizzyt.com/easy-strawberry-cake-recipe/',
	'https://tasty.co/recipe/taco-spiced-crispy-potato-skins',
	'https://tastykitchen.com/recipes/special-dietary-needs/vegetarian/crunchy-cashew-thai-quinoa-salad-with-ginger-peanut-dressing/',
	'https://www.theclevercarrot.com/2023/08/easy-ground-pork-meat-filling-for-ravioli/',
	'https://theexpertguides.com/recipes/banana-bread-recipe/',
	'https://thehappyfoodie.co.uk/recipes/jamie-olivers-herby-steak-and-crispy-potatoes/',
	'https://www.thekitchenmagpie.com/smoky-bacon-deviled-eggs/',
	'https://thekitchencommunity.org/rice-side-dishes-for-salmon/',
	'https://themodernproper.com/crispy-chicken-tacos',
	'https://www.thepioneerwoman.com/food-cooking/recipes/a43991626/peanut-noodles-recipe/',
	'https://therecipecritic.com/sheet-pan-pancakes/',
	'https://www.thespruceeats.com/rice-stuffed-tofu-pockets-2118773',
	'https://www.thevintagemixer.com/vegan-kale-caesar-salad-recipe-with-crispy-quinoa/',
	'https://thewoksoflife.com/cantonese-salt-pepper-pork-chops/',
	'https://recipes.timesofindia.com/recipes/khasta-kachodi/rs55415543.cms',
	'https://www.twopeasandtheirpod.com/caprese-orzo-salad/',
	'https://usapears.org/recipe/spring-greens-and-berry-pear-layered-smoothie/',
	'https://www.valdemarsro.dk/sproed-mexi-torsk-med-mangosalsa/',
	'https://vanillaandbean.com/roasted-red-bell-pepper-heirloom-tomato-soup/',
	'https://www.vegetarbloggen.no/2023/07/15/peanottkake/',
	'https://www.vegolosi.it/ricette-vegane/mini-peperoni-colorati-ripieni-di-formaggio-vegan-affumicato/',
	'https://www.vegrecipesofindia.com/sambhar-recipe-a-method-made-easy/',
	'https://www.watchwhatueat.com/instant-pot-broccoli-cheddar-soup/',
	'https://www.weightwatchers.com/us/recipe/pepperoni-flatbread-pizza/646d12d61a843705da13cb7f',
	'https://www.wellplated.com/sweet-potato-cornbread/',
	'https://whatsgabycooking.com/caprese-orzo-pasta-salad/',
	'https://www.zenbelly.com/sticky-sesame-tofu/'
]

// These are failing the download function
export const siteErrors = [
	'https://leanandgreenrecipes.net/recipes/american/spaghetti-squash-bolognese/',
	'https://www.tudogostoso.com.br/receita/187825-hamburguer-caseiro.html',
	'https://www.cucchiaio.it/ricetta/ricetta-penne-pesto-zucchine/',
	'https://rutgerbakt.nl/taart-recepten/slof/sloffentaart-met-zwitserse-room-en-zomerfruit/',
	'https://www.matprat.no/oppskrifter/rask/grove-pannekaker/',
	'https://comidinhasdochef.com/torta-de-atum-fofinha-e-macia/',
	'https://healthyeating.nhlbi.nih.gov/recipedetail.aspx?linkId=11&cId=1&rId=4'
]

// Add the custom CSS selectors to the file
export const sites = [
	// Known working site
	'https://www.750g.com/gateau-au-yaourt-leger-et-moelleux-r60818.htm'
	// 'https://recipes.farmhousedelivery.com/irish-banger-skillet/',
	// // This has a partial schema - with no ingredients
	// 'https://fitmencook.com/recipes/fire-salmon-recipe/',
	// 'https://www.gesund-aktiv.com/rezepte/vegetarisch/mediterraner-linsennudel-salat',
	// 'https://receitas.ig.com.br/2023-09-03/receita-de-tiramisu.html',
	// 'https://justbento.com/handbook/recipe-collection-mains/balsamic-sesame-chicken',
	// 'https://kochbucher.com/hahnchen-mit-mohren-und-porree-in-krauter-frischkase-sauce/',
	// 'https://www.kwestiasmaku.com/przepis/sernik-z-wisniami-0',
	// 'https://www.latelierderoxane.com/blog/recette-pain-maison-sans-petrissage/',
	// 'https://meljoulwan.com/2020/02/06/moroccan-salad-platter/',
	// 'https://www.nutritionbynathalie.com/single-post/mediterranean-style-sweet-potatoes',
	// 'https://paninihappy.com/turkey-bacon-lattice-and-havarti-panini/',
	// 'https://www.projectgezond.nl/croque-monsieur/',
	// 'https://rosannapansino.com/blogs/recipes/princess-peach-castle-cake',
	// 'https://www.saboresajinomoto.com.br/receita/hamburguer-duplo',
	// 'https://sallys-blog.de/rezepte/einbackbroetchen-luftige-hefebroetchen',
	// 'https://streetkitchen.hu/a-legjobb-reggelik/omlett-wrap/',
	// 'https://www.wholefoodsmarket.co.uk/recipes/classic-french-toast'
]

// These are off the to do list - not possible to get the data
export const sitesCantFix = [
	// This doesn't display the recipe in source - React app
	'https://www.coop.se/recept/pasta-carbonara-klassiskt-recept/',
	// Badly formatted JSON, can't be fucked
	'https://yemek.com/tarif/jalepeno-biber-tursusu/',
	// Angular nightmare - no data on the page
	'https://www.woolworths.com.au/shop/recipes/slow-cooker-lamb-shanks-with-rosemary-and-thyme'
]

/**
 * Downloads and saves the content from a given URL. If the content contains a recipe in JSON-LD format,
 * only the recipe data is saved. Otherwise, the entire HTML content is saved.
 *
 * @async
 * @function
 * @param {string} url - The URL to download content from.
 * @returns {void}
 *
 * @throws Will throw an error if there's an issue fetching the URL.
 *
 * @example
 * await downloadAndSave('https://example.com/recipe');
 */

export async function downloadAndSave(url) {
	const filename = urlToFilename(url)
	const saveDirectory = path.join(process.cwd(), 'src', 'lib', 'data', 'recipe_html')
	const filePath = path.join(saveDirectory, filename)

	// Check if file already exists
	if (fs.existsSync(filePath)) {
		console.log(`File ${filename} already exists in ${saveDirectory}. Skipping.`)
		return // Exit the function early
	}

	try {
		const response = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		})
		const htmlContent = response.data

		// Extract the JSON-LD content
		const regex = /<script type="application\/ld\+json"(?:\s+class="[^"]*")?>([\s\S]*?)<\/script>/g // Note the 'g' flag for global matching
		let match
		let recipeData

		while ((match = regex.exec(htmlContent)) !== null) {
			const jsonData = JSON.parse(match[1])

			// Check if it's a direct Recipe type
			if (jsonData['@type'] === 'Recipe') {
				recipeData = jsonData
				break
			}

			// If there's an @graph array, search inside it for a Recipe type
			if (jsonData['@graph']) {
				for (let item of jsonData['@graph']) {
					if (item['@type'] === 'Recipe') {
						recipeData = item
						break
					}
				}
			}

			if (recipeData) break // If we found the recipe data, break out of the while loop
		}

		if (recipeData) {
			console.log('Found Recipe:', url)
		} else {
			console.error('No recipe data found:', url)
		}

		if (match && match[1]) {
			const jsonData = JSON.parse(match[1])

			// Check if jsonData has a @graph property
			if (jsonData['@graph']) {
				recipeData = jsonData['@graph'].find((item) => item['@type'] === 'Recipe')
			}
			// If not, check if jsonData directly has the @type of "Recipe"
			else if (jsonData['@type'] === 'Recipe') {
				recipeData = jsonData
			}
		}

		if (!recipeData) {
			console.error('No recipe data found in the JSON-LD')
		}

		let contentToSave

		if (recipeData) {
			contentToSave = `<script type="application/ld+json">\n${JSON.stringify(
				recipeData,
				null,
				4
			)}\n</script>`
		} else {
			contentToSave = beautify(htmlContent)
		}

		// Ensure the directory exists
		if (!fs.existsSync(saveDirectory)) {
			fs.mkdirSync(saveDirectory, { recursive: true })
		}

		fs.writeFileSync(filePath, contentToSave, 'utf8')
		console.log(`Content from ${url} saved successfully in ${saveDirectory}!`)
	} catch (error) {
		console.error(`Error fetching URL ${url}:`)
	}
}

// sites.forEach((url) => {
// 	downloadAndSave(url)
// })
