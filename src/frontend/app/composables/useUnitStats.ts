/**
 * Composable for unique unit statistics data
 * Data based on the legacy builder system
 */

export interface UnitAttacks {
  basic: [number, number][]
  elite: [number, number][]
}

export interface UnitArmors {
  basic: [number, number]
  elite: [number, number]
}

export interface UnitStats {
  armors: UnitArmors
  attacks: UnitAttacks
  cost: [number, number, number, number] // [food, wood, stone, gold]
  hp: number[] // [basic, elite] or [both]
  range: number[] // [basic, elite] or [both]
  reload: number[]
  speed: number[]
  special?: string
}

// Map attack class IDs to readable names
export const classToName: Record<number, string> = {
  11: "buildings",
  13: "stone defenses",
  20: "siege weapons",
  26: "castles",
  1: "infantry",
  19: "unique units",
  32: "condottiero",
  10: "villagers",
  8: "cavalry",
  27: "spearmen",
  36: "heroes/kings",
  21: "buildings",
  29: "eagles",
  15: "archers",
  35: "mamelukes",
  17: "rams/trebuchet",
  22: "walls/gates",
  14: "animals",
  16: "ships/saboteurs",
  5: "elephants",
  30: "camels",
  38: "skirmishers",
  28: "cavalry archers",
  23: "gunpowder",
  25: "monks",
  34: "fishing ships",
  3: "base pierce",
  4: "base melee",
}

// Resource icons for displaying costs
export const resourceNames = ['Food', 'Wood', 'Stone', 'Gold'] as const

/**
 * Format unit cost as a readable string
 */
export function formatCost(cost: [number, number, number, number]): string {
  const parts: string[] = []
  const names = ['F', 'W', 'S', 'G'] // Food, Wood, Stone, Gold shorthand
  cost.forEach((value, index) => {
    if (value > 0) {
      parts.push(`${value}${names[index]}`)
    }
  })
  return parts.join(' ')
}

/**
 * Format attack bonuses as readable strings
 */
export function formatAttackBonuses(attacks: [number, number][]): string[] {
  return attacks
    .filter(([classId]) => classId !== 3 && classId !== 4) // Skip base damage
    .map(([classId, damage]) => {
      const className = classToName[classId] || `class ${classId}`
      return `+${damage} vs ${className}`
    })
}

/**
 * Get base attack damage from attacks array
 */
export function getBaseAttack(attacks: [number, number][]): number {
  // Class 4 is melee damage, class 3 is pierce damage
  const meleeAttack = attacks.find(([classId]) => classId === 4)
  const pierceAttack = attacks.find(([classId]) => classId === 3)
  return meleeAttack?.[1] || pierceAttack?.[1] || 0
}

