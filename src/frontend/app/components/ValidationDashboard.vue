<template>
  <div class="validation-dashboard" data-testid="validation-dashboard">
    <h3>Validation Dashboard</h3>
    <p class="dashboard-description">Real-time display of all validation rules and their status</p>
    
    <!-- Show instructions if no unit is selected -->
    <div v-if="!unit" class="no-unit-message">
      <p><strong>👇 Select a unit type below to begin validation</strong></p>
      <p>Once you select a unit type (Infantry, Cavalry, Archer, or Siege), this dashboard will show:</p>
      <ul>
        <li>✓ Property constraints (Health, Attack, Armor, Speed, Range)</li>
        <li>✓ Type-specific rules for your chosen unit type</li>
        <li>✓ Attack bonus limits</li>
        <li>✓ Point budget status (if in Build/Draft mode)</li>
        <li>✓ Balance warnings for overpowered combinations</li>
      </ul>
    </div>
    
    <!-- Budget Status (if applicable) -->
    <section v-if="unit && maxPoints" class="validation-section">
      <h4>Point Budget</h4>
      <div class="rule-list">
        <div :class="['rule-item', budgetStatus]">
          <span class="rule-indicator">{{ budgetIcon }}</span>
          <span class="rule-text">
            Point budget: {{ currentPoints }} / {{ maxPoints }} points
            <span v-if="budgetStatus === 'fail'" class="rule-detail">({{ currentPoints - maxPoints }} over)</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Property Constraints -->
    <section v-if="unit" class="validation-section">
      <h4>Property Constraints</h4>
      <div class="rule-list">
        <div v-for="rule in propertyRules" :key="rule.field" :class="['rule-item', rule.status]">
          <span class="rule-indicator">{{ getStatusIcon(rule.status) }}</span>
          <span class="rule-text">
            {{ rule.label }}: {{ rule.current }} 
            <span class="rule-range">({{ rule.min }}–{{ rule.max }})</span>
            <span v-if="rule.status === 'fail'" class="rule-detail">{{ rule.error }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Type-Specific Rules -->
    <section v-if="unit && typeSpecificRules.length > 0" class="validation-section">
      <h4>Type-Specific Rules ({{ unitType }})</h4>
      <div class="rule-list">
        <div v-for="rule in typeSpecificRules" :key="rule.id" :class="['rule-item', rule.status]">
          <span class="rule-indicator">{{ getStatusIcon(rule.status) }}</span>
          <span class="rule-text">
            {{ rule.text }}
            <span v-if="rule.status === 'fail'" class="rule-detail">{{ rule.error }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- Attack Bonuses -->
    <section v-if="unit && attackBonusRules.length > 0" class="validation-section">
      <h4>Attack Bonuses</h4>
      <div class="rule-list">
        <div v-for="rule in attackBonusRules" :key="rule.id" :class="['rule-item', rule.status]">
          <span class="rule-indicator">{{ getStatusIcon(rule.status) }}</span>
          <span class="rule-text">
            {{ rule.text }}
            <span v-if="rule.status === 'fail'" class="rule-detail">{{ rule.error }}</span>
          </span>
        </div>
      </div>
    </section>

    <!-- General Warnings -->
    <section v-if="unit && warnings.length > 0" class="validation-section">
      <h4>Warnings</h4>
      <div class="rule-list">
        <div v-for="warning in warnings" :key="warning" class="rule-item warning">
          <span class="rule-indicator">⚠</span>
          <span class="rule-text">{{ warning }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CustomUUData, ValidationError } from '~/composables/useCustomUU';
import { useCustomUU } from '~/composables/useCustomUU';

interface Props {
  unit: CustomUUData | null;
  validationErrors: ValidationError[];
  currentPoints: number;
  maxPoints: number | null;
}

const props = defineProps<Props>();

// Get access to helper functions
const { getBaseUnitOption } = useCustomUU();

const budgetStatus = computed(() => {
  if (!props.maxPoints) return 'pass';
  return props.currentPoints <= props.maxPoints ? 'pass' : 'fail';
});

const budgetIcon = computed(() => {
  return budgetStatus.value === 'pass' ? '✓' : '✗';
});

const unitType = computed(() => props.unit?.unitType || 'infantry');

const propertyRules = computed(() => {
  if (!props.unit) return [];
  
  const rules = [
    {
      field: 'name',
      label: 'Name length',
      current: props.unit.name.length,
      min: 1,
      max: 30,
      status: props.unit.name.length >= 1 && props.unit.name.length <= 30 ? 'pass' : 'fail',
      error: 'Must be 1-30 characters'
    },
    {
      field: 'health',
      label: 'Health',
      current: props.unit.health,
      min: 15,
      max: 400,
      status: props.unit.health >= 15 && props.unit.health <= 400 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'attack',
      label: 'Attack',
      current: props.unit.attack,
      min: 1,
      max: 35,
      status: props.unit.attack >= 1 && props.unit.attack <= 35 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'meleeArmor',
      label: 'Melee Armor',
      current: props.unit.meleeArmor,
      min: -3,
      max: 10,
      status: props.unit.meleeArmor >= -3 && props.unit.meleeArmor <= 10 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'pierceArmor',
      label: 'Pierce Armor',
      current: props.unit.pierceArmor,
      min: -3,
      max: 10,
      status: props.unit.pierceArmor >= -3 && props.unit.pierceArmor <= 10 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'speed',
      label: 'Speed',
      current: props.unit.speed.toFixed(2),
      min: 0.5,
      max: 1.65,
      status: props.unit.speed >= 0.5 && props.unit.speed <= 1.65 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'range',
      label: 'Range',
      current: props.unit.range,
      min: 0,
      max: 12,
      status: props.unit.range >= 0 && props.unit.range <= 12 ? 'pass' : 'fail',
      error: 'Out of range'
    },
    {
      field: 'minRange',
      label: 'Min Range',
      current: props.unit.minRange,
      min: 0,
      max: props.unit.range,
      status: props.unit.minRange >= 0 && props.unit.minRange <= props.unit.range ? 'pass' : 'fail',
      error: 'Must be 0 to range value'
    },
  ];

  return rules;
});

const typeSpecificRules = computed(() => {
  if (!props.unit) return [];
  
  const rules = [];
  const unit = props.unit;
  
  // Get base unit to check for hybrid units
  const baseUnit = getBaseUnitOption(unit.baseUnit);
  const baseUnitRange = baseUnit?.range ?? 0;
  const isHybridUnit = baseUnit && baseUnit.isRanged && baseUnit.isMelee;
  
  // Infantry range constraint (see CUSTOM_UU_RULESET.md)
  // Honor base unit: Throwing Axeman (base 3), Gbeto (base 5), Kamayuk (base 1) can have +2 range
  if (unit.unitType === 'infantry') {
    if (isHybridUnit) {
      const maxAllowedRange = baseUnitRange + 2;
      rules.push({
        id: 'infantry-range-hybrid',
        text: `${baseUnit.name} can have range ${baseUnitRange}-${maxAllowedRange} (base ${baseUnitRange} + up to 2 at 30 pts/range)`,
        status: unit.range >= baseUnitRange && unit.range <= maxAllowedRange ? 'pass' : 'fail',
        error: `Current: ${unit.range}. Must be ${baseUnitRange}-${maxAllowedRange}.`
      });
    } else {
      rules.push({
        id: 'infantry-range',
        text: 'Infantry range must be 0-5 (0=melee, 1=Kamayuk, 3=Throwing Axeman, 5=Gbeto)',
        status: unit.range >= 0 && unit.range <= 5 ? 'pass' : 'fail',
        error: `Current: ${unit.range}. Maximum is 5.`
      });
    }
  }
  
  // Cavalry range constraints (see CUSTOM_UU_RULESET.md)
  // Honor base unit: Mameluke (base 3) can have up to range 5 (base 3 + 2), Steppe Lancer (base 1)
  if (unit.unitType === 'cavalry') {
    if (isHybridUnit) {
      const maxAllowedRange = baseUnitRange + 2;
      rules.push({
        id: 'cavalry-range-hybrid',
        text: `${baseUnit.name} can have range ${baseUnitRange}-${maxAllowedRange} (base ${baseUnitRange} + up to 2 at 30 pts/range)`,
        status: unit.range >= baseUnitRange && unit.range <= maxAllowedRange ? 'pass' : 'fail',
        error: `Current: ${unit.range}. Must be ${baseUnitRange}-${maxAllowedRange}.`
      });
    } else {
      // First rule: overall range must be 0-1 or 3-5
      const validCavRange = (unit.range >= 0 && unit.range <= 1) || (unit.range >= 3 && unit.range <= 5);
      rules.push({
        id: 'cavalry-range-overall',
        text: 'Cavalry range must be 0-1 or 3-5 (0=melee, 1=Steppe Lancer, 3-5=Mameluke)',
        status: validCavRange ? 'pass' : 'fail',
        error: `Current: ${unit.range}. Use 0-1 or 3-5.`
      });
      
      // Second rule: specifically block range 2 (gap between Steppe Lancer and Mameluke)
      if (unit.range === 2) {
        rules.push({
          id: 'cavalry-range-2-blocked',
          text: 'Cavalry cannot have range 2 (gap between Steppe Lancer and Mameluke)',
          status: 'fail',
          error: 'Use range 1 (Steppe Lancer) or 3+ (Mameluke)'
        });
      }
    }
  }
  
  // Archer range requirement
  if (unit.unitType === 'archer') {
    rules.push({
      id: 'archer-range',
      text: 'Archers must have range ≥ 2',
      status: unit.range >= 2 ? 'pass' : 'fail',
      error: `Current: ${unit.range}`
    });
  }
  
  // Siege constraints
  if (unit.unitType === 'siege') {
    const baseUnit = unit.baseUnit;
    const isRangedBase = [280, 279, 36, 1699].includes(baseUnit); // Mangonel, Scorpion, Bombard Cannon, War Wagon
    
    rules.push({
      id: 'siege-ranged',
      text: `Siege ranged/melee based on base unit`,
      status: isRangedBase ? (unit.range >= 2 ? 'pass' : 'fail') : (unit.range === 0 ? 'pass' : 'fail'),
      error: isRangedBase ? 'Ranged base needs range ≥ 2' : 'Melee base needs range = 0'
    });
  }
  
  return rules;
});

const attackBonusRules = computed(() => {
  if (!props.unit) return [];
  
  const maxBonuses: Record<string, number> = {
    infantry: 3,
    cavalry: 3,
    archer: 4,
    siege: 3
  };
  
  const max = maxBonuses[props.unit.unitType];
  const current = props.unit.attackBonuses.length;
  
  return [{
    id: 'bonus-count',
    text: `Attack bonuses: ${current} / ${max}`,
    status: current <= max ? 'pass' : 'fail',
    error: `Too many bonuses (${current - max} over limit)`
  }];
});

const warnings = computed(() => {
  const warns: string[] = [];
  
  if (!props.unit) return warns;
  
  // Check for warnings in validation errors
  const warningErrors = props.validationErrors.filter(e => e.severity === 'warning');
  warningErrors.forEach(w => {
    warns.push(`${w.field}: ${w.message}`);
  });
  
  return warns;
});

function getStatusIcon(status: string): string {
  switch (status) {
    case 'pass': return '✓';
    case 'fail': return '✗';
    case 'warning': return '⚠';
    default: return '?';
  }
}
</script>

<style scoped>
.validation-dashboard {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 2rem;
}

.validation-dashboard h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.3rem;
}

.dashboard-description {
  margin: 0 0 1.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.no-unit-message {
  background: #e3f2fd;
  border: 2px solid #2196f3;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  color: #1565c0;
}

.no-unit-message p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.no-unit-message p:last-child {
  margin-bottom: 0;
}

.no-unit-message strong {
  font-size: 1.1rem;
  color: #0d47a1;
}

.no-unit-message ul {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0 0 0;
}

.no-unit-message li {
  padding: 0.4rem 0;
  color: #1565c0;
}

.validation-section {
  margin-bottom: 1.5rem;
}

.validation-section:last-child {
  margin-bottom: 0;
}

.validation-section h4 {
  margin: 0 0 0.75rem 0;
  color: #495057;
  font-size: 1.05rem;
  font-weight: 600;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 0.4rem;
}

.rule-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 5px;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.rule-item.pass {
  background: #d4edda;
  border-left: 3px solid #28a745;
  color: #155724; /* Dark green text for readability */
}

.rule-item.fail {
  background: #f8d7da;
  border-left: 3px solid #dc3545;
  color: #721c24; /* Dark red text for readability */
}

.rule-item.warning {
  background: #fff3cd;
  border-left: 3px solid #ffc107;
  color: #856404; /* Dark amber text for readability */
}

.rule-indicator {
  font-size: 1.1rem;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.rule-item.pass .rule-indicator {
  color: #28a745;
}

.rule-item.fail .rule-indicator {
  color: #dc3545;
}

.rule-item.warning .rule-indicator {
  color: #ffc107;
}

.rule-text {
  flex: 1;
  line-height: 1.4;
}

.rule-range {
  color: #6c757d;
  font-size: 0.85rem;
  margin-left: 0.25rem;
}

.rule-detail {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  font-style: italic;
  color: #6c757d;
}
</style>
