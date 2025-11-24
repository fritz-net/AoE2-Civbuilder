# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-05-02

### Added
- Updated website with 3K DLC content and April update changes
- Added advanced options to creation -- civilization description, custom wonder, and custom castle selection
- Enabled filtering by civ name for base edition bonuses
- Bonuses initially sorted by edition
- Regional units are colored differently in the technology tree

## [0.0.99] - 2025-02-25

### Added
- Gave bonuses editions to distinguish vanilla bonuses from custom bonuses (and potentially future bonuses)
- Added image caching to improve loading times

## [0.0.98] - 2024-05-22

### Added
- Added a rarity system to bonuses/cards to serve as a guideline in power level

## [0.0.97] - 2024-05-19

### Added
- Added modifiers which can be applied on top of generated civilization mods

## [0.0.96] - 2024-05-18

### Fixed
- Devotion now appropriately gives +5 HP with the Aztec bonus
- Husbandry gives attack speed gives the correct bonus now
- Added free relics to data mod incompatibilities
- Rewrote Inca villager bonus to reflect gameplay
- Moved missionary train location to not overlap with warrior priests
- Fixed missionaries being free with Hussite Reforms

## [0.0.95] - 2024-05-14

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

## [0.0.94] - 2024-05-10

### Added
- Added a button to enable all techs while editing tech trees

## [0.0.93] - 2024-05-03

### Fixed
- Fixed Crusader Knights being convertible
- Allowed Eupsong to affect Donjons
- Fixed various civilization descriptions displaying the wrong unique unit image
- Allowed Ahosi to be affected by blacksmith attack upgrades
- Fixed side effect of gunpowder university attack bonus giving City Walls
- Moved Shrivamsha train location to not coincide with Knights

## [0.0.92] - 2024-04-26

### Added
- Extended bonus stacking to unique technologies as well

## [0.0.91] - 2024-04-18

### Added
- Added the ability to stack the same bonus multiple times

## [0.0.90] - 2024-04-17

### Fixed
- Fixed a bug where feudal knights were un-upgradable

## [0.0.89] - 2024-04-14

### Added
- Implemented more community suggested bonuses and techs

## [0.0.88] - 2024-04-13

### Added
- Added Khmer farm bonus and 2x2 farms

## [0.0.87] - 2024-04-07

### Added
- Added the ability to upload your own images as flags

## [0.0.86] - 2024-03-31

### Added
- Implemented several community suggested bonuses and techs

## [0.0.85] - 2024-03-17

### Changed
- Updated website for compatibility with AoE2 Update 107882

## [0.0.84] - 2024-03-10

### Changed
- Updated website to work with The Mountain Royals

## [0.0.83] - 2023-05-31

### Changed
- Updated website to work with Return of Rome

## [0.0.82] - 2022-11-26

### Fixed
- Fixed a bug where free eagle upgrades would give extra stats

## [0.0.81] - 2022-09-02

### Changed
- Updated website to conform to AoE2 Update 66694

## [0.0.80] - 2022-05-15

### Fixed
- Fixed a few minor text and graphics inconsistencies

### Changed
- Updated mod generation to be compatible with Dynasties of India update

## [0.0.79] - 2022-04-06

### Added
- Currently selected bonuses display at the top of the page (credit to Steven Jackson for the code!)

## [0.0.78] - 2022-03-26

### Added
- Added 3 new flag symbols

## [0.0.77] - 2022-03-22

### Changed
- Updated default mod thumbnail (thanks to TWest!)

## [0.0.76] - 2022-03-21

### Fixed
- Fixed an issue causing vanilla civ files to become corrupted after editing them
- Updated vanilla civ files to include languages
- Corrected a few rare cases where villager sounds would be from their original civilizations

## [0.0.75] - 2022-03-18

### Fixed
- Removed data incompatibility restriction for Kreposts, Donjons, Anarchy, Marauders, and First Crusade
- Removed all UI incompatibility restrictions
- Fixed some civilizations being able to recruit their unique unit from castles in Dark Age in Regicide

## [0.0.74] - 2022-03-17