// Unit statistics for all unique units
// Index matches the unique unit card ID from getBonusCards('uu')
export const unitStats = [
	{
		armors: {
			basic: [0, 0],
			elite: [0, 1],
		},
		attacks: {
			basic: [
				[27, 2],
				[3, 6],
			],
			elite: [
				[27, 2],
				[3, 7],
			],
		},
		cost: [0, 35, 0, 40],
		hp: [35, 40],
		range: [5, 6],
		reload: [2],
		speed: [0.96],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[29, 1],
				[21, 1],
				[4, 7],
			],
			elite: [
				[29, 2],
				[21, 2],
				[4, 8],
			],
		},
		cost: [55, 0, 0, 25],
		hp: [60, 70],
		range: [3, 4],
		reload: [2],
		speed: [1],
	},
	{
		armors: {
			basic: [0, 6],
			elite: [0, 8],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 10],
				[15, 6],
			],
			elite: [
				[29, 3],
				[21, 3],
				[4, 12],
				[15, 10],
			],
		},
		cost: [75, 0, 0, 35],
		hp: [60, 70],
		range: [0],
		reload: [2],
		speed: [1.05],
	},
	{
		armors: {
			basic: [7, 2],
			elite: [10, 2],
		},
		attacks: {
			basic: [
				[29, 4],
				[21, 4],
				[4, 14],
			],
			elite: [
				[29, 4],
				[21, 4],
				[4, 17],
			],
		},
		cost: [85, 0, 0, 30],
		hp: [90, 110],
		range: [0],
		reload: [2],
		speed: [0.8],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 10],
				[19, 10],
			],
			elite: [
				[29, 3],
				[21, 3],
				[4, 12],
				[19, 12],
			],
		},
		cost: [45, 0, 0, 30],
		hp: [70, 80],
		range: [0],
		reload: [1.9],
		speed: [1],
		special: "Gain additional movement speed and +1 attack when charging at an enemy unit",
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[27, 2],
				[3, 8],
			],
			elite: [
				[27, 2],
				[3, 10],
			],
		},
		cost: [0, 40, 0, 35],
		hp: [45, 50],
		range: [4],
		reload: [3],
		speed: [0.96],
	},
	{
		armors: {
			basic: [2, 1],
			elite: [2, 1],
		},
		attacks: {
			basic: [
				[1, 9],
				[4, 9],
				[32, 9],
			],
			elite: [
				[1, 12],
				[4, 12],
				[32, 10],
			],
		},
		cost: [70, 0, 0, 75],
		hp: [110, 150],
		range: [0],
		reload: [1.8, 1.7],
		speed: [1.35],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[4, 8],
				[8, 9],
			],
			elite: [
				[4, 10],
				[8, 12],
				[35, 1],
			],
		},
		cost: [55, 0, 0, 85],
		hp: [80, 90],
		range: [3],
		reload: [2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [1, 2],
			elite: [1, 3],
		},
		attacks: {
			basic: [
				[11, 30],
				[4, 15],
				[13, 30],
			],
			elite: [
				[11, 30],
				[4, 20],
				[13, 30],
			],
		},
		cost: [170, 0, 0, 85],
		hp: [450, 600],
		range: [0],
		reload: [2],
		speed: [0.8],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [2, 0],
		},
		attacks: {
			basic: [
				[3, 17],
				[17, 2],
			],
			elite: [
				[3, 22],
				[17, 3],
			],
		},
		cost: [60, 0, 0, 55],
		hp: [35, 40],
		range: [7, 8],
		reload: [3.45],
		speed: [0.96],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [2, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 12],
			],
			elite: [
				[29, 3],
				[21, 3],
				[4, 14],
			],
		},
		cost: [65, 0, 0, 20],
		hp: [54, 62],
		range: [0],
		reload: [2],
		speed: [1.05],
		special: "Regenerates HP",
	},
	{
		armors: {
			basic: [0, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[27, 1],
				[3, 6],
				[20, 3],
			],
			elite: [
				[27, 1],
				[3, 8],
				[20, 5],
			],
		},
		cost: [0, 55, 0, 65],
		hp: [60],
		range: [4],
		reload: [2.1],
		speed: [1.4],
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 11],
			],
			elite: [
				[29, 3],
				[21, 3],
				[4, 15],
			],
		},
		cost: [70, 0, 0, 25],
		hp: [70, 85],
		range: [0],
		reload: [2],
		speed: [1.17],
	},
	{
		armors: {
			basic: [2, 1],
			elite: [2, 2],
		},
		attacks: {
			basic: [
				[3, 16],
				[17, 4],
			],
			elite: [
				[11, 2],
				[3, 18],
				[17, 6],
			],
		},
		cost: [60, 0, 0, 70],
		hp: [55, 70],
		range: [6],
		reload: [2.9],
		speed: [1.3],
	},
	{
		armors: {
			basic: [1, 2],
			elite: [2, 2],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[1, 5],
				[4, 15],
				[32, 10],
			],
			elite: [
				[29, 2],
				[21, 2],
				[1, 6],
				[4, 19],
				[32, 10],
			],
		},
		cost: [60, 0, 0, 30],
		hp: [65, 75],
		range: [0],
		reload: [2],
		speed: [1],
		special: "Gains +1 attack when defeating a military unit (up to +4)",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 2],
		},
		attacks: {
			basic: [
				[27, 2],
				[1, 1],
				[3, 5],
				[32, 1],
			],
			elite: [
				[27, 2],
				[1, 2],
				[3, 5],
				[32, 2],
			],
		},
		cost: [0, 55, 0, 55],
		hp: [50, 65],
		range: [4, 5],
		reload: [1.9],
		speed: [1.2],
	},
	{
		armors: {
			basic: [1, 3],
			elite: [1, 4],
		},
		attacks: {
			basic: [
				[26, 10],
				[11, 8],
				[4, 8],
				[13, 12],
				[22, 8],
			],
			elite: [
				[26, 10],
				[11, 10],
				[4, 11],
				[13, 12],
				[22, 10],
			],
		},
		cost: [60, 0, 0, 60],
		hp: [100, 150],
		range: [0],
		reload: [1.9],
		speed: [1.4],
	},
	{
		armors: {
			basic: [0, 3],
			elite: [0, 4],
		},
		attacks: {
			basic: [
				[21, 2],
				[3, 9],
			],
			elite: [
				[21, 2],
				[3, 9],
			],
		},
		cost: [0, 200, 0, 60],
		hp: [150, 200],
		range: [4, 5],
		reload: [2.5],
		speed: [1.2],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[3, 6],
				[8, 5],
				[16, 4],
				[5, 5],
				[30, 4],
			],
			elite: [
				[3, 6],
				[8, 7],
				[16, 5],
				[5, 7],
				[30, 6],
			],
		},
		cost: [0, 45, 0, 40],
		hp: [45, 50],
		range: [4],
		reload: [2],
		speed: [0.96],
	},
	{
		armors: {
			basic: [0, 3],
			elite: [0, 6],
		},
		attacks: {
			basic: [
				[4, 9],
				[15, 5],
				[21, 2],
				[29, 2],
			],
			elite: [
				[4, 11],
				[15, 6],
				[21, 2],
				[29, 2],
			],
		},
		cost: [30, 0, 0, 45],
		hp: [60, 70],
		range: [0],
		reload: [2],
		speed: [1.15, 1.2],
		special: "Attacks can pierce multiple enemies",
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[4, 7],
				[8, 8],
				[30, 6],
				[5, 20],
			],
			elite: [
				[4, 8],
				[8, 12],
				[30, 10],
				[5, 20],
				[35, 1],
			],
		},
		cost: [60, 0, 0, 30],
		hp: [70, 80],
		range: [1],
		reload: [2],
		speed: [1],
	},
	{
		armors: {
			basic: [0, 2],
			elite: [0, 2],
		},
		attacks: {
			basic: [
				[4, 9],
				[17, 1],
				[20, 5],
			],
			elite: [
				[4, 10],
				[17, 2],
				[20, 8],
			],
		},
		cost: [35, 0, 0, 45],
		hp: [75, 85],
		range: [0],
		reload: [1.8],
		speed: [1.5],
	},
	{
		armors: {
			basic: [4, 2],
			elite: [8, 3],
		},
		attacks: {
			basic: [[4, 12]],
			elite: [[4, 14]],
		},
		cost: [60, 0, 0, 70],
		hp: [100, 130],
		range: [0],
		reload: [1.9],
		speed: [1.3],
	},
	{
		armors: {
			basic: [2, 4],
			elite: [2, 6],
		},
		attacks: {
			basic: [
				[1, 2],
				[3, 6],
				[17, 1],
				[38, 2],
			],
			elite: [
				[1, 2],
				[11, 1],
				[3, 8],
				[17, 1],
				[38, 2],
			],
		},
		cost: [0, 80, 0, 70],
		hp: [50, 70],
		range: [7],
		reload: [3.45],
		speed: [0.85],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[4, 16],
			],
			elite: [
				[29, 2],
				[21, 1],
				[4, 18],
			],
		},
		cost: [50, 0, 0, 30],
		hp: [45, 50],
		range: [0],
		reload: [2],
		speed: [1.2],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[29, 1],
				[4, 10],
			],
			elite: [
				[29, 1],
				[4, 13],
			],
		},
		cost: [50, 0, 0, 40],
		hp: [40, 50],
		range: [5, 6],
		reload: [2],
		speed: [1.25],
	},
	{
		armors: {
			basic: [0, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[3, 7],
				[28, 4],
			],
			elite: [
				[3, 8],
				[28, 6],
			],
		},
		cost: [0, 50, 0, 60],
		hp: [55, 60],
		range: [4],
		reload: [2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [0, 3],
			elite: [0, 3],
		},
		attacks: {
			basic: [
				[21, 3],
				[3, 9],
				[13, 3],
				[11, 2],
				[16, 8],
			],
			elite: [
				[21, 4],
				[3, 10],
				[13, 4],
				[11, 4],
				[16, 8],
			],
		},
		cost: [100, 0, 0, 80],
		hp: [250, 290],
		range: [5],
		reload: [2.5],
		speed: [0.8],
		special: "Projectiles can cut trees",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[4, 7],
			],
			elite: [
				[29, 2],
				[21, 1],
				[4, 8],
			],
		},
		cost: [25, 0, 0, 15],
		hp: [30, 40],
		range: [0],
		reload: [2],
		speed: [1.2],
		special: "Units cost half population space",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 2],
		},
		attacks: {
			basic: [
				[3, 12],
				[17, 2],
			],
			elite: [
				[3, 14],
				[17, 2],
			],
		},
		cost: [0, 75, 0, 60],
		hp: [60, 65],
		range: [5],
		reload: [2],
		speed: [1.3],
	},
	{
		armors: {
			basic: [0, 4],
			elite: [0, 6],
		},
		attacks: {
			basic: [
				[27, 2],
				[3, 6],
			],
			elite: [
				[27, 2],
				[3, 7],
			],
		},
		cost: [0, 50, 0, 45],
		hp: [40, 45],
		range: [4, 5],
		reload: [2],
		speed: [1.1],
	},
	{
		armors: {
			basic: [2, 1],
			elite: [2, 2],
		},
		attacks: {
			basic: [[4, 12]],
			elite: [[4, 14]],
		},
		cost: [60, 0, 0, 70],
		hp: [100, 120],
		range: [0],
		reload: [2.4],
		speed: [1.35],
		special: "Upon death, continues fighting as dismounted unit",
	},
	{
		armors: {
			basic: [1, 2],
			elite: [1, 3],
		},
		attacks: {
			basic: [[4, 9]],
			elite: [[4, 11]],
		},
		cost: [60, 0, 0, 40],
		hp: [110, 140],
		range: [0],
		reload: [1.9],
		speed: [1.4],
		special: "Fighting generates gold",
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[27, 1],
				[3, 4],
			],
			elite: [
				[27, 1],
				[3, 5],
			],
		},
		cost: [0, 60, 0, 35],
		hp: [40, 45],
		range: [4],
		reload: [2.2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [2, 1],
		},
		attacks: {
			basic: [[4, 13]],
			elite: [[4, 16]],
		},
		cost: [70, 0, 0, 50],
		hp: [100, 130],
		range: [0],
		reload: [1.9],
		speed: [1.4],
		special: "Attacks ignore armor",
	},
	{
		armors: {
			basic: [2, 2],
			elite: [2, 2],
		},
		attacks: {
			basic: [[4, 8]],
			elite: [[4, 11]],
		},
		cost: [55, 0, 0, 55],
		hp: [115, 145],
		range: [0],
		reload: [1.9],
		speed: [1.35],
		special: "Rechargeable attack causes extra damage",
	},
	{
		armors: {
			basic: [4, 2],
			elite: [6, 3],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 5],
			],
			elite: [
				[29, 3],
				[21, 3],
				[4, 11],
			],
		},
		cost: [60, 0, 0, 25],
		hp: [50, 85],
		range: [0],
		reload: [2],
		speed: [0.95],
		special: "Can build Donjons or Kreposts if unlocked",
	},
	{
		armors: {
			basic: [2, 2],
			elite: [2, 2],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 4],
				[4, 8],
			],
			elite: [
				[29, 3],
				[21, 6],
				[4, 10],
			],
		},
		cost: [55, 0, 0, 20],
		hp: [80, 95],
		range: [0],
		reload: [2],
		speed: [0.9],
		special: "Attacks strip armor",
	},
	{
		armors: {
			basic: [0, 7],
			elite: [1, 10],
		},
		attacks: {
			basic: [
				[11, 1],
				[3, 10],
				[17, 3],
			],
			elite: [
				[11, 2],
				[3, 13],
				[17, 3],
			],
		},
		cost: [0, 110, 0, 70],
		hp: [160, 230],
		range: [6],
		reload: [3.45],
		speed: [0.8],
		special: "Mitigate damage of flyover projectiles",
	},
	{
		armors: {
			basic: [3, 3],
			elite: [4, 4],
		},
		attacks: {
			basic: [[4, 16]],
			elite: [[4, 18]],
		},
		cost: [80, 0, 0, 50],
		hp: [90, 100],
		range: [0],
		reload: [2],
		speed: [1.2],
		special: "Cannot be converted",
	},
	{
		armors: {
			basic: [2, 0],
			elite: [3, 2],
		},
		attacks: {
			basic: [[4, 5]],
			elite: [[4, 6]],
		},
		cost: [30, 0, 0, 60],
		hp: [95, 115],
		range: [0],
		reload: [0.9, 0.8],
		speed: [1.35],
	},
	{
		armors: {
			basic: [1, 3],
			elite: [1, 5],
		},
		attacks: {
			basic: [
				[11, 500],
				[4, 40],
				[13, 500],
				[20, 60],
				[26, 600],
			],
			elite: [
				[11, 500],
				[4, 55],
				[13, 500],
				[20, 120],
				[26, 1200],
			],
		},
		cost: [0, 0, 50, 50],
		hp: [45, 70],
		range: [0],
		reload: [0],
		speed: [1.35],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [1, 2],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 11],
				[36, 9],
				[19, 5],
			],
			elite: [
				[29, 2],
				[21, 2],
				[4, 14],
				[36, 9],
				[19, 7],
			],
		},
		cost: [60, 0, 0, 30],
		hp: [50, 60],
		range: [0],
		reload: [1.8],
		speed: [1.15, 1.3],
		special: "Attacks ignore armor",
	},
	{
		armors: {
			basic: [2, 2],
			elite: [4, 2],
		},
		attacks: {
			basic: [
				[11, 8],
				[4, 7],
				[17, 8],
			],
			elite: [
				[11, 12],
				[4, 9],
				[17, 12],
			],
		},
		cost: [0, 125, 0, 50],
		hp: [160],
		range: [5],
		reload: [0.25],
		speed: [0.6],
	},
	{
		armors: {
			basic: [-3, -3],
			elite: [-3, -3],
		},
		attacks: {
			basic: [
				[21, 5],
				[3, 30],
				[17, 10],
			],
			elite: [
				[21, 5],
				[3, 30],
				[17, 10],
			],
		},
		cost: [60, 0, 0, 140],
		hp: [30],
		range: [8, 10],
		reload: [5.5],
		speed: [0.9],
	},
	{
		armors: {
			basic: [2, 3],
			elite: [3, 3],
		},
		attacks: {
			basic: [[4, 13]],
			elite: [[4, 15]],
		},
		cost: [75, 0, 0, 85],
		hp: [110, 155],
		range: [0],
		reload: [1.9],
		speed: [1.35],
		special: "Increases movement and attack speed of nearby militia-line units",
	},
	{
		armors: {
			basic: [1, 0],
			elite: [2, 0],
		},
		attacks: {
			basic: [[4, 9]],
			elite: [[4, 11]],
		},
		cost: [50, 0, 0, 85],
		hp: [70, 90],
		range: [0],
		reload: [2],
		speed: [1.15, 1.3],
		special: "Increases regeneration rate of nearby shock infantry",
	},
	{
		armors: {
			basic: [99, 99],
			elite: [99, 99],
		},
		attacks: {
			basic: [
				[4, 99],
				[11, -99],
			],
			elite: [
				[4, 99],
				[11, -99],
			],
		},
		cost: [90, 0, 0, 20],
		hp: [9, 16],
		range: [0],
		reload: [0.9],
		speed: [0.99],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 2],
				[4, 13],
				[10, 10],
				[14, 30],
			],
			elite: [
				[29, 2],
				[21, 2],
				[4, 15],
				[10, 20],
				[14, 30],
			],
		},
		cost: [50, 0, 0, 15],
		hp: [45, 60],
		range: [0],
		reload: [2],
		speed: [1.1, 1.2],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[27, 2],
				[10, 5],
				[3, 4],
				[14, 5],
			],
			elite: [
				[27, 2],
				[10, 10],
				[3, 5],
				[14, 5],
			],
		},
		cost: [0, 25, 0, 35],
		hp: [35],
		range: [4],
		reload: [1.9],
		speed: [1.1, 1.2],
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 1],
		},
		attacks: {
			basic: [
				[29, 2],
				[21, 5],
				[4, 7],
				[26, 10],
				[22, 6],
				[13, 12],
			],
			elite: [
				[29, 2],
				[21, 10],
				[4, 11],
				[26, 10],
				[22, 12],
				[13, 12],
			],
		},
		cost: [65, 0, 0, 25],
		hp: [65, 80],
		range: [0],
		reload: [2],
		speed: [1.2],
	},
	{
		armors: {
			basic: [0, 5],
			elite: [0, 7],
		},
		attacks: {
			basic: [
				[4, 9],
				[15, 6],
			],
			elite: [
				[4, 11],
				[15, 10],
			],
		},
		cost: [70, 0, 0, 45],
		hp: [80, 100],
		range: [0],
		reload: [2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [5, 5],
			elite: [7, 7],
		},
		attacks: {
			basic: [[4, 10]],
			elite: [[4, 13]],
		},
		cost: [95, 0, 0, 85],
		hp: [75, 100],
		range: [0],
		reload: [2],
		speed: [1.3],
	},
	{
		armors: {
			basic: [1, -1],
			elite: [1, -1],
		},
		attacks: {
			basic: [
				[29, 5],
				[21, 1],
				[1, 5],
				[4, 6],
				[32, 5],
			],
			elite: [
				[29, 7],
				[21, 1],
				[1, 5],
				[4, 8],
				[32, 5],
			],
		},
		cost: [40, 0, 0, 30],
		hp: [80, 105],
		range: [0],
		reload: [0.9, 0.8],
		speed: [1.1],
	},
	{
		armors: {
			basic: [6, 1],
			elite: [11, 2],
		},
		attacks: {
			basic: [[4, 11]],
			elite: [[4, 13]],
		},
		cost: [80, 0, 0, 75],
		hp: [125, 150],
		range: [0],
		reload: [2],
		speed: [1.3],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [2, 0],
		},
		attacks: {
			basic: [
				[27, 2],
				[3, 5],
				[21, 3],
			],
			elite: [
				[27, 2],
				[3, 7],
				[21, 5],
			],
		},
		cost: [0, 65, 0, 55],
		hp: [80, 100],
		range: [5, 6],
		reload: [2],
		speed: [1.35],
	},
	{
		armors: {
			basic: [4, 1],
			elite: [5, 2],
		},
		attacks: {
			basic: [[4, 10]],
			elite: [[4, 12]],
		},
		cost: [75, 0, 0, 60],
		hp: [115, 145],
		range: [0],
		reload: [2],
		speed: [1.3],
		special: "Increased attack when nearby friendly monk units",
	},
	{
		armors: {
			basic: [-2, 2],
			elite: [-2, 4],
		},
		attacks: {
			basic: [
				[4, 16],
				[10, 10],
				[23, 6],
				[32, 6],
				[25, 5],
			],
			elite: [
				[4, 19],
				[10, 10],
				[23, 9],
				[32, 9],
				[25, 7],
			],
		},
		cost: [70, 0, 0, 35],
		hp: [50, 65],
		range: [0],
		reload: [2],
		speed: [1.55],
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 2],
		},
		attacks: {
			basic: [[4, 9]],
			elite: [[4, 11]],
		},
		cost: [70, 0, 0, 70],
		hp: [95, 125],
		range: [0],
		reload: [2],
		speed: [1.52],
		special: "Speeds up nearby camel units",
	},
	{
		armors: {
			basic: [-2, 0],
			elite: [-2, 1],
		},
		attacks: {
			basic: [[3, 7]],
			elite: [[3, 9]],
		},
		cost: [0, 50, 0, 70],
		hp: [50, 65],
		range: [4],
		reload: [2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [0, 3],
			elite: [0, 4],
		},
		attacks: {
			basic: [
				[3, 5],
				[28, 2],
				[15, 3],
				[27, 1],
			],
			elite: [
				[3, 6],
				[28, 3],
				[15, 5],
				[27, 1],
			],
		},
		cost: [0, 80, 0, 30],
		hp: [65, 80],
		range: [4],
		reload: [3],
		speed: [1.35],
		special: "Elite unit costs half as much gold",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 2],
		},
		attacks: {
			basic: [
				[4, 6],
				[8, 22],
				[5, 25],
				[30, 16],
			],
			elite: [
				[4, 7],
				[8, 44],
				[5, 50],
				[30, 32],
			],
		},
		cost: [55, 0, 0, 50],
		hp: [60, 75],
		range: [0],
		reload: [2],
		speed: [1.1],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[4, 5],
				[8, 5],
				[5, 15],
				[30, 3],
			],
			elite: [
				[4, 6],
				[8, 10],
				[5, 20],
				[30, 6],
			],
		},
		cost: [40, 0, 0, 50],
		hp: [80, 95],
		range: [2],
		reload: [3],
		speed: [0.9],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [[4, 7]],
			elite: [[4, 8]],
		},
		cost: [0, 0, 0, 75],
		hp: [60, 65],
		range: [0],
		reload: [2],
		speed: [1.33],
		special: "Can kidnap villagers",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 1],
		},
		attacks: {
			basic: [[4, 10]],
			elite: [[4, 12]],
		},
		cost: [65, 0, 0, 40],
		hp: [70, 85],
		range: [0],
		reload: [2],
		speed: [0.95],
		special: "Deals splash damage to nearby units",
	},
	{
		armors: {
			basic: [0, 3],
			elite: [0, 5],
		},
		attacks: {
			basic: [[4, 20]],
			elite: [[4, 27]],
		},
		cost: [90, 0, 0, 10],
		hp: [40],
		range: [0],
		reload: [2],
		speed: [0.9],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[4, 12],
				[19, 8],
				[36, 25],
			],
			elite: [
				[4, 14],
				[19, 12],
				[36, 50],
			],
		},
		cost: [25, 0, 0, 85],
		hp: [85, 105],
		range: [0],
		reload: [2],
		speed: [1.45],
	},
	{
		armors: {
			basic: [1, 1],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[4, 9],
				[1, 5],
				[8, 5],
				[32, 5],
			],
			elite: [
				[4, 12],
				[1, 6],
				[8, 6],
				[32, 6],
			],
		},
		cost: [75, 0, 0, 35],
		hp: [60, 75],
		range: [0],
		reload: [2],
		speed: [0.95],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [1, 1],
		},
		attacks: {
			basic: [
				[4, 9],
				[8, 4],
			],
			elite: [
				[4, 12],
				[8, 6],
			],
		},
		cost: [75, 0, 0, 55],
		hp: [80, 100],
		range: [1],
		reload: [2],
		speed: [1.4],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [[3, 15]],
			elite: [[3, 19]],
		},
		cost: [45, 0, 0, 15],
		hp: [45, 55],
		range: [0],
		reload: [2],
		speed: [1.25],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[4, 12],
				[21, 2],
			],
			elite: [
				[4, 14],
				[21, 2],
			],
		},
		cost: [50, 0, 0, 35],
		hp: [45, 55],
		range: [0],
		reload: [1.9],
		speed: [1.02],
		special: "Nearby friendly gunpowder, spear, and condottiero units attack faster",
	},
	{
		armors: {
			basic: [2, 2],
			elite: [3, 3],
		},
		attacks: {
			basic: [[4, 12]],
			elite: [[4, 14]],
		},
		cost: [95, 0, 0, 75],
		hp: [140, 180],
		range: [0],
		reload: [2],
		speed: [1.25],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [2, 1],
		},
		attacks: {
			basic: [
				[3, 6],
				[1, 3],
				[32, 3],
			],
			elite: [
				[3, 8],
				[1, 6],
				[32, 6],
			],
		},
		cost: [0, 40, 0, 70],
		hp: [60, 80],
		range: [4],
		reload: [2],
		speed: [1.25],
		special: "Receives 50% less bonus damage",
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[4, 11],
				[30, 8],
				[5, 25],
			],
			elite: [
				[4, 13],
				[30, 14],
				[5, 45],
			],
		},
		cost: [50, 0, 0, 35],
		hp: [60, 90],
		range: [0],
		reload: [2],
		speed: [1.48],
	},
	{
		armors: {
			basic: [3, 0],
			elite: [5, 0],
		},
		attacks: {
			basic: [[4, 13]],
			elite: [[4, 15]],
		},
		cost: [85, 0, 0, 50],
		hp: [125, 150],
		range: [0],
		reload: [2],
		speed: [1.3],
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [[4, 11]],
			elite: [[4, 14]],
		},
		cost: [0, 0, 0, 100],
		hp: [30, 40],
		range: [0],
		reload: [2],
		speed: [0.9],
		special: "Can dodge projectiles, benefits from monk upgrades",
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [[4, 13]],
			elite: [[4, 16]],
		},
		cost: [65, 0, 0, 90],
		hp: [55, 65],
		range: [0],
		reload: [2],
		speed: [1.4],
		special: "Gains attack speed when in proximity with friendly villagers",
	},
	{
		armors: {
			basic: [0, 1],
			elite: [0, 2],
		},
		attacks: {
			basic: [
				[4, 8],
				[20, 8],
				[11, 1],
			],
			elite: [
				[4, 10],
				[20, 12],
				[11, 2],
			],
		},
		cost: [55, 0, 0, 35],
		hp: [55, 65],
		range: [0],
		reload: [2],
		speed: [1.15],
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[29, 1],
				[21, 1],
				[4, 3],
			],
			elite: [
				[29, 2],
				[21, 2],
				[4, 4],
				[1, 1],
				[32, 1],
			],
		},
		cost: [65, 0, 0, 30],
		hp: [40, 50],
		range: [5, 6],
		reload: [2],
		speed: [1.15],
		special: "Attacks deal pass-through damage",
	},
	{
		armors: {
			basic: [1, 0],
			elite: [1, 0],
		},
		attacks: {
			basic: [
				[4, 9],
				[29, 2],
				[21, 1],
			],
			elite: [
				[4, 11],
				[29, 3],
				[21, 2],
			],
		},
		cost: [65, 0, 0, 20],
		hp: [55, 65],
		range: [0],
		reload: [2],
		speed: [1.1],
		special: "Rechargeable attack causes extra area damage",
	},
	{
		armors: {
			basic: [3, 2],
			elite: [3, 3],
		},
		attacks: {
			basic: [
				[3, 5],
				[27, 1],
			],
			elite: [
				[3, 6],
				[27, 2],
			],
		},
		cost: [0, 60, 0, 60],
		hp: [105, 115],
		range: [4],
		reload: [2],
		speed: [1.3],
		special: "Can switch weapons to engage in melee combat",
	},
	{
		armors: {
			basic: [1, 0],
			elite: [2, 0],
		},
		attacks: {
			basic: [
				[27, 2],
				[3, 4],
			],
			elite: [
				[27, 2],
				[3, 4],
			],
		},
		cost: [0, 35, 0, 45],
		hp: [40, 45],
		range: [4],
		reload: [2],
		speed: [0.96],
		special: "Attacks ignore armor",
	},
	{
		armors: {
			basic: [3, 2],
			elite: [5, 2],
		},
		attacks: {
			basic: [[4, 12]],
			elite: [[4, 14]],
		},
		cost: [60, 0, 0, 45],
		hp: [75, 90],
		range: [0],
		reload: [1.8],
		speed: [1.4],
		special: "Gains attack when near other Monaspa or Knights",
	},
	{
		armors: {
			basic: [0, 2],
			elite: [0, 3],
		},
		attacks: {
			basic: [
				[4, 7],
				[30, 6],
				[21, 2],
				[29, 4],
				[8, 8],
				[5, 8],
			],
			elite: [
				[4, 8],
				[30, 7],
				[21, 2],
				[29, 4],
				[8, 8],
				[5, 8],
			],
		},
		cost: [60, 0, 0, 15],
		hp: [95, 100],
		range: [0],
		reload: [2],
		speed: [0.95],
		special: "Attacks temporarily slow down enemy units",
	},
	{
		armors: {
			basic: [0, 0],
			elite: [0, 0],
		},
		attacks: {
			basic: [
				[3, 4],
				[16, 3],
				[34, 3],
				[21, 4],
				[27, 2],
			],
			elite: [
				[3, 5],
				[16, 4],
				[34, 4],
				[21, 4],
				[27, 2],
			],
		},
		cost: [0, 45, 0, 45],
		hp: [35, 40],
		range: [5, 6],
		reload: [3.5],
		speed: [0.96],
		special: "Special long range attack against buildings",
	},
	{
		armors: {
			basic: [0, 4],
			elite: [0, 5],
		},
		attacks: {
			basic: [
				[4, 11],
				[15, 6],
			],
			elite: [
				[4, 13],
				[15, 7],
			],
		},
		cost: [60, 0, 0, 80],
		hp: [115, 130],
		range: [0],
		reload: [1.9],
		speed: [1.35],
		special: "Gains HP and attack when defeating enemy military",
	},
	{
		armors: {
			basic: [1, 3],
			elite: [2, 3],
		},
		attacks: {
			basic: [[4, 12]],
			elite: [[4, 13]],
		},
		cost: [80, 0, 0, 55],
		hp: [115, 140],
		range: [0],
		reload: [2.28],
		speed: [1.4],
		special: "Can completely block melee attacks",
	},
	{
		armors: {
			basic: [3, 1],
			elite: [3, 1],
		},
		attacks: {
			basic: [
				[4, 9],
				[21, 2],
				[29, 2],
			],
			elite: [
				[4, 13],
				[21, 3],
				[29, 3],
			],
		},
		cost: [40, 0, 0, 40],
		hp: [75, 85],
		range: [0],
		reload: [2.4],
		speed: [1],
		special: "Attacks wound enemies, dealing damage over time",
	},
];


export function useUnitStats() {
  return {
    unitStats,
    classToName,
    resourceNames,
    formatCost,
    formatAttackBonuses,
    getBaseAttack,
  }
}
