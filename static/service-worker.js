/* eslint-disable no-undef */

if (!self.define) {
	let e,
		s = {}
	const c = (c, a) => (
		(c = new URL(c + '.js', a).href),
		s[c] ||
			new Promise((s) => {
				if ('document' in self) {
					const e = document.createElement('script')
					;(e.src = c), (e.onload = s), document.head.appendChild(e)
				} else (e = c), importScripts(c), s()
			}).then(() => {
				let e = s[c]
				if (!e) throw new Error(`Module ${c} didn’t register its module`)
				return e
			})
	)
	self.define = (a, r) => {
		const i = e || ('document' in self ? document.currentScript.src : '') || location.href
		if (s[i]) return
		let b = {}
		const f = (e) => c(e, i),
			d = {
				module: {
					uri: i
				},
				exports: b,
				require: f
			}
		s[i] = Promise.all(a.map((e) => d[e] || f(e))).then((e) => (r(...e), b))
	}
}
define(['./workbox-6e8cca50'], function (e) {
	'use strict'
	self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{
					url: 'client/_app/immutable/assets/_layout.4583098d.css',
					revision: '8be4cbcfd1f0ce5d150bf069512ad4ff'
				},
				{
					url: 'client/_app/immutable/assets/_layout.c7cc04cd.css',
					revision: '85b4fcd38e27acff83bfce20c3cd4c2b'
				},
				{
					url: 'client/_app/immutable/assets/_page.2c0bc4d0.css',
					revision: 'f0548e5933da71e8e4b9f2b3cf5b9f8e'
				},
				{
					url: 'client/_app/immutable/assets/_page.3487373f.css',
					revision: 'c4fd90349ec64af2b525cb7b35ee6e7b'
				},
				{
					url: 'client/_app/immutable/assets/_page.64ec3b83.css',
					revision: '1caf6d0fb3c744cda648dc163d8484de'
				},
				{
					url: 'client/_app/immutable/assets/_page.65bdc4f4.css',
					revision: 'ba8a8484cb6e25b8932273a16efa062e'
				},
				{
					url: 'client/_app/immutable/assets/_page.864396cb.css',
					revision: '9e642e62cf7b71f37598485e24e6d505'
				},
				{
					url: 'client/_app/immutable/assets/_page.8bd5600c.css',
					revision: '08bc2c6c3a5ab5320a74e669b91b0fe8'
				},
				{
					url: 'client/_app/immutable/assets/_page.8e52e8af.css',
					revision: 'f21c433fef3ec93fad638a81546a260b'
				},
				{
					url: 'client/_app/immutable/assets/_page.95e3f63b.css',
					revision: '539c127f1a7522ac7362c18e769631dc'
				},
				{
					url: 'client/_app/immutable/assets/_page.be326d6e.css',
					revision: 'c7d2033eccaf790d0d1d2f2d94672808'
				},
				{
					url: 'client/_app/immutable/assets/_page.cdf2fcdd.css',
					revision: 'e92953c6d5e6e6d449383f825d870464'
				},
				{
					url: 'client/_app/immutable/assets/_page.d8617caf.css',
					revision: 'b63969ceca04d508f420e4ef0c08f4fb'
				},
				{
					url: 'client/_app/immutable/assets/_page.e4b56efe.css',
					revision: '7a8864ef0b472b124e670f501a6e85a5'
				},
				{
					url: 'client/_app/immutable/assets/0.f200df90.css',
					revision: '5a3267815e839cc87eec65a70a0d4ce2'
				},
				{
					url: 'client/_app/immutable/assets/10.cdf2fcdd.css',
					revision: 'e92953c6d5e6e6d449383f825d870464'
				},
				{
					url: 'client/_app/immutable/assets/12.3487373f.css',
					revision: 'c4fd90349ec64af2b525cb7b35ee6e7b'
				},
				{
					url: 'client/_app/immutable/assets/13.e4b56efe.css',
					revision: '7a8864ef0b472b124e670f501a6e85a5'
				},
				{
					url: 'client/_app/immutable/assets/14.2c0bc4d0.css',
					revision: 'f0548e5933da71e8e4b9f2b3cf5b9f8e'
				},
				{
					url: 'client/_app/immutable/assets/15.8e52e8af.css',
					revision: 'f21c433fef3ec93fad638a81546a260b'
				},
				{
					url: 'client/_app/immutable/assets/16.d8617caf.css',
					revision: 'b63969ceca04d508f420e4ef0c08f4fb'
				},
				{
					url: 'client/_app/immutable/assets/19.8bd5600c.css',
					revision: '08bc2c6c3a5ab5320a74e669b91b0fe8'
				},
				{
					url: 'client/_app/immutable/assets/20.65bdc4f4.css',
					revision: 'ba8a8484cb6e25b8932273a16efa062e'
				},
				{
					url: 'client/_app/immutable/assets/3.c7cc04cd.css',
					revision: '85b4fcd38e27acff83bfce20c3cd4c2b'
				},
				{
					url: 'client/_app/immutable/assets/5.95e3f63b.css',
					revision: '539c127f1a7522ac7362c18e769631dc'
				},
				{
					url: 'client/_app/immutable/assets/7.864396cb.css',
					revision: '9e642e62cf7b71f37598485e24e6d505'
				},
				{
					url: 'client/_app/immutable/assets/8.64ec3b83.css',
					revision: '1caf6d0fb3c744cda648dc163d8484de'
				},
				{
					url: 'client/_app/immutable/assets/9.be326d6e.css',
					revision: 'c7d2033eccaf790d0d1d2f2d94672808'
				},
				{
					url: 'client/_app/immutable/assets/Burger.06e72bf7.css',
					revision: 'd2a6d213771f306a1ff129ce5bf8bf4a'
				},
				{
					url: 'client/_app/immutable/assets/CategoryTree.61b5a924.css',
					revision: '3974ae28b7b66bd4bf9f7c8913859a76'
				},
				{
					url: 'client/_app/immutable/assets/House.c16d2a49.css',
					revision: 'd9a1b75b8ad106ba14338b45a8ee347c'
				},
				{
					url: 'client/_app/immutable/assets/RecipeForm.4ca25bf4.css',
					revision: 'cb74225c3274a733f92b1c472bea9276'
				},
				{
					url: 'client/_app/immutable/assets/StarRating.37f3cfd8.css',
					revision: 'f63fbba18c8508ad59628e921064de38'
				},
				{
					url: 'client/_app/immutable/chunks/Burger.88960fed.js',
					revision: 'fcfa9869697e589710e35438a7dc421e'
				},
				{
					url: 'client/_app/immutable/chunks/categories.e2577280.js',
					revision: '61b135beb8272b7e5cde43bbb3283e69'
				},
				{
					url: 'client/_app/immutable/chunks/CategoryTree.880d009d.js',
					revision: '6a78d1f261a2603fb1f7691cc6558b38'
				},
				{
					url: 'client/_app/immutable/chunks/crud.a45c17ab.js',
					revision: '5428e2c9049532d2227e88bf83ab97a9'
				},
				{
					url: 'client/_app/immutable/chunks/dateTime.ccaad879.js',
					revision: '9f888cc8ce27714e88208095014eaacc'
				},
				{
					url: 'client/_app/immutable/chunks/Delete.f3f99918.js',
					revision: '217fc82b17bffebd323f3ffcf48ccab8'
				},
				{
					url: 'client/_app/immutable/chunks/Edit.36a5b049.js',
					revision: '3027e5bcb14409dc0c4a7694f953ebe3'
				},
				{
					url: 'client/_app/immutable/chunks/featureFlags.fd13de72.js',
					revision: '8f1f5d54b549fc82399cdb39a8b66c20'
				},
				{
					url: 'client/_app/immutable/chunks/FeedbackMessage.7ac49017.js',
					revision: 'e1c9dd839f5d096655ee942e425f79d1'
				},
				{
					url: 'client/_app/immutable/chunks/filters.ee1f6613.js',
					revision: 'b3be02e24fee3a08d8a6e19a129caef2'
				},
				{
					url: 'client/_app/immutable/chunks/FoodBowl.2686adda.js',
					revision: 'ceeb08030e8c82c46507561afecfc14c'
				},
				{
					url: 'client/_app/immutable/chunks/House.3769b9ec.js',
					revision: '0fb69616a2babc9f2ba3f26aab277de2'
				},
				{
					url: 'client/_app/immutable/chunks/index.57ceffc9.js',
					revision: 'eab845cf445bb6736c9a5aaba29c96c5'
				},
				{
					url: 'client/_app/immutable/chunks/navigation.c055a6bc.js',
					revision: '67f001adc5e41d68493da20383172f0c'
				},
				{
					url: 'client/_app/immutable/chunks/New.b67dac12.js',
					revision: 'a6268beffa59a54d986c4b98e6b25082'
				},
				{
					url: 'client/_app/immutable/chunks/RecipeForm.075a55ad.js',
					revision: 'a3a36a54e3530d02619b112c158a9331'
				},
				{
					url: 'client/_app/immutable/chunks/singletons.8e84aa2f.js',
					revision: '74e4f7cc4ceca208c4d72a8e353970ab'
				},
				{
					url: 'client/_app/immutable/chunks/StarRating.969bd0dd.js',
					revision: '4830fc1179a97f479ebeb85b81b6e29d'
				},
				{
					url: 'client/_app/immutable/chunks/stores.b15e5ebe.js',
					revision: '474718fc67242920800f3a28d292fac3'
				},
				{
					url: 'client/_app/immutable/chunks/TrueFalse.0af56240.js',
					revision: '0617423d70a6b9bbb57d3eb402402eef'
				},
				{
					url: 'client/_app/immutable/chunks/units.22f855be.js',
					revision: 'f43adbb86a6d00b0e5a4f17c00057f3e'
				},
				{
					url: 'client/_app/immutable/chunks/UpArrow.1e91fe3c.js',
					revision: '718976d2dc8c5196f7e2b5e2a7e0323c'
				},
				{
					url: 'client/_app/immutable/chunks/View.93ef09c4.js',
					revision: '89b58148725d147c0d3383ed8f989223'
				},
				{
					url: 'client/_app/immutable/entry/app.1be38a2c.js',
					revision: '2eb1ba572cd2a32369fcaf5d6fba468f'
				},
				{
					url: 'client/_app/immutable/entry/start.8e360c00.js',
					revision: 'b9dd0d19d6b6aa830c8578654e7e1974'
				},
				{
					url: 'client/_app/immutable/nodes/0.5e28ee60.js',
					revision: '148e4907b8d08d9b9fc2cc92ea8d5884'
				},
				{
					url: 'client/_app/immutable/nodes/1.fb58ec9a.js',
					revision: '1399df753bf19b22c027e0b6855b2c62'
				},
				{
					url: 'client/_app/immutable/nodes/10.61165bc9.js',
					revision: 'bc20c2dc650791e3b3e07004cb61a807'
				},
				{
					url: 'client/_app/immutable/nodes/11.8c9be19d.js',
					revision: 'c5185af00319a9de09bbbbbcbe1388d6'
				},
				{
					url: 'client/_app/immutable/nodes/12.3a2ff011.js',
					revision: '8f187c4c6899ee3ca2cabaad5d75262a'
				},
				{
					url: 'client/_app/immutable/nodes/13.0dc2ba20.js',
					revision: 'f1ebd202e3e9f8a6cf75827f9a33cd2f'
				},
				{
					url: 'client/_app/immutable/nodes/14.d486fdf9.js',
					revision: '67da1dd99d3b10fb7c430dfb4f60fe9f'
				},
				{
					url: 'client/_app/immutable/nodes/15.68426aa8.js',
					revision: '9f9780fd88a821fb828b588ff2d21507'
				},
				{
					url: 'client/_app/immutable/nodes/16.b489ef58.js',
					revision: '1642ab38c1580b95fe4343a0929b6bcc'
				},
				{
					url: 'client/_app/immutable/nodes/17.5114e788.js',
					revision: '8a4049248b27700846b157a933d5302c'
				},
				{
					url: 'client/_app/immutable/nodes/18.b3f9d324.js',
					revision: '3672add5dcdeff6518b8d1dcb3f8a52b'
				},
				{
					url: 'client/_app/immutable/nodes/19.d90ef377.js',
					revision: '3e7f7abfca52a3a13b084ae53277d084'
				},
				{
					url: 'client/_app/immutable/nodes/2.d0a541d2.js',
					revision: '9a6318c2e09b418115e34b87f0359448'
				},
				{
					url: 'client/_app/immutable/nodes/20.c7d6ea1e.js',
					revision: 'f1cc4d1243462791be03c717754ef0a5'
				},
				{
					url: 'client/_app/immutable/nodes/3.08c0bda4.js',
					revision: '7c1b8d7d9c71e24800de5d2e36c3e8a7'
				},
				{
					url: 'client/_app/immutable/nodes/4.2eff8af9.js',
					revision: '8785cdd8765fd012f83aef4809dcee1b'
				},
				{
					url: 'client/_app/immutable/nodes/5.135a05cc.js',
					revision: 'bc5b27dcfafc3af01ba9aca8e7022c90'
				},
				{
					url: 'client/_app/immutable/nodes/6.660ec374.js',
					revision: 'da39108bd9592cfb1a67198568aff606'
				},
				{
					url: 'client/_app/immutable/nodes/7.3173464c.js',
					revision: '54c4bd32d58f17ffe17ed934b682c741'
				},
				{
					url: 'client/_app/immutable/nodes/8.2f449cad.js',
					revision: '9df7ac2a6d728052a1bc54763bfdcfc5'
				},
				{
					url: 'client/_app/immutable/nodes/9.76630df6.js',
					revision: 'e490644a9e5ea0b3cc28c7294824ee28'
				},
				{
					url: 'client/images/favicon.png',
					revision: '3a387408ecc6cc283f724b39ca5fffb4'
				},
				{
					url: 'client/images/logo-large.png',
					revision: 'af35c935b3fdf8658653812f2adaf040'
				},
				{
					url: 'client/images/logo-small.png',
					revision: 'f261af0507388a013f265895c441cec5'
				},
				{
					url: 'client/service-worker.js',
					revision: 'dc3c373b165cc3dabbfed56c5a1638e3'
				},
				{
					url: 'client/workbox-6e8cca50.js',
					revision: '05f8ee5b6ec0388e6b4c6ffe90a409b7'
				},
				{
					url: 'env.js',
					revision: 'b3fc14272ed3040129bf18fc9e3a089d'
				},
				{
					url: 'handler.js',
					revision: 'd5312992f5d2d0f3f159f8780a29217a'
				},
				{
					url: 'index.js',
					revision: '1b036104f94e5ef50aedd35d5ccb203f'
				},
				{
					url: 'server/chunks/_layout.svelte-10272140.js',
					revision: '60d5029229c373057e9892bd9ead598a'
				},
				{
					url: 'server/chunks/_layout.svelte-7cc9bb5f.js',
					revision: '3ea4cf812011a326ba2a43fb57c60bc0'
				},
				{
					url: 'server/chunks/_layout.svelte-c250d47e.js',
					revision: 'd839c3d114e747bab20d53724a6cbfbc'
				},
				{
					url: 'server/chunks/_page.svelte-018d4fcb.js',
					revision: '94eea35e608f9018a806e9b428c906ee'
				},
				{
					url: 'server/chunks/_page.svelte-0d33f0ba.js',
					revision: 'f49a74d596449fd13923288632fc2203'
				},
				{
					url: 'server/chunks/_page.svelte-169c8b16.js',
					revision: 'fae03e13d6c451987e9800060378876b'
				},
				{
					url: 'server/chunks/_page.svelte-3fec3796.js',
					revision: '94d688eca3ecab494eeac035639755bb'
				},
				{
					url: 'server/chunks/_page.svelte-41ad1a4a.js',
					revision: 'f9f78f5ab792ac96bd113eb1e953130f'
				},
				{
					url: 'server/chunks/_page.svelte-44a6d451.js',
					revision: '07138a8b62da71083afb855562dab2c2'
				},
				{
					url: 'server/chunks/_page.svelte-44eb0c75.js',
					revision: '2c85c63b14357361c412404400c46023'
				},
				{
					url: 'server/chunks/_page.svelte-4ff052df.js',
					revision: 'ff6b7eddc616e8a90c9c493da542bad4'
				},
				{
					url: 'server/chunks/_page.svelte-559b20d8.js',
					revision: '07b34cbee7386994829f49744769f4ab'
				},
				{
					url: 'server/chunks/_page.svelte-60abc6de.js',
					revision: '8352df968b21f7d8b8fc3e4fef9fadee'
				},
				{
					url: 'server/chunks/_page.svelte-74a9571e.js',
					revision: '86ce3c96ccb027037c329ede5b12c541'
				},
				{
					url: 'server/chunks/_page.svelte-8d9c44d4.js',
					revision: '44cf785c7b8b535d656227f72f0fff5c'
				},
				{
					url: 'server/chunks/_page.svelte-afe7881e.js',
					revision: 'f55546af77469bcdad98509f8b5d9c06'
				},
				{
					url: 'server/chunks/_page.svelte-b05c8394.js',
					revision: '92cf7dc85ac66843dadc0562ccbb95fe'
				},
				{
					url: 'server/chunks/_page.svelte-c468b93a.js',
					revision: '446cbbd5afd42344b1bdca2044de8eed'
				},
				{
					url: 'server/chunks/_page.svelte-e133c4c3.js',
					revision: '1ce06291070151cc6448773caeb2bb77'
				},
				{
					url: 'server/chunks/_page.svelte-e3dbc1e5.js',
					revision: '8dd947bd126693cb10be366f97296d1a'
				},
				{
					url: 'server/chunks/_server-08a37de2.js',
					revision: '52c712e450a869af5d2466b3e4af617c'
				},
				{
					url: 'server/chunks/_server-09b738bd.js',
					revision: 'e336de50e5c278e689f34f6eaff19a17'
				},
				{
					url: 'server/chunks/_server-0dfee152.js',
					revision: '7aef39b74c85c76bd472378435030ee1'
				},
				{
					url: 'server/chunks/_server-138601df.js',
					revision: 'a8587e2e953c64cdb3d3460a0d4c1373'
				},
				{
					url: 'server/chunks/_server-3532733f.js',
					revision: '02dd96f4102baecf9e8e702500929db7'
				},
				{
					url: 'server/chunks/_server-37d635db.js',
					revision: 'b2f5de307a5c43207e16233d4f5e385c'
				},
				{
					url: 'server/chunks/_server-4acf3713.js',
					revision: '68881be2ed4d13393c8e63997b9653ec'
				},
				{
					url: 'server/chunks/_server-4e936b58.js',
					revision: '50cf9b7c643d8ea8f96564365d9509bf'
				},
				{
					url: 'server/chunks/_server-4ed993c7.js',
					revision: 'f6ceb80c8ea5c09529d1b5439d18d977'
				},
				{
					url: 'server/chunks/_server-57a69eae.js',
					revision: 'da8be110df457cabeff221973df10599'
				},
				{
					url: 'server/chunks/_server-5978fd25.js',
					revision: '8b585b94e65fbbe109457c2bc2a20e2f'
				},
				{
					url: 'server/chunks/_server-6091179a.js',
					revision: '098c8da3cc4d81caf3e39e3db96e2096'
				},
				{
					url: 'server/chunks/_server-610551f1.js',
					revision: '1d939e0e7d6c31007f4c7df230504c26'
				},
				{
					url: 'server/chunks/_server-72dd67f4.js',
					revision: 'ebb0c1897b98bc315663440c5a6299af'
				},
				{
					url: 'server/chunks/_server-98354a79.js',
					revision: 'caa04f2c6bc7d11226778feab76e174c'
				},
				{
					url: 'server/chunks/_server-988aa82d.js',
					revision: 'ece02aef3f4936092cfa7b257852899e'
				},
				{
					url: 'server/chunks/_server-a2bd12b0.js',
					revision: '46d4f97f85558c0cb5acb9ee876202ad'
				},
				{
					url: 'server/chunks/_server-a74c1994.js',
					revision: 'dcebc329bc11226215363da328498350'
				},
				{
					url: 'server/chunks/_server-ace42ff7.js',
					revision: '8dd27b8f012ebaa0239dcc6ad18b4660'
				},
				{
					url: 'server/chunks/_server-b1f32865.js',
					revision: '045a6f4066c78f10c62ebb742519a9b6'
				},
				{
					url: 'server/chunks/_server-ce5dcc41.js',
					revision: '7ad90901c05f0501a802d810270b67fd'
				},
				{
					url: 'server/chunks/_server-d4a1bb80.js',
					revision: '078be8836876954d1e8c4c19240d29ed'
				},
				{
					url: 'server/chunks/_server-e466e986.js',
					revision: '32736f2621b0cb66e2925368e67c591c'
				},
				{
					url: 'server/chunks/_server-ef002fbf.js',
					revision: '540196b938471a21d3a315140a3a687f'
				},
				{
					url: 'server/chunks/_server-f65d18c9.js',
					revision: 'cb5f2b87fc7c91bf873cee192549a64f'
				},
				{
					url: 'server/chunks/_server-f8fdc0bf.js',
					revision: '2429d109508cf29dd155799c9a41c1df'
				},
				{
					url: 'server/chunks/_server-fbb8cf3a.js',
					revision: 'ee64b3175dde163295fe65b80751edaa'
				},
				{
					url: 'server/chunks/0-d7815255.js',
					revision: 'b2402c778cc030c6e4569a09a022ff5d'
				},
				{
					url: 'server/chunks/1-d40cea47.js',
					revision: 'ebe915a52701bf29591137517b1c628d'
				},
				{
					url: 'server/chunks/10-f33ac6d0.js',
					revision: '2a31328071cbf99afe2e8bea4b7fe715'
				},
				{
					url: 'server/chunks/11-48d9837a.js',
					revision: 'b8042e65c4e1d095ea837ed29bcddfd2'
				},
				{
					url: 'server/chunks/12-50e72194.js',
					revision: '67bb3914836d46ff32c1013c1c7ae391'
				},
				{
					url: 'server/chunks/13-2564b822.js',
					revision: '4e238b4332f14cefb3f109ba61d53b63'
				},
				{
					url: 'server/chunks/14-70817137.js',
					revision: 'bfa7d91c18298d3b9a6565c3ef7ff09c'
				},
				{
					url: 'server/chunks/15-532e1ac7.js',
					revision: '35c99cc1298298fc8be65e12db95c923'
				},
				{
					url: 'server/chunks/16-46c430d4.js',
					revision: 'a993fd238863b6016c34f0c9c59457a2'
				},
				{
					url: 'server/chunks/17-e0a1f118.js',
					revision: '54af8e534442a8090288b08a413a8d7e'
				},
				{
					url: 'server/chunks/18-80ce2ace.js',
					revision: '88999a122c0cbf89382601ec2cde6cf8'
				},
				{
					url: 'server/chunks/19-72250ec0.js',
					revision: '71a5d3da8a9e5fdea7328800c698c936'
				},
				{
					url: 'server/chunks/2-11b1c598.js',
					revision: '6c180adecb63f98dd37937b42a52c195'
				},
				{
					url: 'server/chunks/20-42736769.js',
					revision: 'f9af82d93c906e8020b29fe14bba4759'
				},
				{
					url: 'server/chunks/3-33f0f3b7.js',
					revision: 'bcd376189475892e985e0757cc1a2b2a'
				},
				{
					url: 'server/chunks/4-0158a111.js',
					revision: 'edb3f2ccb47f880acf8035ea9a6ad6ea'
				},
				{
					url: 'server/chunks/5-606786aa.js',
					revision: 'cbd41d6f26dfa9fda1777d95adbbe88b'
				},
				{
					url: 'server/chunks/6-a7e42e0f.js',
					revision: '23b795f683dd56dae663a4a21527797d'
				},
				{
					url: 'server/chunks/7-6af2984d.js',
					revision: '795e57f2aaaac0738168c9ae9fd2cb9a'
				},
				{
					url: 'server/chunks/8-dc80cc3e.js',
					revision: '8d35339bd9e7cfa58b60b107c38ea9a8'
				},
				{
					url: 'server/chunks/9-d00e560d.js',
					revision: '3d371f493743c4eddf0892fbe25c03cc'
				},
				{
					url: 'server/chunks/api-64450c09.js',
					revision: '1a811cda80c3953219b437fe6fdfe2da'
				},
				{
					url: 'server/chunks/Burger-3f848bba.js',
					revision: '9aa69dc08d891d45a01b779cd363e00d'
				},
				{
					url: 'server/chunks/categories-8d92167d.js',
					revision: 'a1c32477f60cc636e95fe25a0f750f6b'
				},
				{
					url: 'server/chunks/converter-d90cda6f.js',
					revision: '7f7097ba1c68879357125aaa02482e27'
				},
				{
					url: 'server/chunks/Delete-7b0cfe27.js',
					revision: 'c9fed8082a3bf2bf8f40353e2b985b29'
				},
				{
					url: 'server/chunks/Edit-7fbe9dc8.js',
					revision: '6c812297aa177ca0c59260a1161f2cc9'
				},
				{
					url: 'server/chunks/error.svelte-688ef13b.js',
					revision: '39b1fcbd97f69d561f503f96e1b68afd'
				},
				{
					url: 'server/chunks/featureFlags-90d5f3ac.js',
					revision: '00890a925673a576a60130d7c1e64632'
				},
				{
					url: 'server/chunks/FeedbackMessage-396e3688.js',
					revision: 'fa5e67805796bab80a09fe70b12ddb87'
				},
				{
					url: 'server/chunks/filters-fd3b10b6.js',
					revision: '4b1713f01432a5bd7ebf09dc5a311f4e'
				},
				{
					url: 'server/chunks/FoodBowl-0178c3a3.js',
					revision: '7648b57c84fa95d5f893897b9503a8ff'
				},
				{
					url: 'server/chunks/hooks.server-1e3df053.js',
					revision: 'a6e174f0fcb096735c096d18b0b74967'
				},
				{
					url: 'server/chunks/House-447947f7.js',
					revision: 'a981c797100b09c64a7821504957ead2'
				},
				{
					url: 'server/chunks/imageBackend-d0b0b8d1.js',
					revision: '89a2abaf8f543c48c20be1f6679503d7'
				},
				{
					url: 'server/chunks/imageUtils-71a11ec4.js',
					revision: '2071bd1cb0e4f21ef1983d87a6119784'
				},
				{
					url: 'server/chunks/index-0087e825.js',
					revision: '9ad60b675e56f03cf2c993b956c4920a'
				},
				{
					url: 'server/chunks/index2-3fbee56f.js',
					revision: 'ff92e39a2cf7b0ce98ea8d181b96eced'
				},
				{
					url: 'server/chunks/lucia-1c55d567.js',
					revision: '59a8abe54fe373a49bc0fd4fb3759124'
				},
				{
					url: 'server/chunks/New-d9747a07.js',
					revision: '086e328057c8f3b4dfba97e4eb2690f0'
				},
				{
					url: 'server/chunks/paprikaAPI-ad0dbf60.js',
					revision: '2359aeeca62ab33c152e82b1aeca5bd4'
				},
				{
					url: 'server/chunks/paprikaAPIUtils-9c814ce8.js',
					revision: 'aa7a81eddc5894000e9fa302f8acc8af'
				},
				{
					url: 'server/chunks/paprikaFileImport-f375a10e.js',
					revision: '74a5765fcfb0007df005018b71b9c0c6'
				},
				{
					url: 'server/chunks/prisma-5617d6f1.js',
					revision: '8f11e0a3f4a00f394dce5797320e7cf5'
				},
				{
					url: 'server/chunks/RecipeForm-96c5b40e.js',
					revision: '53d0a81348cb26c2df095b58b916d059'
				},
				{
					url: 'server/chunks/security-ac24a1e9.js',
					revision: 'b1530c7e263bfc690d03ee8afb8e126c'
				},
				{
					url: 'server/chunks/shared-server-109aad38.js',
					revision: '1b212fa079911c82b55a41031d796b3c'
				},
				{
					url: 'server/chunks/sorting-57a8a9b6.js',
					revision: 'f0cbe00b3126547d67b142c4ab716e07'
				},
				{
					url: 'server/chunks/StarRating-b6eb491b.js',
					revision: '53a3c2e9633be2b681140140cc250af6'
				},
				{
					url: 'server/chunks/stores-9741f3a2.js',
					revision: 'ee9230eff163d4d0cd5f66b0b32d188c'
				},
				{
					url: 'server/chunks/TrueFalse-77d600c1.js',
					revision: 'c74d0aa27db453c8315dc642d3e72e57'
				},
				{
					url: 'server/chunks/units-23d5e5d2.js',
					revision: 'c3e3ce7c67951caca34fc0149e7af418'
				},
				{
					url: 'server/chunks/UpArrow-21da7cad.js',
					revision: '80e052cb194d8f53ac726cbef401bc89'
				},
				{
					url: 'server/chunks/View-a6b5b5ac.js',
					revision: 'e69ec5008c7744ba0c088193d4093bb5'
				},
				{
					url: 'server/index.js',
					revision: '3f95471a56f3b728c468eeada2d7a4d8'
				},
				{
					url: 'server/manifest.js',
					revision: 'd69dd3b8de8205611b00a1c722cfb946'
				},
				{
					url: 'shims.js',
					revision: '33767c9b0571b29612bdfd4b458ee48e'
				}
			],
			{}
		),
		e.registerRoute(
			/^%%URLPATTERN%%\//,
			new e.NetworkFirst({
				cacheName: 'my-cache',
				plugins: [
					new e.ExpirationPlugin({
						maxEntries: 10,
						maxAgeSeconds: 300
					})
				]
			}),
			'GET'
		)
})
// Register route will look like this when correctly inserted:
// /^https:\/\/cookrr\.jamestorr\.com\//
//# sourceMappingURL=service-worker.js.map