### Added
- Added functionality to language selection

## [0.0.73] - 2022-03-14

### Fixed
- Villager's Revenge unique technology no longer crashes the game and works as intended

## [0.0.72] - 2022-03-12

### Fixed
- Corrected a typo in Korean discount bonus
- Changed flamethrowers cost to 150w 25g instead of 150f 25g
- Fixed bug in university gunpowder attack bonus causing it to fail for units with melee attack
- Fixed that new unique techs didn't show up while editing civilizations
- Fixed bug where monks would change regional graphic while converting and galleon graphics didn't align
- Resolved an issue with integrating language selection into draft mode

## [0.0.71] - 2022-03-09

### Fixed
- Fixed an issue with hovering over cards in parts of the screen

## [0.0.70] - 2022-03-08

### Added
- Added 10 new unique technologies

## [0.0.69] - 2022-02-15

### Added
- Added events page for all events related to civbuilder

## [0.0.68] - 2022-01-25

### Added
- Added icon and reflective tab titles

## [0.0.67] - 2022-01-16

### Changed
- Warrior monks now also benefit from monk bonuses unique to civbuilder, Inquisition increases their attack rate

## [0.0.66] - 2022-01-15

### Fixed
- Fixed the filter input location while editing civilizations

## [0.0.65] - 2022-01-13

### Added
- Bonuses, units, and techs can be filtered/searched for

## [0.0.64] - 2022-01-12

### Fixed
- Fixed a bug causing some civilization links to become corrupted
- Allowed civilization viewer and editor to read in .json files with empty values

## [0.0.63] - 2022-01-11

### Added
- Civilizations can now be shared and viewed with direct links rather than .json files
- Added the ability to edit civilization .json files

## [0.0.62] - 2022-01-10

### Changed
- Allowed most 0-cost techs to affect mod generation (techs that cannot affect generation are now untoggleable)

## [0.0.61] - 2022-01-08

### Changed
- Adjusted galley attack bonus to begin in Castle Age

## [0.0.60] - 2022-01-07

### Fixed
- Fixed a bug causing the game to crash if the UI mod is enabled while playing with the 15th modded civilization

## [0.0.59] - 2022-01-05

### Changed
- Updated base data file to reflect changes in Update 56005
- Updated Vanilla .json files to correspond to patch notes
- Matched regional trade carts to civilization architecture set

### Fixed
- Fixed the cost of Varangian Guard

## [0.0.58] - 2021-11-14

### Added
- Added 35 new unique units

## [0.0.57] - 2021-10-18

### Changed
- Adjusted statistics of various custom unique units
- Changed Flamethrower costs to require the gold payment shown in the description

## [0.0.56] - 2021-10-17

### Fixed
- Fixed various typos
- Fixed Serjeants getting auto-upgraded doubly upon hitting Castle Age
- Fixed villagers being unable to garrison in houses despite having the bonus
- Connected empty trade cart graphics to civilization architecture
- Fixed a bug allowing players to recruit dismounted Konniks for free when researching Anarchy or Marauders

## [0.0.55] - 2021-10-16

### Changed
- Updated base data file to reflect changes in Update 54480

## [0.0.54] - 2021-09-10

### Added
- Added Xolotl Warriors, Saboteurs, Ninjas, and Flamethrowers as unique units

## [0.0.53] - 2021-09-09

### Added
- Added Crusader Knights as a unique unit

### Changed
- Adjusted Farimba to give only +3 attack

### Fixed
- Fixed free archer-line upgrades bonus so that it works on crossbows

## [0.0.52] - 2021-09-05

### Changed
- Made Korean stone mining civ bonus affect Polish stone mining gold generation

## [0.0.51] - 2021-09-03

### Added
- Added more symbols to the flag creator

## [0.0.50] - 2021-08-22

### Changed
- Increased trade units' work rates along with their speed

## [0.0.49] - 2021-08-14

### Fixed
- Fixed a bug causing units in a couple of bonuses to not get the bonus damage they deserved

## [0.0.48] - 2021-08-12

