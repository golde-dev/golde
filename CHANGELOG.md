# Change Log
## Own yor PaaS

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## 0.4.1 (2026-03-24)

### Features

* added baseline agent, create examples ([3aae860](https://github.com/golde-dev/golde/commit/3aae860430ace859b7cbff40a930774826a0d571)) - by @chyzwar
* added cloudflare path resolution ([a652163](https://github.com/golde-dev/golde/commit/a6521635e7af7566fa342539782ef7479ed076bc)) - by @chyzwar
* added compile script helper to run compilation faster ([8b070cf](https://github.com/golde-dev/golde/commit/8b070cf624cf19455c5c4508d76c1f766342e713)) - by @chyzwar
* added configure command ([5ad650d](https://github.com/golde-dev/golde/commit/5ad650d2c14423fef433c44af79ce2d0e867dc77)) - by @chyzwar
* added destroy and prune, s3 planner ([e57d135](https://github.com/golde-dev/golde/commit/e57d135a0fb9870165296f61ba84aa4cf21c612a)) - by @chyzwar
* added docker provider and initial planner ([fca7695](https://github.com/golde-dev/golde/commit/fca769554b513d71d626648e96dde31793f62097)) - by @chyzwar
* added example for s3 state using r2 ([e5db9a8](https://github.com/golde-dev/golde/commit/e5db9a80b7381ec9baab3d5912eb560a0c6ae0c3)) - by @chyzwar
* added git client info ([8fbfbd9](https://github.com/golde-dev/golde/commit/8fbfbd9bd78b7d28da618a3278d87c3e6f57afce)) - by @chyzwar
* added initial artifacts ([8aceb71](https://github.com/golde-dev/golde/commit/8aceb71c2ac8077ec1c84c58bbac87e3b8578759)) - by @chyzwar
* added lerna to manage versioning of project ([a83cb72](https://github.com/golde-dev/golde/commit/a83cb720354192dc0023121e4bf447a0eb133692)) - by @chyzwar
* added maxversion in versioned resources as config ([635326d](https://github.com/golde-dev/golde/commit/635326db2c76450daa203716832311df75ef00f6)) - by @chyzwar
* added more lambda configs, initial start on deps of deps resilution ([88e1171](https://github.com/golde-dev/golde/commit/88e1171b8fcd4145908c7ccb22414e3aecd7fd71)) - by @chyzwar
* added r2 objects ([b91c8bb](https://github.com/golde-dev/golde/commit/b91c8bbe5cc86872463b868fbeea08dc9a9150d6)) - by @chyzwar
* added s3 plan ([2db9900](https://github.com/golde-dev/golde/commit/2db9900aad9cdf7569b80171e0fcb0842e98ae29)) - by @chyzwar
* added s3Object example ([7119bc3](https://github.com/golde-dev/golde/commit/7119bc3d302b3446ebdeca59c5b79a612d035d8a)) - by @chyzwar
* added some initial support for s3 buckets ([22c0aae](https://github.com/golde-dev/golde/commit/22c0aae7bf4ce9e7305e71066cf14dcd1bf4aed5)) - by @chyzwar
* added spec for dns and buckets ([71397c9](https://github.com/golde-dev/golde/commit/71397c9b772a277fb34406527f806dbb19cc0aac)) - by @chyzwar
* added tags to cloudflare configs: ([728dca8](https://github.com/golde-dev/golde/commit/728dca89d3f74a19552df2bbf15788a1b040269a)) - by @chyzwar
* added tar and basic cli ([2781afa](https://github.com/golde-dev/golde/commit/2781afa918ffb33cdc8b93055708df1650ac1a94)) - by @chyzwar
* added templating using regex ([70998c3](https://github.com/golde-dev/golde/commit/70998c39ef06c90074646977063fa8e837b36f0b)) - by @chyzwar
* **agent,cli:** refactor to pino logger, remove more deno modules ([f48f842](https://github.com/golde-dev/golde/commit/f48f842f57f573221d34fa35b28b13134e7dfde7)) - by @chyzwar
* **agent,cli:** replace Deno.* APIs with Node.js equivalents in source files ([d9e7ccb](https://github.com/golde-dev/golde/commit/d9e7ccbba023947487a1560e8646bb2869d45e21)) - by @chyzwar
* **agent:** added all serice options, added support for numbr in ini ([f56a2fa](https://github.com/golde-dev/golde/commit/f56a2fa83de38ebf4e927cb29a17094a93a9cc96)) - by @chyzwar
* **agent:** basic test ([cd820ce](https://github.com/golde-dev/golde/commit/cd820ce8b699c69b2687ed66cdac9e639e9da6c6)) - by @chyzwar
* **agent:** convert to cli, align log args ([7660d1f](https://github.com/golde-dev/golde/commit/7660d1f3b1a88a02f652914b58442c685c276931)) - by @chyzwar
* **agent:** install and upgrade for agent ([697cc3d](https://github.com/golde-dev/golde/commit/697cc3df3c25be0b2a6eaa8a911b3f6a6c348699)) - by @chyzwar
* **agent:** integrated with new systemd packages ([86d44c2](https://github.com/golde-dev/golde/commit/86d44c2f6d8caefa796fe16894523ed25c5e9651)) - by @chyzwar
* **agent:** timer and updater ([f1a18ca](https://github.com/golde-dev/golde/commit/f1a18ca1c6c0729312b3e2de1e03f3bbb1bebf71)) - by @chyzwar
* **agent:** tweak agent build and package ([1eceff7](https://github.com/golde-dev/golde/commit/1eceff769b3757e2cedf3d71df4d39257b6b75ad)) - by @chyzwar
* **agent:** work on systemd services ([d565340](https://github.com/golde-dev/golde/commit/d565340b2b9021def2ddaebb5e717209afa6cd36)) - by @chyzwar
* apply on fs state provider ([ee672da](https://github.com/golde-dev/golde/commit/ee672da06d9d6d898b40013dfd33c40c4012db30)) - by @chyzwar
* apply work on result ([71f913f](https://github.com/golde-dev/golde/commit/71f913fe9d92f522a7571de47b3893738064cf77)) - by @chyzwar
* ask for confirmation before appying plan ([63199e2](https://github.com/golde-dev/golde/commit/63199e2098a307b3547319ba34c88a2823b41fec)) - by @chyzwar
* aws added permision check for resources ([9478c1d](https://github.com/golde-dev/golde/commit/9478c1dfb6997f02715d0f743eb82700d1ae2bfa)) - by @chyzwar
* baseline publish ([05c59a5](https://github.com/golde-dev/golde/commit/05c59a5c9769999c56b869b165a5222c9bc338f3)) - by @chyzwar
* basic lambda handling ([a072d0a](https://github.com/golde-dev/golde/commit/a072d0a7b75b782a47e5c49d86848f486bce87f9)) - by @chyzwar
* blueprint for deployer ([6f1c5a4](https://github.com/golde-dev/golde/commit/6f1c5a40724aca46f8359e17e554db43a0e5ef76)) - by @chyzwar
* boostrap container ([c2fb2ed](https://github.com/golde-dev/golde/commit/c2fb2ed20a576eb4d8518ad3b04fc004a9f3b318)) - by @chyzwar
* build docker image ([615c880](https://github.com/golde-dev/golde/commit/615c8802ec34672b470498a33462d2c5fa26229e)) - by @chyzwar
* **cli, agent:** install scripts ([e6721fe](https://github.com/golde-dev/golde/commit/e6721fe1a2fed971bdc52de8ffa4a2e6b5a82aa6)) - by @chyzwar
* **cli,agent:** migrate from pino to winston ([3c6052d](https://github.com/golde-dev/golde/commit/3c6052d04787d13d35aeb8d9cb22413035a0ad13)) - by @chyzwar
* **cli:** add maxVersions support, upgrade zod to v4, replace Deno APIs with Node.js equivalents ([aba9dab](https://github.com/golde-dev/golde/commit/aba9dab5f623373ddcb0408bd5bb5cc88613f073)) - by @chyzwar
* **cli:** added compressions to object, updat deps, fixed tests ([0366f3a](https://github.com/golde-dev/golde/commit/0366f3aba5a24154daa3024b2f723500c989514c)) - by @chyzwar
* **cli:** basic init command ([a303000](https://github.com/golde-dev/golde/commit/a303000bc9cbd4ea8ed7901c46c01fff93e155fe)) - by @chyzwar
* **cli:** continuation on s3Object, draft reading ([73291f4](https://github.com/golde-dev/golde/commit/73291f4eedcebf6d47738f503f677b0aba438d27)) - by @chyzwar
* **cli:** continue work on cloudflare dns ([05b3a0c](https://github.com/golde-dev/golde/commit/05b3a0ce210fa0351f69f9d2bf96d6c0ff2375ad)) - by @chyzwar
* **cli:** define types for docker images ([25a7e2f](https://github.com/golde-dev/golde/commit/25a7e2f868a0577a37f8187b81eea8ef85624044)) - by @chyzwar
* **cli:** deployer state mangment ([f3a9315](https://github.com/golde-dev/golde/commit/f3a9315b244c6416532e5d9e92f73240cf48b3ee)) - by @chyzwar
* **cli:** draft plan for s3objet ([63f42c9](https://github.com/golde-dev/golde/commit/63f42c95e8e72d6063514db7ce40663b6b8f056e)) - by @chyzwar
* **cli:** enchance config loading ([48ee80d](https://github.com/golde-dev/golde/commit/48ee80d4576b7aa734ead5d3bb3dbd0ecd54acac)) - by @chyzwar
* **cli:** equal for s3 object ([9a9afc4](https://github.com/golde-dev/golde/commit/9a9afc48838677d871ce363fa0354d4dc67b9fe3)) - by @chyzwar
* **cli:** finish init of context, mock deployer ([e80315e](https://github.com/golde-dev/golde/commit/e80315efcca05d06524e047abbe564f68383d68c)) - by @chyzwar
* **cli:** handle complex templates ([81bd9bd](https://github.com/golde-dev/golde/commit/81bd9bd17b8f6e6d3c814ff0f13358fd4c9e5c7e)) - by @chyzwar
* **cli:** handle custom location of config ([16a5ae2](https://github.com/golde-dev/golde/commit/16a5ae2d95ff2b32f443457e012dcca53d49affd)) - by @chyzwar
* **cli:** handle dns in cloudflare ([24aeccf](https://github.com/golde-dev/golde/commit/24aeccf6e1d0dbbc4e8176f3902e364ceb94ea4e)) - by @chyzwar
* **cli:** handle updates for local examples ([b80a7e4](https://github.com/golde-dev/golde/commit/b80a7e434836ed8fd886cdb556ef32cc3500cd72)) - by @chyzwar
* **cli:** implement validation in cli ([1fb2e15](https://github.com/golde-dev/golde/commit/1fb2e15cd00c5a9af264df77765b8e7c7fca892e)) - by @chyzwar
* **cli:** improve templating ([014a9c6](https://github.com/golde-dev/golde/commit/014a9c682f431d73834a714481cf24983fe8dc98)) - by @chyzwar
* **cli:** init command ([0987946](https://github.com/golde-dev/golde/commit/09879462ddf43b4ca3a4d824e747092bd7ed44a6)) - by @chyzwar
* **cli:** initial support for dns ([55898bf](https://github.com/golde-dev/golde/commit/55898bf8694da8328ffd34d6d068f9f846bfad8c)) - by @chyzwar
* **cli:** initial support for output ([1e9515a](https://github.com/golde-dev/golde/commit/1e9515ad4ecbec5559bc53f5979fdcc7f1584b85)) - by @chyzwar
* **cli:** initial version of s3 object resources ([c1c6238](https://github.com/golde-dev/golde/commit/c1c623840d9e1c82370d6bfc060abe4e293bdf84)) - by @chyzwar
* **cli:** intial toml support, fix cloudflare error handling ([82c14b6](https://github.com/golde-dev/golde/commit/82c14b6fcac285421f787c9d64929807798583a4)) - by @chyzwar
* **cli:** json init ([b824ba6](https://github.com/golde-dev/golde/commit/b824ba64b5d413ff133e53c6c1088621fbee05f6)) - by @chyzwar
* **cli:** local install cli ([133a319](https://github.com/golde-dev/golde/commit/133a31921751d72116da47581886b194248d7c3a)) - by @chyzwar
* **cli:** memoize zone request ([408b2e6](https://github.com/golde-dev/golde/commit/408b2e60cab2deb381f6e60343dcd67b161a7e27)) - by @chyzwar
* **cli:** migrate to pino for logger ([a1c0f98](https://github.com/golde-dev/golde/commit/a1c0f984402ba3f4dfb05f9f41c116b27f3c8302)) - by @chyzwar
* **cli:** new provider state init ([7243308](https://github.com/golde-dev/golde/commit/724330839de88e68a5508fd8327deea7b7366af2)) - by @chyzwar
* **cli:** packagig and test ([1af460b](https://github.com/golde-dev/golde/commit/1af460bc3ff4fbbf25b5526b1ee3aeb6a02a4ed0)) - by @chyzwar
* **cli:** plan for changes ([ef98d87](https://github.com/golde-dev/golde/commit/ef98d87e3b5530fd58f1d46257f97b4b3e44c5ba)) - by @chyzwar
* **cli:** planning ([2fe9e21](https://github.com/golde-dev/golde/commit/2fe9e21e40f2a96842f7122a5a96cb255fe4476d)) - by @chyzwar
* **cli:** providers initalisation and error handling ([10bc5cb](https://github.com/golde-dev/golde/commit/10bc5cbd234ce9ab30d25159c39747143ed97176)) - by @chyzwar
* **cli:** refactor docker client and add GHCR client with image executor improvements ([a5fc54a](https://github.com/golde-dev/golde/commit/a5fc54a8c63867e3dc45480b423f058630c03d45)) - by @chyzwar
* **cli:** refactor docker into provider based images ([4410573](https://github.com/golde-dev/golde/commit/441057350ec880568e326801f1f66a0db6085988)) - by @chyzwar
* **cli:** refactor providers ([86c8af3](https://github.com/golde-dev/golde/commit/86c8af3491b70d10b4a837415949d933b31eaf0f)) - by @chyzwar
* **cli:** scripted publish ([2d33fd6](https://github.com/golde-dev/golde/commit/2d33fd6f478f2cffa6d463352ded6559c72b04e1)) - by @chyzwar
* **cli:** start working on providers ([e69cc56](https://github.com/golde-dev/golde/commit/e69cc56bc92d8204511a0f9f96711c17c6539803)) - by @chyzwar
* **cli:** start working on state handling ([2e9bdf5](https://github.com/golde-dev/golde/commit/2e9bdf5de37472b369c878a4ea7a1676927190b8)) - by @chyzwar
* **cli:** support multiple DNS records per zone/subdomain for load balancing ([9bf8b2c](https://github.com/golde-dev/golde/commit/9bf8b2c5f27f2a595973a6658d87c7613b26813a)) - by @chyzwar
* **cli:** update log format ([e168db0](https://github.com/golde-dev/golde/commit/e168db0f28fb3b6f63a106689bd5947bf83b7ffd)) - by @chyzwar
* complete transition to deno ([805e532](https://github.com/golde-dev/golde/commit/805e532d4fbd663093e6d256cd9a24bcc21486f2)) - by @chyzwar
* create basic systemd files ([cccfcf1](https://github.com/golde-dev/golde/commit/cccfcf13e135b4ed025752e9c002bd28ce3aaad5)) - by @chyzwar
* create object state from resources ([497d403](https://github.com/golde-dev/golde/commit/497d403c200f7e0911f3adebc91ea64bad0ba079)) - by @chyzwar
* create object state from resurces ([541ea14](https://github.com/golde-dev/golde/commit/541ea14f94ab412d553efebd7c553306f92b8600)) - by @chyzwar
* cusom config location ([b0ceac7](https://github.com/golde-dev/golde/commit/b0ceac74541418df3b847bfedd2689c372bc31e6)) - by @chyzwar
* define result type for plan execution, updat yarn config, tweaks to branch resolution ([dbdae5f](https://github.com/golde-dev/golde/commit/dbdae5f5c271476f3a58e222bfa3b68aae5e7289)) - by @chyzwar
* define structure for outputs ([1dab0b4](https://github.com/golde-dev/golde/commit/1dab0b4776072b2a024b056cbd77e0e01454e68e)) - by @chyzwar
* docker boilerplate ([b7b587f](https://github.com/golde-dev/golde/commit/b7b587f2a207b2832cd12cd9b322048d41a02c14)) - by @chyzwar
* **docs:** bootstrap docs ([4f28409](https://github.com/golde-dev/golde/commit/4f28409bddccda7c039ea675596a06b2bd3ee0bf)) - by @chyzwar
* error handling on hcloud ([97a6c36](https://github.com/golde-dev/golde/commit/97a6c36ef9185b158b14dd6b9dc8cbb323b386e3)) - by @chyzwar
* **examples:** added example for config formats ([84feb95](https://github.com/golde-dev/golde/commit/84feb955bd9e24afe2cb1c614371a1d29163cbad)) - by @chyzwar
* **examples:** added inital example for vite-react-config ([dcd2289](https://github.com/golde-dev/golde/commit/dcd2289474f3efd766794ddaf141807beb1c09c9)) - by @chyzwar
* **examples:** update git for cloudflare ([802cad5](https://github.com/golde-dev/golde/commit/802cad5de13a1e81246de1c4529487a94fc17ff2)) - by @chyzwar
* finish refactor aws, cloudflare resource organisation ([cafcc58](https://github.com/golde-dev/golde/commit/cafcc58384b4af193f4919bf393f7a9d6fee832e)) - by @chyzwar
* finish refactoring clients ([7be861e](https://github.com/golde-dev/golde/commit/7be861e194466f0ef6bedbb22c4eac80f58e9617)) - by @chyzwar
* first pass on route translate ([4f8b5ab](https://github.com/golde-dev/golde/commit/4f8b5ab5b185fc468ecca0ffa252d71e2a6c573d)) - by @chyzwar
* fix compilation errors for cli packagin, inttroduce mixim pattern ([c568366](https://github.com/golde-dev/golde/commit/c5683665e815946ca72b3a9faf11dfcee4820bcc)) - by @chyzwar
* fix handling of empty responses, fix logger level change, print plan ([affc1da](https://github.com/golde-dev/golde/commit/affc1da7f65d9ec8dd479a77922b587debccba94)) - by @chyzwar
* fix handling of empty responses, fix logger level change, print plan ([056504c](https://github.com/golde-dev/golde/commit/056504c69955fd2812d3cc9bde9d49d46198e3d1)) - by @chyzwar
* formalize state mangement ([4d3bcbc](https://github.com/golde-dev/golde/commit/4d3bcbc0bc6beff8c6009c7515a9bfc52dac602f)) - by @chyzwar
* generic object execution for r2 objects ([a10fcde](https://github.com/golde-dev/golde/commit/a10fcde6d9a24dfef8cad2b711ef7208588d0502)) - by @chyzwar
* handle cloudflare client ([a08d0e2](https://github.com/golde-dev/golde/commit/a08d0e2c38494a5a16a41573d64619f98b93d2ad)) - by @chyzwar
* handle docker image build errors ([3535a29](https://github.com/golde-dev/golde/commit/3535a2956de73c7c7c1fe1295c03935d6b96048e)) - by @chyzwar
* handle nested templates, add support for managed config templates ([9c3bfd8](https://github.com/golde-dev/golde/commit/9c3bfd82b54c1d926d29c824a6a9b070b709fc3b)) - by @chyzwar
* handle s3 planning ([d430642](https://github.com/golde-dev/golde/commit/d430642bb8b384f996c4b76f9250dbb8e65b7ebd)) - by @chyzwar
* handle typescript config ([e6db426](https://github.com/golde-dev/golde/commit/e6db4266c093761cf672f5e2f1c845c3a0ef001f)) - by @chyzwar
* hetzner types and client work ([755f4e2](https://github.com/golde-dev/golde/commit/755f4e2f13674da3b648bab99c802f69ac653d27)) - by @chyzwar
* impl s3 bucket support, quick local compilation ([65024cd](https://github.com/golde-dev/golde/commit/65024cd05201487f21b94d015a617aa7fd35083f)) - by @chyzwar
* implement buckets planner ([8e8d879](https://github.com/golde-dev/golde/commit/8e8d879db4697e6a7a3306e2a5e594829d71ebab)) - by @chyzwar
* implement cloudwatch log group ([ab10aaa](https://github.com/golde-dev/golde/commit/ab10aaae011420c2a878faab3616458e9642b5d4)) - by @chyzwar
* implement generic plan for docker images ([cd2b351](https://github.com/golde-dev/golde/commit/cd2b35124780bcafd607ae8ad02b29bd51863c14)) - by @chyzwar
* implement iam role for aws provider ([a0e8c9b](https://github.com/golde-dev/golde/commit/a0e8c9b6b2e3a403b89122b1a0f135717cad2094)) - by @chyzwar
* implemnt deps loading and recursive plan ([87c714c](https://github.com/golde-dev/golde/commit/87c714ce0421a89ec1216cae4b8cf30cb8422a6c)) - by @chyzwar
* improve compilation process ([1ed5994](https://github.com/golde-dev/golde/commit/1ed59942a02cc26ea65c6389b6a27f63aa0e264e)) - by @chyzwar
* improve execute printing ([d8f336d](https://github.com/golde-dev/golde/commit/d8f336d8c4933a21a1a8a0974cd4652b36ebd9a0)) - by @chyzwar
* improve how error logging is handled in client ([20b460e](https://github.com/golde-dev/golde/commit/20b460e2013752c4a4bfae789cab0a12d4f2aa85)) - by @chyzwar
* improve install and publish ([ab7d7a7](https://github.com/golde-dev/golde/commit/ab7d7a76da0dbc0ba88104664f4c75f48865595b)) - by @chyzwar
* improve logging and s3 upload ([e793614](https://github.com/golde-dev/golde/commit/e793614250716903f2e88c7e11da2806159377d1)) - by @chyzwar
* improve nadling of artifacts to support diffrent os ([b2240e1](https://github.com/golde-dev/golde/commit/b2240e1cdafe105f26a18809da8712548e35220f)) - by @chyzwar
* init repo ([759ccd3](https://github.com/golde-dev/golde/commit/759ccd3c8e8785a1e569d8e329fa532aa003f790)) - by @chyzwar
* initial execution plan ([5ddb1b5](https://github.com/golde-dev/golde/commit/5ddb1b5af0d9f1d7a481fc16b87a3447c1acc2e1)) - by @chyzwar
* initial implentation of lambda function ([03d8008](https://github.com/golde-dev/golde/commit/03d8008e7987fc1a1a7e80e529f223feb43a9d98)) - by @chyzwar
* initial version of artifacts, update packages, vendor/fork dynamic import to reduce size ([678af7c](https://github.com/golde-dev/golde/commit/678af7ce1ee99f34de22f3e2f9b258dd04a6b3c1)) - by @chyzwar
* introduce generic resources ([63bdaa8](https://github.com/golde-dev/golde/commit/63bdaa86bf0855f0e04ed2693aa3379f6dc2ea23)) - by @chyzwar
* introduce versioned resources, refactor structure for nested services approach ([a26bf7a](https://github.com/golde-dev/golde/commit/a26bf7a39e0cea046ab841c8bd76653214306037)) - by @chyzwar
* licence and publish ([d8bc209](https://github.com/golde-dev/golde/commit/d8bc20995541b9db67b64826a33a43a4aaebbba0)) - by @chyzwar
* local version based on temp local.json file ([af62f3f](https://github.com/golde-dev/golde/commit/af62f3f2733cf079c494cf82e52f06f0b7a53aa1)) - by @chyzwar
* logging improvements json format and pretty, publishin ([3ffa570](https://github.com/golde-dev/golde/commit/3ffa57070c4df3d2c2df1bb9b65f2bcf622e0d89)) - by @chyzwar
* match path for dependacies, initial dependadencies resolution ([d144243](https://github.com/golde-dev/golde/commit/d144243cb0eba2675150261f276112b0d5d340a8)) - by @chyzwar
* more on error handling, project creation ([c36f659](https://github.com/golde-dev/golde/commit/c36f6596d6e783932c5966a59990a74e6f1ac0e0)) - by @chyzwar
* move more clients to mixin pattern ([4255dff](https://github.com/golde-dev/golde/commit/4255dff7ba4c5e7980cc71d61128e3a9e4f8f676)) - by @chyzwar
* new approach for dns config and state ([a52d178](https://github.com/golde-dev/golde/commit/a52d178dea0c264461d635d3b059ea2e51ae6c7c)) - by @chyzwar
* new aproach to state ([8af2dc3](https://github.com/golde-dev/golde/commit/8af2dc3e84b46d6dd984f9c43ac577fe8b03c648)) - by @chyzwar
* package update ([bec1766](https://github.com/golde-dev/golde/commit/bec17667545711a3779dac2287cd5b9a2903ca5a)) - by @chyzwar
* progress towards actual execution of plan ([481a30a](https://github.com/golde-dev/golde/commit/481a30a710c603c9ba00e5ae84b5132925d83bad)) - by @chyzwar
* project rename lose ends ([b97a0cc](https://github.com/golde-dev/golde/commit/b97a0cc36cadf540ab195b1018d3b37ccde40ea9)) - by @chyzwar
* properly calculate hash of file ([bff0c0f](https://github.com/golde-dev/golde/commit/bff0c0f02bcac1b0709ab84bb91bcfdfc7fc55eb)) - by @chyzwar
* publish to downloads ([00e6b0a](https://github.com/golde-dev/golde/commit/00e6b0a3efaa998f30e2bbceabb384c978fb9261)) - by @chyzwar
* quick watcher, cloudflare dns fix path ([44ac5e2](https://github.com/golde-dev/golde/commit/44ac5e2780bb140a4624e321bf539f39dc8a78e4)) - by @chyzwar
* r2 buckets creation tests ([1cd5362](https://github.com/golde-dev/golde/commit/1cd5362fec129966c157db3132d17e47649a71e5)) - by @chyzwar
* reafactor from config by type to config by provider organization ([1b3a491](https://github.com/golde-dev/golde/commit/1b3a491fe812d7ec1b34aff87a5b075d086f2c09)) - by @chyzwar
* reduce deps on deno.js std, build errors ([b59906e](https://github.com/golde-dev/golde/commit/b59906ee1996464a02095847b85c64764808a1d5)) - by @chyzwar
* refacotr path matching to use fully path and simplyfy escaping of . ([a82542a](https://github.com/golde-dev/golde/commit/a82542afcca44f5adf3bdf8211d366ba62375c44)) - by @chyzwar
* refacto and handle match for dns ([4f84ad4](https://github.com/golde-dev/golde/commit/4f84ad4ff343d16e487f19412ab8719bd8abd4e9)) - by @chyzwar
* refactor branch logic ([f9a8e10](https://github.com/golde-dev/golde/commit/f9a8e10f914f39766e3a8b876bbf68aa02f1a865)) - by @chyzwar
* refactor config to allow testing ([e779d19](https://github.com/golde-dev/golde/commit/e779d1921b89614b949d3733060b232cc304b771)) - by @chyzwar
* refactor context ([ccd18ea](https://github.com/golde-dev/golde/commit/ccd18ea7abf37901d47779158b2ab29e0979d646)) - by @chyzwar
* refactor examples to follow new converntion ([9fae1e7](https://github.com/golde-dev/golde/commit/9fae1e783c1fbe2e9a51a5ac7754a8a37332dea3)) - by @chyzwar
* refactor of execution context ([415f6e9](https://github.com/golde-dev/golde/commit/415f6e9f02ebbc22842397f3876fd484d255ee65)) - by @chyzwar
* refactor resources ([b7d74cd](https://github.com/golde-dev/golde/commit/b7d74cd521482418be9ff81ed0e80912b8a8ef70)) - by @chyzwar
* refactor to monorepo ([64eedeb](https://github.com/golde-dev/golde/commit/64eedebc3eec4592752b89e0402f8b824df2cc8e)) - by @chyzwar
* refactor to use double plan instead ([9b2183a](https://github.com/golde-dev/golde/commit/9b2183a506ab44b461203a8921f1b8e376436fb4)) - by @chyzwar
* refine state management ([1ef790c](https://github.com/golde-dev/golde/commit/1ef790c42dfb7dff8e74bfc738fcb23633c81abe)) - by @chyzwar
* remove @std/path ([1035103](https://github.com/golde-dev/golde/commit/1035103930a25383bff9717f60e9a919286fb98d)) - by @chyzwar
* remove local and only use dev runner task ([ca5f54a](https://github.com/golde-dev/golde/commit/ca5f54a07c1cd117a99f9419f3b03a3da158929b)) - by @chyzwar
* remove moderndash, finish docker create version ([dcecf5d](https://github.com/golde-dev/golde/commit/dcecf5d91842ef5019508af8cecb153547221cc9)) - by @chyzwar
* rename to golde ([cf1f8da](https://github.com/golde-dev/golde/commit/cf1f8da843e1f440e72d58051d724a9990ca8809)) - by @chyzwar
* rename vscode workspace ([78c4235](https://github.com/golde-dev/golde/commit/78c4235a2b1e574bc60db577be4ffd3a9d62c5f1)) - by @chyzwar
* resolve deps in initial plan ([8fa19a9](https://github.com/golde-dev/golde/commit/8fa19a9583365042b55c28dd366b3a3ccc2e932b)) - by @chyzwar
* resolve noop deps in planning phase ([04744fd](https://github.com/golde-dev/golde/commit/04744fd54ab3071c6b0fdc6ba0e469c34aa16e2b)) - by @chyzwar
* route53 client ([dbd4253](https://github.com/golde-dev/golde/commit/dbd4253619a91f425d0423953744d9376d4f7ae4)) - by @chyzwar
* s2 object definitions ([a8cedf5](https://github.com/golde-dev/golde/commit/a8cedf5c085d4f0835117f4d464630f591ecf8e6)) - by @chyzwar
* simplistic apply changes ([5d1f3ad](https://github.com/golde-dev/golde/commit/5d1f3ad7114275df3aae030f44e0334a81b28275)) - by @chyzwar
* start working on s3 object ([9663242](https://github.com/golde-dev/golde/commit/9663242899174769fd47550451026704e6e45006)) - by @chyzwar
* state managment moved outside of providers, refactor providers into facotry functions ([ba660fd](https://github.com/golde-dev/golde/commit/ba660fd65652d4e4cfc73fb3b226c1f33bffb6e7)) - by @chyzwar
* support for d1 database ([9a90620](https://github.com/golde-dev/golde/commit/9a9062074558e0e4a0d2f9714cce6cd3534ba0f9)) - by @chyzwar
* tweak init ([51b491d](https://github.com/golde-dev/golde/commit/51b491d5f0ea34c1e5c9e5b2f2710417a8eccdc9)) - by @chyzwar
* tweaks to generic object ([b1fc677](https://github.com/golde-dev/golde/commit/b1fc6770169bdafef37abf42d4af801012838c8e)) - by @chyzwar
* update examples ([dfbedca](https://github.com/golde-dev/golde/commit/dfbedca73f9a646239fe1445e3dc0f3e0bce8fc9)) - by @chyzwar
* update examples with new resources structure ([451a6a0](https://github.com/golde-dev/golde/commit/451a6a0032f0dc841d952b1602890ad36f6a0514)) - by @chyzwar
* update fs ans s3 state managers ([394a226](https://github.com/golde-dev/golde/commit/394a226849dec572854efed0ace0546e34cd0cb6)) - by @chyzwar
* update types and paths ([bc61e1e](https://github.com/golde-dev/golde/commit/bc61e1ecc54a4863c07af344154f9eac8bda90c1)) - by @chyzwar
* upgrade zod to v4 ([a4677e5](https://github.com/golde-dev/golde/commit/a4677e51a655135f2ab4f3775cec55b8f3c587fd)) - by @chyzwar
* use zod instead of json schema, easier to write ([89fd128](https://github.com/golde-dev/golde/commit/89fd1287a44b8639a8b427884fd5e578cf55add1)) - by @chyzwar

### Bug Fixes

* **ci:** improve GitHub workflow configs and re-enable publish pipeline ([cc7c2eb](https://github.com/golde-dev/golde/commit/cc7c2ebafbe5297a2b76b2f64be7097ec3a66579)) - by @chyzwar
* **cli:** fix failing tests and update README examples ([a39ed23](https://github.com/golde-dev/golde/commit/a39ed232c0940b459f633aae0f99192321633bc6)) - by @chyzwar
* fixed tests ([b63e6e6](https://github.com/golde-dev/golde/commit/b63e6e6ca7d2c3635ae36ad2c9208358add5f69a)) - by @chyzwar
