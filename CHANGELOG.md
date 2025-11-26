# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.2.1...v1.3.0) (2025-11-26)


### Features

* new UI: Extend tooltips, fix techtree navigation, add castle/imperial tech selection, and implement flexible bonus multipliers ([#88](https://github.com/fritz-net/AoE2-Civbuilder/issues/88)) ([86278a8](https://github.com/fritz-net/AoE2-Civbuilder/commit/86278a822cdf935ad32d8c0a706052ec98a63247))

## [1.2.1](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.2.0...v1.2.1) (2025-11-25)


### Bug Fixes

* new UI mod creation: handle [id, multiplier] bonus format and missing failure callback ([#91](https://github.com/fritz-net/AoE2-Civbuilder/issues/91)) ([d077f83](https://github.com/fritz-net/AoE2-Civbuilder/commit/d077f83c76f2052c5766379898a3e6c626f45c62))

## [1.2.0](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.1.0...v1.2.0) (2025-11-25)


### Features

* add civ, team bonus, and unique unit selectors for new UI ([#79](https://github.com/fritz-net/AoE2-Civbuilder/issues/79)) ([4157c04](https://github.com/fritz-net/AoE2-Civbuilder/commit/4157c0448d3b35ef8d72413a1e3c749e85b90c53))
* add crosslinks between UI v1 and v2 ([#87](https://github.com/fritz-net/AoE2-Civbuilder/issues/87)) ([8131a1d](https://github.com/fritz-net/AoE2-Civbuilder/commit/8131a1d252b58e0415bb1e4401cb330451d76791))
* create Vue component for existing techtree ([#80](https://github.com/fritz-net/AoE2-Civbuilder/issues/80)) ([89c02b4](https://github.com/fritz-net/AoE2-Civbuilder/commit/89c02b48bd6e68a7823e9bd190ef8132c830fc9b))


### Bug Fixes

* villager aura balancing - "Villagers work faster when nearby other villagers" ([#90](https://github.com/fritz-net/AoE2-Civbuilder/issues/90)) ([c366a5e](https://github.com/fritz-net/AoE2-Civbuilder/commit/c366a5e8aaee8644aaa160dd22f830dfaea43a98))

## [1.1.0](https://github.com/fritz-net/AoE2-Civbuilder/compare/v1.0.0...v1.1.0) (2025-11-25)


### Features

* Add civilization builder components with stepper navigation and bonus selectors ([#76](https://github.com/fritz-net/AoE2-Civbuilder/issues/76)) ([4dd9f38](https://github.com/fritz-net/AoE2-Civbuilder/commit/4dd9f38b0a547b752c9fd6fdec2f5005174280be))


### Bug Fixes

* Add redirect from / to /civbuilder/ for legacy frontend ([0450dad](https://github.com/fritz-net/AoE2-Civbuilder/commit/0450dad99fb3973866053f8e48f3f12a48913416))
* Home screen buttons fit without vertical scroll ([77a2b5b](https://github.com/fritz-net/AoE2-Civbuilder/commit/77a2b5b058824b0668506ce87700947112192920))
* Make text selectable by removing user-select: none ([59c0ce0](https://github.com/fritz-net/AoE2-Civbuilder/commit/59c0ce0e08c7dc75a9b2b353b23a97dae8460084))
* Pages scroll the entire page, not inner container; changelog shows sections ([6345c61](https://github.com/fritz-net/AoE2-Civbuilder/commit/6345c61af36fd272bde4842b93ff584de6349028))

## 1.0.0 (2025-11-24)


### Features

* Add DAT file extraction tool with enum generator and refactor civbuilder to use generated enums ([#39](https://github.com/fritz-net/AoE2-Civbuilder/issues/39)) ([465e114](https://github.com/fritz-net/AoE2-Civbuilder/commit/465e1143e733c91fad4fe8fda9ab924146d6e6b3))
* add enum for civBonuses array indices ([#33](https://github.com/fritz-net/AoE2-Civbuilder/issues/33)) ([6620269](https://github.com/fritz-net/AoE2-Civbuilder/commit/6620269049cd7cd5ea690742258c11c2b4260348))
* add release-please automation and convert update log to dynamic changelog ([#66](https://github.com/fritz-net/AoE2-Civbuilder/issues/66)) ([124d8ee](https://github.com/fritz-net/AoE2-Civbuilder/commit/124d8ee1614a88568387f5c376426b7fe6015618))
* added github actions ([35e30b7](https://github.com/fritz-net/AoE2-Civbuilder/commit/35e30b7912d4dfdca36a35ef906b9d42be02563f))
* added older dat files ([34837d5](https://github.com/fritz-net/AoE2-Civbuilder/commit/34837d5ea4339428501266acf64cf93894c1415d))
* better docker layer caching ([7984d00](https://github.com/fritz-net/AoE2-Civbuilder/commit/7984d003d1fdccc2a52afff916d43f5dbf29fc24))
* better layering ([890d6db](https://github.com/fritz-net/AoE2-Civbuilder/commit/890d6db54222722541ea0ee23af1488b4c275664))
* configurable paths ([6d98d1b](https://github.com/fritz-net/AoE2-Civbuilder/commit/6d98d1bceb8da3f61a04402e260406fdba7c74a7))
* gdb added ([dd98edd](https://github.com/fritz-net/AoE2-Civbuilder/commit/dd98edd2308e0d2701fde2e8a7be292eeb4f92a0))
* github_actions and some other small changes ([c4a5264](https://github.com/fritz-net/AoE2-Civbuilder/commit/c4a5264cde87b23f40157c2d3e238c6c1d8e9645))
* gundpower units +1 damage per uni tech ([c3c3af1](https://github.com/fritz-net/AoE2-Civbuilder/commit/c3c3af1ff6e57ca602299f3a446a1cca92fda606))
* initial dockerfiles ([6c686bf](https://github.com/fritz-net/AoE2-Civbuilder/commit/6c686bff11463584bd5e59b742cad71d1e2f3d43))
* route subdir via hostname ([bc4c560](https://github.com/fritz-net/AoE2-Civbuilder/commit/bc4c56069f5a670099bc7245b7804e025c90db79))


### Bug Fixes

* add missing research location initialization for Tech instances ([#26](https://github.com/fritz-net/AoE2-Civbuilder/issues/26)) ([6d16c0b](https://github.com/fritz-net/AoE2-Civbuilder/commit/6d16c0bbc65a214eb4df8226bf1c48d9bc60a9b8))
* added missing json lib ([dd4926a](https://github.com/fritz-net/AoE2-Civbuilder/commit/dd4926ad20e65bd9f4d8497c821ea6e843959b1d))
* added missing shutdown handler ([c8cb64b](https://github.com/fritz-net/AoE2-Civbuilder/commit/c8cb64b3e2c3acb09f3f4ca9ade76c7d31fcc8cb))
* also clone submodule in CICD ([27fb238](https://github.com/fritz-net/AoE2-Civbuilder/commit/27fb238629a4606dcbc3c74599749c48e673319d))
* another path fix ([81bb4f6](https://github.com/fritz-net/AoE2-Civbuilder/commit/81bb4f6b005ed31ef6d00533faa8c36d6c3d5e24))
* calling of `./process_mod/createModFolder.sh` ([65c3f82](https://github.com/fritz-net/AoE2-Civbuilder/commit/65c3f8221a59ef5ff92b536046b811ad4757a201))
* change app dir ([5491a87](https://github.com/fritz-net/AoE2-Civbuilder/commit/5491a873cc416edb21695da3b549cf0236170628))
* cleanup, removed gdb ([9fd08ad](https://github.com/fritz-net/AoE2-Civbuilder/commit/9fd08ad9cd6888e8a317ce8440cb1737f406576c))
* compiler issue with gunpowder boni ([2a3af53](https://github.com/fritz-net/AoE2-Civbuilder/commit/2a3af53cfdab4874f6e2e88ec3821fcf22aba3f7))
* copy all from modding dir so cpp build works for more then genie utils ([5c21b7c](https://github.com/fritz-net/AoE2-Civbuilder/commit/5c21b7c840889bd3735fb8691acb8292fefbcdb1))
* correct images for draft ([af4a982](https://github.com/fritz-net/AoE2-Civbuilder/commit/af4a982f2c723855df41e2c1299931304d4d6259))
* cpp copy path ([013f520](https://github.com/fritz-net/AoE2-Civbuilder/commit/013f52012031b1d393ae02985e9943879c404e55))
* crash on creation of mod ([133c91f](https://github.com/fritz-net/AoE2-Civbuilder/commit/133c91f65a6c6fce9b77cc6a5fcea2b4754180aa))
* crash on creation of mod ([133c91f](https://github.com/fritz-net/AoE2-Civbuilder/commit/133c91f65a6c6fce9b77cc6a5fcea2b4754180aa))
* crash on creation of mod ([816ad3e](https://github.com/fritz-net/AoE2-Civbuilder/commit/816ad3ebeed1ddbd1b67c6e0b449293c412dc821))
* creat missing temp dir ([c898d58](https://github.com/fritz-net/AoE2-Civbuilder/commit/c898d5867eba085ee997e846fce225c869e2a8b9))
* docker build ([2a71aa1](https://github.com/fritz-net/AoE2-Civbuilder/commit/2a71aa123dab77102c8bf16d8503ebf6b01a7a91))
* docker build without cpp ([b1c1ea6](https://github.com/fritz-net/AoE2-Civbuilder/commit/b1c1ea6407d132b02af781e795be5a78ba3a12d7))
* dockerfile copy order ([a270f55](https://github.com/fritz-net/AoE2-Civbuilder/commit/a270f5576e474b410b7fbb14cba78754b8be551e))
* draft bonus images ([20c7cd4](https://github.com/fritz-net/AoE2-Civbuilder/commit/20c7cd44b284e6ca80b0241568ea82bc7136eb79))
* draft bonus images ([c4f2313](https://github.com/fritz-net/AoE2-Civbuilder/commit/c4f231325f4b6520258b3c1a15a325217c396451))
* draft path creation ([de8a8d3](https://github.com/fritz-net/AoE2-Civbuilder/commit/de8a8d340c21b4ffb934e6f88d0ac547ef644222))
* enabling server to listen ([73497b5](https://github.com/fritz-net/AoE2-Civbuilder/commit/73497b5bbcca9fa04d2ea7aace837c1b88f86b4e))
* folwark cow, all for 10gold ([5858c12](https://github.com/fritz-net/AoE2-Civbuilder/commit/5858c12e38929e1b0512d966f3a9e1b7eb62907c))
* fronted path ([2031519](https://github.com/fritz-net/AoE2-Civbuilder/commit/20315190d141de8d4f6cec583688c874626ea92d))
* frontend routing ([c748e5c](https://github.com/fritz-net/AoE2-Civbuilder/commit/c748e5c282ad3e340c56172c7fd05832f70fccc6))
* frontend url redirects ([5e9eac1](https://github.com/fritz-net/AoE2-Civbuilder/commit/5e9eac1c23b0e4b5f0acae827638e097107a2cae))
* gunpowder +1 attach per uni tech ([91091e5](https://github.com/fritz-net/AoE2-Civbuilder/commit/91091e58d3a26dd58551cb8ca5a0a4952c6be6e0))
* gunpowder uni tech boni blanced ([4760fbb](https://github.com/fritz-net/AoE2-Civbuilder/commit/4760fbb32ce11aee28424bd1641cfd7a732a91f2))
* gunpower uni civ boni ([41ec8d5](https://github.com/fritz-net/AoE2-Civbuilder/commit/41ec8d5a7d7295a7454a1b317f17b5045b31e999))
* hostname env var docs ([48885d1](https://github.com/fritz-net/AoE2-Civbuilder/commit/48885d16f527b5f1b228e31243754bf01aba41a4))
* initialize jsoncpp submodule and update includes for new genieutils API ([308ea7f](https://github.com/fritz-net/AoE2-Civbuilder/commit/308ea7ffa36074d7d9d13188e959a51562780b0b))
* json runtime deps added ([4ff6bcf](https://github.com/fritz-net/AoE2-Civbuilder/commit/4ff6bcfaa80583c2c1d6e41e4af4fab33ef29bd8))
* lang string for UinqueUnits ([4adb770](https://github.com/fritz-net/AoE2-Civbuilder/commit/4adb77093cd0593c01a7913fe47a2c5e4eb2f7c3))
* line ending issue ([528be0c](https://github.com/fritz-net/AoE2-Civbuilder/commit/528be0c282cbaaafb9d0a882d9733d4da97682f1))
* merge conflicts `osUtil.execCommand` ([0678f92](https://github.com/fritz-net/AoE2-Civbuilder/commit/0678f923bfba5ce1a632c52ae30227fbca9829b8))
* missing zip ([f31f127](https://github.com/fritz-net/AoE2-Civbuilder/commit/f31f1271cfb8889a6072aed615d88ef3126f42d7))
* mod folder creation ([d9ffb26](https://github.com/fritz-net/AoE2-Civbuilder/commit/d9ffb26eab872c5aae7cf0dc89597ca823a025b9))
* more dos2unix fixes ([70deab0](https://github.com/fritz-net/AoE2-Civbuilder/commit/70deab02395b979fd0c62b051e8d678125794957))
* more dos2unix fixes ([fcca59c](https://github.com/fritz-net/AoE2-Civbuilder/commit/fcca59ceea5588a0d0549d8b771bda37ea874cfe))
* names of imperial units ([982aef3](https://github.com/fritz-net/AoE2-Civbuilder/commit/982aef301ed0a499d88174f0cbcaabdbef2b5916))
* obsidian arrows just for archer line not all footarchers ([#30](https://github.com/fritz-net/AoE2-Civbuilder/issues/30)) ([1d93179](https://github.com/fritz-net/AoE2-Civbuilder/commit/1d93179fce8430d144b39acd1e6497f927d8ce47))
* obsidian arrows just for foot archers ([5bab581](https://github.com/fritz-net/AoE2-Civbuilder/commit/5bab58109b7c4c5f78aa34c01fa72339baca3d6d))
* only push docker on main ([07e6ec2](https://github.com/fritz-net/AoE2-Civbuilder/commit/07e6ec241cf005d39666b0f3e25faa7fcfe6a083))
* order of vars so path gets properly inited ([d2b36c2](https://github.com/fritz-net/AoE2-Civbuilder/commit/d2b36c2e1c8f45a928ea0666c7407d274839dace))
* os functions overlap ([41a0a26](https://github.com/fritz-net/AoE2-Civbuilder/commit/41a0a26b2a93040a63fd4b9c9f9dd2b36d4f4459))
* pasture and early eagle research location ([#40](https://github.com/fritz-net/AoE2-Civbuilder/issues/40)) ([74a1e5f](https://github.com/fritz-net/AoE2-Civbuilder/commit/74a1e5f0afbd6030a00e7698b987942c56fcf69b))
* path for mod folder creation sources ([fc81f3e](https://github.com/fritz-net/AoE2-Civbuilder/commit/fc81f3e4d0aae2ff8cb1253d43ad144b7662ace7))
* removed folwark cows since they already worked ([986f3b8](https://github.com/fritz-net/AoE2-Civbuilder/commit/986f3b8f3bca62055c5e7597195075d85504cc2c))
* removed patching of submodule ([70489c3](https://github.com/fritz-net/AoE2-Civbuilder/commit/70489c35eb158739e72ea6631aad006afdf72883))
* run cicd on all PRs ([f2ab4ff](https://github.com/fritz-net/AoE2-Civbuilder/commit/f2ab4ff943d507f2628edba0fd5d56d31a344278))
* sprites for royal battle elephant ([bf6a509](https://github.com/fritz-net/AoE2-Civbuilder/commit/bf6a509ac32f8beb2b809d641063817122f1fae0))
* squire affects archer tech ([fc5e568](https://github.com/fritz-net/AoE2-Civbuilder/commit/fc5e5688f5a9ea4fa6b0f25c91f6273b1aa52bff))
* train/research location API for latest game version and remove redundant code ([#19](https://github.com/fritz-net/AoE2-Civbuilder/issues/19)) ([2c21d2a](https://github.com/fritz-net/AoE2-Civbuilder/commit/2c21d2aee048c8f2b547fbce6333cb4454ae3be7))
* ui mod path in createModFolder.sh ([1f2c3d7](https://github.com/fritz-net/AoE2-Civbuilder/commit/1f2c3d76bdd093d2312aa0075881240f05ff6907))
* update code to work with genieutils API changes for dat v8.5 ([f801aae](https://github.com/fritz-net/AoE2-Civbuilder/commit/f801aae9ffda4c9986cda99289caf1bf5b45cdd2))
* update genieutils submodule to commit 43bdc0c with CMakeLists.txt fix ([f35970d](https://github.com/fritz-net/AoE2-Civbuilder/commit/f35970dc6658ba55e3b16ea63955c1f5dc318ea4))
* update techtree UU id mappings ([14a3883](https://github.com/fritz-net/AoE2-Civbuilder/commit/14a38834874a8bac0878eff93258fb462198bad3))
* updated submodule ([46d6d69](https://github.com/fritz-net/AoE2-Civbuilder/commit/46d6d69bf504dfa1286eeb3d886cd0e35b192f9e))
* UU fixes for hotkeys, make avail research location ([#21](https://github.com/fritz-net/AoE2-Civbuilder/issues/21)) ([2da8e2d](https://github.com/fritz-net/AoE2-Civbuilder/commit/2da8e2dfe686465c761e7c47f90f84cfb829a1f5))
* voice file copy ([63db379](https://github.com/fritz-net/AoE2-Civbuilder/commit/63db3799fe4b40947cea2a0d6000a1a9aa3551e1))
* wrong cost display for Sosso Guard ([#49](https://github.com/fritz-net/AoE2-Civbuilder/issues/49)) ([109495e](https://github.com/fritz-net/AoE2-Civbuilder/commit/109495e9306459b6451d5f77d139c4097f7ea121))


### Reverts

* remove unnecessary jsoncpp-related changes ([d9d9890](https://github.com/fritz-net/AoE2-Civbuilder/commit/d9d98907a4901bf52f0ff92643d8d037489323ee))

## [Unreleased]

## [0.1.0] (2025-05-02)

### Added
- Updated website with 3K DLC content and April update changes
- Added advanced options to creation -- civilization description, custom wonder, and custom castle selection
- Enabled filtering by civ name for base edition bonuses
- Bonuses initially sorted by edition
- Regional units are colored differently in the technology tree

## [0.0.99] (2025-02-25)

### Added
- Gave bonuses editions to distinguish vanilla bonuses from custom bonuses (and potentially future bonuses)
- Added image caching to improve loading times

## [0.0.98] (2024-05-22)

### Added
- Added a rarity system to bonuses/cards to serve as a guideline in power level

## [0.0.97] (2024-05-19)

### Added
- Added modifiers which can be applied on top of generated civilization mods

## [0.0.96] (2024-05-18)

### Fixed
- Devotion now appropriately gives +5 HP with the Aztec bonus
- Husbandry gives attack speed gives the correct bonus now
- Added free relics to data mod incompatibilities
- Rewrote Inca villager bonus to reflect gameplay
- Moved missionary train location to not overlap with warrior priests
- Fixed missionaries being free with Hussite Reforms

## [0.0.95] (2024-05-14)

### Fixed
- Draft mode works again
- Resolved a bug where spearmen from TCs or villagers wouldn't upgrade
- Photonmen are now classified as gunpowder units for the purposes of bonuses and technologies
- Corvinian Army now works on Warrior Monks and Headhunters
- Hussite Reforms now works on Warrior Priests and Missionaries
- Resolved a bug causing melee Rathas to have infinite armor
- Fixed Bloodlines not included in "fill" feature
- Fixed vanilla civilization icons showing up in selection menu
- Re-fixed civilization descriptions displaying the wrong unique unit
- Fixed blacksmith bonus damage not working on ranged units

## [0.0.94] (2024-05-10)

### Added
- Added a button to enable all techs while editing tech trees

## [0.0.93] (2024-05-03)

### Fixed
- Fixed Crusader Knights being convertible
- Allowed Eupsong to affect Donjons
- Fixed various civilization descriptions displaying the wrong unique unit image
- Allowed Ahosi to be affected by blacksmith attack upgrades
- Fixed side effect of gunpowder university attack bonus giving City Walls
- Moved Shrivamsha train location to not coincide with Knights

## [0.0.92] (2024-04-26)

### Added
- Extended bonus stacking to unique technologies as well

## [0.0.91] (2024-04-18)

### Added
- Added the ability to stack the same bonus multiple times

## [0.0.90] (2024-04-17)

### Fixed
- Fixed a bug where feudal knights were un-upgradable

## [0.0.89] (2024-04-14)

### Added
- Implemented more community suggested bonuses and techs

## [0.0.88] (2024-04-13)

### Added
- Added Khmer farm bonus and 2x2 farms

## [0.0.87] (2024-04-07)

### Added
- Added the ability to upload your own images as flags

## [0.0.86] (2024-03-31)

### Added
- Implemented several community suggested bonuses and techs

## [0.0.85] (2024-03-17)

### Changed
- Updated website for compatibility with AoE2 Update 107882

## [0.0.84] (2024-03-10)

### Changed
- Updated website to work with The Mountain Royals

## [0.0.83] (2023-05-31)

### Changed
- Updated website to work with Return of Rome

## [0.0.82] (2022-11-26)

### Fixed
- Fixed a bug where free eagle upgrades would give extra stats

## [0.0.81] (2022-09-02)

### Changed
- Updated website to conform to AoE2 Update 66694

## [0.0.80] (2022-05-15)

### Fixed
- Fixed a few minor text and graphics inconsistencies

### Changed
- Updated mod generation to be compatible with Dynasties of India update

## [0.0.79] (2022-04-06)

### Added
- Currently selected bonuses display at the top of the page (credit to Steven Jackson for the code!)

## [0.0.78] (2022-03-26)

### Added
- Added 3 new flag symbols

## [0.0.77] (2022-03-22)

### Changed
- Updated default mod thumbnail (thanks to TWest!)

## [0.0.76] (2022-03-21)

### Fixed
- Fixed an issue causing vanilla civ files to become corrupted after editing them
- Updated vanilla civ files to include languages
- Corrected a few rare cases where villager sounds would be from their original civilizations

## [0.0.75] (2022-03-18)

### Fixed
- Removed data incompatibility restriction for Kreposts, Donjons, Anarchy, Marauders, and First Crusade
- Removed all UI incompatibility restrictions
- Fixed some civilizations being able to recruit their unique unit from castles in Dark Age in Regicide

## [0.0.74] (2022-03-17)

### Added
- Added functionality to language selection

## [0.0.73] (2022-03-14)

### Fixed
- Villager's Revenge unique technology no longer crashes the game and works as intended

## [0.0.72] (2022-03-12)

### Fixed
- Corrected a typo in Korean discount bonus
- Changed flamethrowers cost to 150w 25g instead of 150f 25g
- Fixed bug in university gunpowder attack bonus causing it to fail for units with melee attack
- Fixed that new unique techs didn't show up while editing civilizations
- Fixed bug where monks would change regional graphic while converting and galleon graphics didn't align
- Resolved an issue with integrating language selection into draft mode

## [0.0.71] (2022-03-09)

### Fixed
- Fixed an issue with hovering over cards in parts of the screen

## [0.0.70] (2022-03-08)

### Added
- Added 10 new unique technologies

## [0.0.69] (2022-02-15)

### Added
- Added events page for all events related to civbuilder

## [0.0.68] (2022-01-25)

### Added
- Added icon and reflective tab titles

## [0.0.67] (2022-01-16)

### Changed
- Warrior monks now also benefit from monk bonuses unique to civbuilder, Inquisition increases their attack rate

## [0.0.66] (2022-01-15)

### Fixed
- Fixed the filter input location while editing civilizations

## [0.0.65] (2022-01-13)

### Added
- Bonuses, units, and techs can be filtered/searched for

## [0.0.64] (2022-01-12)

### Fixed
- Fixed a bug causing some civilization links to become corrupted
- Allowed civilization viewer and editor to read in .json files with empty values

## [0.0.63] (2022-01-11)

### Added
- Civilizations can now be shared and viewed with direct links rather than .json files
- Added the ability to edit civilization .json files

## [0.0.62] (2022-01-10)

### Changed
- Allowed most 0-cost techs to affect mod generation (techs that cannot affect generation are now untoggleable)

## [0.0.61] (2022-01-08)

### Changed
- Adjusted galley attack bonus to begin in Castle Age

## [0.0.60] (2022-01-07)

### Fixed
- Fixed a bug causing the game to crash if the UI mod is enabled while playing with the 15th modded civilization

## [0.0.59] (2022-01-05)

### Changed
- Updated base data file to reflect changes in Update 56005
- Updated Vanilla .json files to correspond to patch notes
- Matched regional trade carts to civilization architecture set

### Fixed
- Fixed the cost of Varangian Guard

## [0.0.58] (2021-11-14)

### Added
- Added 35 new unique units

## [0.0.57] (2021-10-18)

### Changed
- Adjusted statistics of various custom unique units
- Changed Flamethrower costs to require the gold payment shown in the description

## [0.0.56] (2021-10-17)

### Fixed
- Fixed various typos
- Fixed Serjeants getting auto-upgraded doubly upon hitting Castle Age
- Fixed villagers being unable to garrison in houses despite having the bonus
- Connected empty trade cart graphics to civilization architecture
- Fixed a bug allowing players to recruit dismounted Konniks for free when researching Anarchy or Marauders

## [0.0.55] (2021-10-16)

### Changed
- Updated base data file to reflect changes in Update 54480

## [0.0.54] (2021-09-10)

### Added
- Added Xolotl Warriors, Saboteurs, Ninjas, and Flamethrowers as unique units

## [0.0.53] (2021-09-09)

### Added
- Added Crusader Knights as a unique unit

### Changed
- Adjusted Farimba to give only +3 attack

### Fixed
- Fixed free archer-line upgrades bonus so that it works on crossbows

## [0.0.52] (2021-09-05)

### Changed
- Made Korean stone mining civ bonus affect Polish stone mining gold generation

## [0.0.51] (2021-09-03)

### Added
- Added more symbols to the flag creator

## [0.0.50] (2021-08-22)

### Changed
- Increased trade units' work rates along with their speed

## [0.0.49] (2021-08-14)

### Fixed
- Fixed a bug causing units in a couple of bonuses to not get the bonus damage they deserved

## [0.0.48] (2021-08-12)

### Changed
- Updated to include and integrate Dawn of the Dukes update
- Reverted ballista elephants back to cavalry class so that cavalry blacksmith upgrades affect them
- Increased the upper range of how many resources stone and gold piles can generate with (in random costs)

### Fixed
- Fixed an issue causing unique units recruited from Donjons to get extra stats in Castle Age

## [0.0.47] (2021-07-01)

### Changed
- Architecture choice now affects king and monk graphics, as well as garrison building flag positioning

## [0.0.46] (2021-06-30)

### Added
- Added an option to give civilizations multiple unique techs for manually customized .json files (multiple entries in 3rd and 4th "bonuses" array)

## [0.0.45] (2021-06-29)

### Added
- Added an option to give civilizations multiple team bonuses for manually customized .json files (multiple entries in the final "bonuses" array)

## [0.0.44] (2021-06-27)

### Changed
- Starting with an Eagle scout can be enabled by fully disabling the Stable in the tech tree (otherwise civs will start with a normal scout)

### Fixed
- Fixed Imperial Scorpions so that they can be affected by Rocketry
- Fixed a bug causing unique units not to get Logistica's bonus vs. infantry in some cases
- Fixed a bug causing Royal Lancers, Royal Battle Elephants, and Imperial Skirmishers to enable in some cases despite the team bonus not being active

## [0.0.43] (2021-06-25)

### Fixed
- Resolved an issue causing civs with War Elephants to get a Mameluke icon in the selection screen and vice versa
- Fixed a bug causing Forced Levy and Kamandaran to give players gold if those units were also discounted

## [0.0.42] (2021-06-24)

### Added
- Added support for games running in different languages (only English descriptions available still but now they will always be displayed)

### Changed
- Decreased mod ID collisions by a factor of 300,000,000
- Shatagni can apply to Janissaries now

### Fixed
- Fixed a bug that gave Royal Lancers 13 bonus damage vs. siege instead of 13 attack

## [0.0.41] (2021-06-23)

### Changed
- Changed mod ID generation to avoid collisions

## [0.0.40] (2021-06-22)

### Added
- Added better maintenance to avoid killing ongoing drafts

### Changed
- Thanks to this wonderful community's generosity, the server is greatly improved!

### Fixed
- Fixed a fatal bug when new bonuses were disabled during drafting

## [0.0.39] (2021-06-21)

### Added
- Added very rare Easter eggs to random cost generation

## [0.0.38] (2021-06-17)

### Changed
- Randomizing unit costs will now also randomize how much resources trees, stones, boars, etc. hold (stones and golds abundance usually increased)

## [0.0.37] (2021-06-13)

### Added
- Added 40 new team bonuses

### Changed
- Reworked tech discount bonuses so that they depend on the techs' costs rather than fixed values (only matters in random cost generation)

## [0.0.36] (2021-06-10)

### Added
- Added an option to randomize both civilizations and costs (generation is less varied than [SE] Random Costs mod i.e. nothing costs 1 wood; costs of the same unit/building do not change between ages and upgrades)

## [0.0.35] (2021-06-08)

### Fixed
- Fixed a bug causing Elite Steppe Lancers not to be considered "mounted units"
- Fixed a bug that caused Eagle Scouts to be enabled for all civs

## [0.0.34] (2021-06-07)

### Added
- Added 50 new civilization bonuses
- Added option to include vanilla civilizations in created mods (thank you to TheRevanReborn for recreating every civ in the builder!)

## [0.0.33] (2021-06-06)

### Fixed
- Fixed a bug in Ironclad tech allocation
- Fixed an issue that was causing the 8th and 9th combined civilizations to swap tech trees and unique unit icons

## [0.0.32] (2021-06-05)

### Changed
- Architecture selection now actually affects in-game graphics

## [0.0.31] (2021-06-03)

### Added
- Added architecture selection
- Added name checking to civilization names

### Fixed
- Fixed a bug in reshuffling cards during drafting
- Fixed a bug in Teuton armor bonus

### Changed
- Reverted bonus changes to keep everything except blacksmith vils in-line with DE