### Changed
- Updated to include and integrate Dawn of the Dukes update
- Reverted ballista elephants back to cavalry class so that cavalry blacksmith upgrades affect them
- Increased the upper range of how many resources stone and gold piles can generate with (in random costs)

### Fixed
- Fixed an issue causing unique units recruited from Donjons to get extra stats in Castle Age

## [0.0.47] - 2021-07-01

### Changed
- Architecture choice now affects king and monk graphics, as well as garrison building flag positioning

## [0.0.46] - 2021-06-30

### Added
- Added an option to give civilizations multiple unique techs for manually customized .json files (multiple entries in 3rd and 4th "bonuses" array)

## [0.0.45] - 2021-06-29

### Added
- Added an option to give civilizations multiple team bonuses for manually customized .json files (multiple entries in the final "bonuses" array)

## [0.0.44] - 2021-06-27

### Changed
- Starting with an Eagle scout can be enabled by fully disabling the Stable in the tech tree (otherwise civs will start with a normal scout)

### Fixed
- Fixed Imperial Scorpions so that they can be affected by Rocketry
- Fixed a bug causing unique units not to get Logistica's bonus vs. infantry in some cases
- Fixed a bug causing Royal Lancers, Royal Battle Elephants, and Imperial Skirmishers to enable in some cases despite the team bonus not being active

## [0.0.43] - 2021-06-25

### Fixed
- Resolved an issue causing civs with War Elephants to get a Mameluke icon in the selection screen and vice versa
- Fixed a bug causing Forced Levy and Kamandaran to give players gold if those units were also discounted

## [0.0.42] - 2021-06-24

### Added
- Added support for games running in different languages (only English descriptions available still but now they will always be displayed)

### Changed
- Decreased mod ID collisions by a factor of 300,000,000
- Shatagni can apply to Janissaries now

### Fixed
- Fixed a bug that gave Royal Lancers 13 bonus damage vs. siege instead of 13 attack

## [0.0.41] - 2021-06-23

### Changed
- Changed mod ID generation to avoid collisions

## [0.0.40] - 2021-06-22

### Added
- Added better maintenance to avoid killing ongoing drafts

### Changed
- Thanks to this wonderful community's generosity, the server is greatly improved!

### Fixed
- Fixed a fatal bug when new bonuses were disabled during drafting

## [0.0.39] - 2021-06-21

### Added
- Added very rare Easter eggs to random cost generation

## [0.0.38] - 2021-06-17

### Changed
- Randomizing unit costs will now also randomize how much resources trees, stones, boars, etc. hold (stones and golds abundance usually increased)

## [0.0.37] - 2021-06-13

### Added
- Added 40 new team bonuses

### Changed
- Reworked tech discount bonuses so that they depend on the techs' costs rather than fixed values (only matters in random cost generation)

## [0.0.36] - 2021-06-10

### Added
- Added an option to randomize both civilizations and costs (generation is less varied than [SE] Random Costs mod i.e. nothing costs 1 wood; costs of the same unit/building do not change between ages and upgrades)

## [0.0.35] - 2021-06-08

### Fixed
- Fixed a bug causing Elite Steppe Lancers not to be considered "mounted units"
- Fixed a bug that caused Eagle Scouts to be enabled for all civs

## [0.0.34] - 2021-06-07

### Added
- Added 50 new civilization bonuses
- Added option to include vanilla civilizations in created mods (thank you to TheRevanReborn for recreating every civ in the builder!)

## [0.0.33] - 2021-06-06

### Fixed
- Fixed a bug in Ironclad tech allocation
- Fixed an issue that was causing the 8th and 9th combined civilizations to swap tech trees and unique unit icons

## [0.0.32] - 2021-06-05

### Changed
- Architecture selection now actually affects in-game graphics

## [0.0.31] - 2021-06-03

### Added
- Added architecture selection
- Added name checking to civilization names

### Fixed
- Fixed a bug in reshuffling cards during drafting
- Fixed a bug in Teuton armor bonus

### Changed
- Reverted bonus changes to keep everything except blacksmith vils in-line with DE
