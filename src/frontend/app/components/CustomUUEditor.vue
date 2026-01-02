<template>
  <div class="custom-uu-editor">
    <div class="editor-header">
      <h2>Custom Unique Unit Editor</h2>
      <p class="subtitle">Design your own unique unit with customizable stats and abilities</p>
      
      <!-- Mode Selector -->
      <div v-if="showModeSelector" class="mode-selector">
        <label>Editor Mode:</label>
        <div class="mode-buttons">
          <button 
            :class="['mode-btn', { active: editorMode === 'demo' }]"
            @click="setMode('demo')"
          >
            Demo (Unlimited)
          </button>
          <button 
            :class="['mode-btn', { active: editorMode === 'build' }]"
            @click="setMode('build')"
          >
            Build Mode (150 pts)
          </button>
          <button 
            :class="['mode-btn', { active: editorMode === 'draft' }]"
            @click="setMode('draft')"
          >
            Draft Mode (100 pts)
          </button>
        </div>
        <div v-if="maxPoints" class="points-display">
          Points: <strong :class="{ 'over-budget': powerBudget > maxPoints }">{{ powerBudget }}</strong> / {{ maxPoints }}
        </div>
      </div>
      
      <!-- Density Mode Toggle -->
      <div class="density-toggle">
        <label>
          <input type="checkbox" v-model="compactMode" />
          <span>Compact Mode (Icon-based, Sliders Only)</span>
        </label>
      </div>
    </div>

    <!-- Editor Form -->
    <div class="editor-form" :class="{ 'compact-mode': compactMode }">
      <!-- Unit Type Selection (shown first) -->
      <section v-if="!customUnit" class="form-section type-selection">
        <h3>Select Unit Type</h3>
        <div class="type-grid">
          <button 
            v-for="type in unitTypes" 
            :key="type.id"
            class="type-button"
            :data-testid="`type-button-${type.id}`"
            @click="selectUnitType(type.id)"
          >
            <div class="type-icon">{{ type.icon }}</div>
            <div class="type-name">{{ type.name }}</div>
            <div class="type-desc">{{ type.description }}</div>
          </button>
        </div>
      </section>

      <!-- Unit Properties (shown after type selection) -->
      <template v-if="customUnit">
      <!-- Header with unit type switcher and validation -->
      <div class="form-header">
        <div class="type-switcher">
          <label>Unit Type:</label>
          <div class="type-tabs">
            <button 
              v-for="type in unitTypes" 
              :key="type.id"
              :class="['type-tab', { active: customUnit.unitType === type.id }]"
              @click="switchUnitType(type.id)"
            >
              <span class="type-icon-small">{{ type.icon }}</span>
              <span>{{ type.name }}</span>
            </button>
          </div>
        </div>
        <div class="validation-status">
          <span v-if="isValid && !hasWarnings" class="status-valid">✓ Valid</span>
          <span v-else-if="hasWarnings" class="status-warning">⚠ Has Warnings</span>
          <span v-else class="status-error">✗ Invalid</span>
        </div>
      </div>

      <!-- Basic Properties -->
      <section class="form-section">
        <h3>Basic Properties</h3>
        
        <div class="form-group">
          <label for="unit-name">Unit Name</label>
          <input 
            id="unit-name"
            v-model="customUnit.name" 
            type="text" 
            maxlength="30"
            placeholder="Enter unit name"
            @input="onUnitChange"
          />
          <span class="char-count">{{ customUnit.name.length }}/30</span>
        </div>

        <div class="form-group">
          <label>Base Unit Template</label>
          <div class="base-unit-grid">
            <button
              v-for="option in baseUnitOptions"
              :key="option.id"
              :class="['base-unit-option', { selected: customUnit.baseUnit === option.id }]"
              @click="selectBaseUnit(option.id)"
            >
              <img 
                :src="getUnitIconUrl(option)" 
                :alt="option.name"
                class="unit-icon-img"
              />
              <div class="unit-name">{{ option.name }}</div>
            </button>
          </div>
          <div class="custom-id-input">
            <label for="custom-base">Or enter custom ID:</label>
            <input 
              id="custom-base"
              v-model.number="customUnit.baseUnit" 
              type="number" 
              min="1"
              max="2000"
              @input="onUnitChange"
            />
          </div>
        </div>
      </section>

      <!-- Combat Stats -->
      <section class="form-section">
        <h3>Combat Stats <span v-if="eliteStats" class="elite-toggle">(Elite stats shown below)</span></h3>
        
        <div class="stats-grid">
          <div class="form-group">
            <label for="health">
              <span class="stat-icon">❤️</span> Health (HP)
            </label>
            <div class="stat-with-elite">
              <input 
                id="health"
                v-model.number="customUnit.health" 
                type="number" 
                min="15"
                max="250"
                data-testid="health-input"
                :class="{ 'over-budget': isStatOverBudget('health', customUnit.health) }"
                @input="onUnitChange"
              />
              <BudgetSlider
                v-model="customUnit.health"
                :min="15"
                :max="250"
                :budget-limit="maxPoints ? getMaxValue('health') : null"
                @change="onUnitChange"
              />
              <span v-if="eliteStats" class="elite-value">Elite: {{ eliteStats.health }} HP</span>
            </div>
          </div>

          <div class="form-group">
            <label for="attack">
              <span class="stat-icon">⚔️</span> Attack
            </label>
            <div class="stat-with-elite">
              <input 
                id="attack"
                v-model.number="customUnit.attack" 
                type="number" 
                min="2"
                max="35"
                data-testid="attack-input"
                :class="{ 'over-budget': isStatOverBudget('attack', customUnit.attack) }"
                @input="onUnitChange"
              />
              <BudgetSlider
                v-model="customUnit.attack"
                :min="2"
                :max="35"
                :budget-limit="maxPoints ? getMaxValue('attack') : null"
                @change="onUnitChange"
              />
              <span v-if="eliteStats" class="elite-value">Elite: {{ eliteStats.attack }} ATK</span>
            </div>
          </div>

          <div class="form-group">
            <label for="melee-armor">
              <span class="stat-icon">🛡️</span> Melee Armor
            </label>
            <div class="stat-with-elite">
              <input 
                id="melee-armor"
                v-model.number="customUnit.meleeArmor" 
                type="number" 
                min="-3"
                max="10"
                :class="{ 'over-budget': isStatOverBudget('meleeArmor', customUnit.meleeArmor) }"
                @input="onUnitChange"
              />
              <BudgetSlider
                v-model="customUnit.meleeArmor"
                :min="-3"
                :max="10"
                :budget-limit="maxPoints ? getMaxValue('meleeArmor') : null"
                @change="onUnitChange"
              />
              <span v-if="eliteStats" class="elite-value">Elite: {{ eliteStats.meleeArmor }} ARM</span>
            </div>
          </div>

          <div class="form-group">
            <label for="pierce-armor">
              <span class="stat-icon">🏹</span> Pierce Armor
            </label>
            <div class="stat-with-elite">
              <input 
                id="pierce-armor"
                v-model.number="customUnit.pierceArmor" 
                type="number" 
                min="-3"
                max="10"
                :class="{ 'over-budget': isStatOverBudget('pierceArmor', customUnit.pierceArmor) }"
                @input="onUnitChange"
              />
              <BudgetSlider
                v-model="customUnit.pierceArmor"
                :min="-3"
                :max="10"
                :budget-limit="maxPoints ? getMaxValue('pierceArmor') : null"
                @change="onUnitChange"
              />
              <span v-if="eliteStats" class="elite-value">Elite: {{ eliteStats.pierceArmor }} ARM</span>
            </div>
          </div>

          <div class="form-group">
            <label for="attack-speed">
              <span class="stat-icon">⚡</span> Attack Speed (seconds)
            </label>
            <input 
              id="attack-speed"
              v-model.number="customUnit.attackSpeed" 
              type="number" 
              min="0.8"
              max="6"
              step="0.1"
              @input="onUnitChange"
            />
            <span class="help-text">Lower is faster</span>
          </div>

          <div class="form-group">
            <label for="range">
              <span class="stat-icon">🎯</span> Range
            </label>
            <div class="stat-with-elite">
              <input 
                id="range"
                v-model.number="customUnit.range" 
                type="number" 
                min="0"
                :max="getRangeMax()"
                @input="onUnitChange"
              />
              <span class="help-text">0 = melee</span>
              <span v-if="eliteStats && eliteStats.range !== customUnit.range" class="elite-value">Elite: {{ eliteStats.range }} RNG</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Mobility -->
      <section class="form-section">
        <h3>Mobility</h3>
        
        <div class="stats-grid">
          <div class="form-group">
            <label for="speed">
              <span class="stat-icon">🏃</span> Movement Speed
            </label>
            <input 
              id="speed"
              v-model.number="customUnit.speed" 
              type="number" 
              min="0.5"
              max="1.65"
              step="0.05"
              @input="onUnitChange"
            />
            <BudgetSlider
              v-model="customUnit.speed"
              :min="0.5"
              :max="1.65"
              :step="0.05"
              :decimals="2"
              :budget-limit="maxPoints ? getMaxValue('speed') : null"
              @change="onUnitChange"
            />
          </div>

          <div class="form-group">
            <label for="los">
              <span class="stat-icon">👁️</span> Line of Sight
            </label>
            <input 
              id="los"
              v-model.number="customUnit.lineOfSight" 
              type="number" 
              min="3"
              max="12"
              @input="onUnitChange"
            />
          </div>
        </div>
      </section>

      <!-- Cost -->
      <section class="form-section">
        <h3>Cost & Training</h3>
        
        <div class="cost-grid">
          <div class="form-group">
            <label for="cost-food">
              <span class="resource-icon">🌾</span> Food
            </label>
            <input 
              id="cost-food"
              v-model.number="customUnit.cost.food" 
              type="number" 
              min="0"
              @input="onUnitChange"
            />
          </div>

          <div class="form-group">
            <label for="cost-wood">
              <span class="resource-icon">🪵</span> Wood
            </label>
            <input 
              id="cost-wood"
              v-model.number="customUnit.cost.wood" 
              type="number" 
              min="0"
              @input="onUnitChange"
            />
          </div>

          <div class="form-group">
            <label for="cost-stone">
              <span class="resource-icon">🪨</span> Stone
            </label>
            <input 
              id="cost-stone"
              v-model.number="customUnit.cost.stone" 
              type="number" 
              min="0"
              @input="onUnitChange"
            />
          </div>

          <div class="form-group">
            <label for="cost-gold">
              <span class="resource-icon">🪙</span> Gold
            </label>
            <input 
              id="cost-gold"
              v-model.number="customUnit.cost.gold" 
              type="number" 
              min="0"
              @input="onUnitChange"
            />
          </div>
        </div>

        <div class="cost-info">
          <div class="total-cost">
            Total Cost: <strong>{{ totalCost }}</strong> resources
          </div>
          <button class="btn-secondary" @click="applyCostRecommendation">
            Apply Recommended Cost
          </button>
        </div>

        <div class="form-group">
          <label for="train-time">
            <span class="stat-icon">⏱️</span> Train Time (seconds)
          </label>
          <div class="stat-with-slider">
            <input 
              id="train-time"
              v-model.number="customUnit.trainTime" 
              type="number" 
              min="6"
              max="90"
              @input="onUnitChange"
            />
            <BudgetSlider
              v-model="customUnit.trainTime"
              :min="6"
              :max="90"
              :budget-limit="null"
              @change="onUnitChange"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="customUnit.heroMode" 
              type="checkbox"
              @change="onUnitChange"
            />
            <span>Hero Mode (only trainable once, higher cost, bonus points)</span>
          </label>
        </div>
      </section>

      <!-- Attack Bonuses -->
      <section class="form-section">
        <h3>Attack Bonuses</h3>
        
        <div class="bonuses-list">
          <div 
            v-for="(bonus, index) in customUnit.attackBonuses" 
            :key="index"
            class="bonus-item"
          >
            <select v-model.number="bonus.class" @change="onUnitChange">
              <option v-for="(name, id) in ARMOR_CLASS_NAMES" :key="id" :value="parseInt(id)">
                {{ name }}
              </option>
            </select>
            <input 
              v-model.number="bonus.amount" 
              type="number" 
              min="1"
              max="30"
              placeholder="Bonus amount"
              @input="onUnitChange"
            />
            <button class="btn-danger" @click="removeBonus(index)">Remove</button>
          </div>
        </div>

        <button 
          class="btn-secondary" 
          @click="addBonus"
          :disabled="customUnit.attackBonuses.length >= getMaxBonuses()"
        >
          Add Attack Bonus ({{ customUnit.attackBonuses.length }}/{{ getMaxBonuses() }})
        </button>
      </section>

      <!-- Power Budget Info -->
      <section class="form-section info-section">
        <h3>Balance Information</h3>
        <div class="power-info">
          <div class="power-stat">
            <span class="label">Power Budget:</span>
            <span class="value">{{ powerBudget }} points</span>
          </div>
          <div class="power-stat">
            <span class="label">Recommended Cost:</span>
            <span class="value">{{ formatCost(recommendedCost) }}</span>
          </div>
        </div>
      </section>

      <!-- Validation Errors -->
      <section v-if="validationErrors.length > 0" class="form-section validation-section">
        <h3>Validation Messages</h3>
        <div 
          v-for="(error, index) in validationErrors" 
          :key="index"
          :class="['validation-message', `validation-${error.severity}`]"
        >
          <span class="icon">{{ error.severity === 'error' ? '✗' : '⚠' }}</span>
          <span class="message">{{ error.message }}</span>
        </div>
      </section>

      <!-- Actions (hidden in compact mode) -->
      <div v-if="!compactMode" class="form-actions">
        <button class="btn-primary" @click="saveUnit" :disabled="!isValid">
          Save Unit
        </button>
        <button class="btn-secondary" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <button class="btn-secondary" @click="exportUnit">
          Export JSON
        </button>
      </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useCustomUU, type CustomUUData } from '~/composables/useCustomUU';
import BudgetSlider from './BudgetSlider.vue';

interface Props {
  showModeSelector?: boolean;
  initialMode?: 'demo' | 'build' | 'draft';
}

const props = withDefaults(defineProps<Props>(), {
  showModeSelector: false,
  initialMode: 'demo'
});

const emit = defineEmits<{
  (e: 'update', unit: CustomUUData): void;
  (e: 'save', unit: CustomUUData): void;
}>();

const {
  customUnit,
  createCustomUnit,
  validateUnit,
  calculatePowerBudget,
  calculateRecommendedCost,
  calculateEliteStats,
  exportToTechtree,
  getBaseUnitOptions,
  getUnitIconUrl,
  isValid,
  hasWarnings,
  editorMode,
  maxPoints,
  setMode,
  getMaxStatValue,
  ARMOR_CLASS_NAMES
} = useCustomUU(props.initialMode);

// Set initial mode
setMode(props.initialMode);

const validationErrors = ref<any[]>([]);
// Set compactMode to true by default for draft mode
const compactMode = ref(props.initialMode === 'draft');

const unitTypes = [
  {
    id: 'infantry',
    name: 'Infantry',
    icon: '⚔️',
    description: 'Melee fighters trained in barracks'
  },
  {
    id: 'cavalry',
    name: 'Cavalry',
    icon: '🐎',
    description: 'Fast mounted units from stables'
  },
  {
    id: 'archer',
    name: 'Archer',
    icon: '🏹',
    description: 'Ranged units from archery range'
  },
  {
    id: 'siege',
    name: 'Siege',
    icon: '🎯',
    description: 'Heavy weapons from workshop'
  }
];

const selectUnitType = (type: string) => {
  customUnit.value = createCustomUnit(type as any);
  onUnitChange();
};

const switchUnitType = (type: string) => {
  if (customUnit.value && customUnit.value.unitType !== type) {
    customUnit.value = createCustomUnit(type as any);
    onUnitChange();
  }
};

const resetUnit = () => {
  customUnit.value = null;
  validationErrors.value = [];
};

const resetToDefaults = () => {
  if (customUnit.value) {
    const type = customUnit.value.unitType;
    customUnit.value = createCustomUnit(type);
    onUnitChange();
  }
};

const onUnitChange = () => {
  if (customUnit.value) {
    validationErrors.value = validateUnit(customUnit.value);
    
    // Auto-apply recommended cost in draft + compact mode
    if (editorMode.value === 'draft' && compactMode.value) {
      customUnit.value.cost = { ...recommendedCost.value };
    }
    
    // Emit update event
    emit('update', customUnit.value);
  }
};

const baseUnitOptions = computed(() => {
  if (!customUnit.value) return [];
  return getBaseUnitOptions(customUnit.value.unitType);
});

const selectBaseUnit = (id: number) => {
  if (customUnit.value) {
    customUnit.value.baseUnit = id;
    onUnitChange();
  }
};

const eliteStats = computed(() => {
  if (!customUnit.value) return null;
  return calculateEliteStats(customUnit.value);
});

const totalCost = computed(() => {
  if (!customUnit.value) return 0;
  return customUnit.value.cost.food + 
         customUnit.value.cost.wood + 
         customUnit.value.cost.stone + 
         customUnit.value.cost.gold;
});

const powerBudget = computed(() => {
  if (!customUnit.value) return 0;
  return calculatePowerBudget(customUnit.value);
});

const recommendedCost = computed(() => {
  if (!customUnit.value) return { food: 0, wood: 0, stone: 0, gold: 0 };
  return calculateRecommendedCost(customUnit.value);
});

const applyCostRecommendation = () => {
  if (customUnit.value) {
    customUnit.value.cost = { ...recommendedCost.value };
    onUnitChange();
  }
};

const formatCost = (cost: any) => {
  const parts = [];
  if (cost.food > 0) parts.push(`${cost.food}F`);
  if (cost.wood > 0) parts.push(`${cost.wood}W`);
  if (cost.stone > 0) parts.push(`${cost.stone}S`);
  if (cost.gold > 0) parts.push(`${cost.gold}G`);
  return parts.join(' + ') || '0';
};

const getRangeMax = () => {
  if (!customUnit.value) return 12;
  return customUnit.value.unitType === 'infantry' ? 1 : 12;
};

const getMaxValue = (stat: string) => {
  if (!customUnit.value) return 250;
  return getMaxStatValue(stat, customUnit.value.unitType, maxPoints.value, customUnit.value);
};

const isStatOverBudget = (stat: string, value: number) => {
  if (!customUnit.value || !maxPoints.value) return false;
  const maxAllowed = getMaxValue(stat);
  return value > maxAllowed;
};

const getMaxBonuses = () => {
  if (!customUnit.value) return 3;
  return customUnit.value.unitType === 'archer' || customUnit.value.unitType === 'siege' ? 4 : 3;
};

const addBonus = () => {
  if (customUnit.value) {
    customUnit.value.attackBonuses.push({ class: 1, amount: 5 });
    onUnitChange();
  }
};

const removeBonus = (index: number) => {
  if (customUnit.value) {
    customUnit.value.attackBonuses.splice(index, 1);
    onUnitChange();
  }
};

const saveUnit = () => {
  if (customUnit.value && isValid.value) {
    alert('Unit saved! (This would integrate with the actual save system)');
    // Emit event or call API
  }
};

const exportUnit = () => {
  if (customUnit.value) {
    const json = JSON.stringify(customUnit.value, null, 2);
    console.log('Exported unit:', json);
    // Copy to clipboard or download
    navigator.clipboard.writeText(json);
    alert('Unit JSON copied to clipboard!');
  }
};

// Watch for initial load
watch(() => customUnit.value, (newVal) => {
  if (newVal) {
    onUnitChange();
  }
});
</script>

<style scoped>
.custom-uu-editor {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
}

.editor-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.editor-header h2 {
  color: #d4af37;
  font-size: 1.75rem;
  margin-bottom: 0.4rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

/* Mode Selector */
.mode-selector {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f0f0f0;
  border-radius: 8px;
  text-align: center;
}

.mode-selector label {
  font-weight: bold;
  color: #4d3617;
  margin-bottom: 0.4rem;
  display: block;
  font-size: 0.9rem;
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.mode-btn {
  padding: 0.4rem 0.8rem;
  border: 2px solid #d4af37;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.mode-btn:hover {
  background: #f5f5f5;
}

.mode-btn.active {
  background: #d4af37;
  color: white;
  font-weight: bold;
}

.points-display {
  font-size: 1.1rem;
  color: #4d3617;
}

.points-display strong {
  font-size: 1.3rem;
  color: #28a745;
}

.points-display strong.over-budget {
  color: #dc3545;
}

/* Base Unit Grid */
.base-unit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.base-unit-option {
  padding: 0.75rem;
  border: 2px solid #ccc;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.base-unit-option:hover {
  border-color: #d4af37;
  transform: translateY(-2px);
}

.base-unit-option.selected {
  border-color: #d4af37;
  background: #fff9e6;
  font-weight: bold;
}

.base-unit-option .unit-icon-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 0.25rem;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.base-unit-option .unit-name {
  font-size: 0.85rem;
  color: #333;
}

.custom-id-input {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.custom-id-input label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.custom-id-input input {
  width: 150px;
}

/* Elite Stats Display */
.stat-with-elite {
  position: relative;
}

.elite-value {
  display: block;
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
  font-style: italic;
}

.elite-toggle {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: normal;
}

/* Type Selection */
.type-selection {
  text-align: center;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.type-button {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border: 2px solid #d4af37;
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
  border-color: #b8941f;
}

.type-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.type-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #4d3617;
  margin-bottom: 0.25rem;
}

.type-desc {
  font-size: 0.85rem;
  color: #666;
}

/* Editor Form */
.editor-form {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #d4af37;
}

.current-type {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.type-badge {
  background: #d4af37;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
}

.validation-status .status-valid {
  color: #28a745;
  font-weight: bold;
}

.validation-status .status-warning {
  color: #ffc107;
  font-weight: bold;
}

.validation-status .status-error {
  color: #dc3545;
  font-weight: bold;
}

/* Type Switcher */
.type-switcher {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.type-switcher label {
  font-weight: bold;
  color: #4d3617;
  font-size: 0.9rem;
}

.type-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-tab {
  padding: 0.4rem 0.8rem;
  border: 2px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
}

.type-tab:hover {
  border-color: #d4af37;
  background: #f5f5f5;
}

.type-tab.active {
  border-color: #d4af37;
  background: #d4af37;
  color: white;
  font-weight: bold;
}

.type-icon-small {
  font-size: 1.1rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 1.25rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 6px;
}

.form-section h3 {
  color: #4d3617;
  margin-bottom: 0.75rem;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.3rem;
  color: #333;
  font-size: 0.9rem;
}

.form-group input[type="text"],
.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input[type="text"]:focus,
.form-group input[type="number"]:focus,
.form-group select:focus {
  outline: none;
  border-color: #d4af37;
}

.form-group input[type="number"].over-budget {
  border-color: #dc3545;
  border-width: 2px;
  background-color: #fff5f5;
}

.form-group input[type="number"].over-budget:focus {
  border-color: #c82333;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.char-count,
.help-text {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
}

/* Grids */
.stats-grid,
.cost-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

/* Resource Icons */
.resource-icon {
  margin-right: 0.25rem;
}

/* Cost Info */
.cost-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}

.total-cost {
  font-size: 1.1rem;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 0.5rem;
  width: auto;
}

/* Bonuses */
.bonuses-list {
  margin-bottom: 1rem;
}

.bonus-item {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
}

.bonus-item select {
  flex: 2;
}

.bonus-item input {
  flex: 1;
}

/* Power Info */
.info-section {
  background: #e8f5e9;
}

.power-info {
  display: flex;
  gap: 2rem;
}

.power-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.power-stat .label {
  font-size: 0.9rem;
  color: #666;
}

.power-stat .value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #2e7d32;
}

/* Validation */
.validation-section {
  background: #fff3cd;
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.validation-error {
  background: #f8d7da;
  color: #721c24;
}

.validation-warning {
  background: #fff3cd;
  color: #856404;
}

.validation-message .icon {
  font-weight: bold;
}

/* Buttons */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #d4af37;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #b8941f;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn-danger {
  background: #dc3545;
  color: white;
  padding: 0.5rem 1rem;
}

.btn-danger:hover {
  background: #c82333;
}

/* Density Toggle */
.density-toggle {
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.density-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin: 0;
  color: #333; /* Better contrast for readability */
  font-weight: 500;
}

.density-toggle input[type="checkbox"] {
  width: auto;
  margin: 0;
}

/* Compact Mode Styles */
.compact-mode .form-section h3 {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
}

.compact-mode .stats-grid,
.compact-mode .cost-grid {
  gap: 0.75rem;
}

.compact-mode .form-group label {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* In compact mode, hide label text for stats (keep only icons) */
.compact-mode .form-group label:not(.checkbox-label) {
  font-size: 0;
}

.compact-mode .form-group label .stat-icon,
.compact-mode .form-group label .resource-icon {
  font-size: 1.2rem;
}

/* In compact mode, arrange stat-with-elite in a single line */
.compact-mode .stat-with-elite {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Also apply to stat-with-slider */
.compact-mode .stat-with-slider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* In compact mode, only hide number inputs that have sliders (stat-with-elite sections) */
.compact-mode .stat-with-elite input[type="number"] {
  display: none;
}

/* Hide train time input in compact mode too */
.compact-mode .stat-with-slider input[type="number"] {
  display: none;
}

/* In compact mode, hide speed input since it has a BudgetSlider */
.compact-mode #speed {
  display: none;
}

/* Keep unit name visible but smaller */
.compact-mode #unit-name {
  font-size: 0.9rem;
}

.compact-mode .char-count,
.compact-mode .help-text,
.compact-mode .custom-id-input {
  display: none; /* Hide help text and custom ID input in compact mode */
}

.compact-mode .elite-value {
  font-size: 0.75rem;
  white-space: nowrap;
}

.compact-mode .form-section {
  margin-bottom: 1rem;
  padding: 0.75rem;
}

/* In compact mode + draft mode, hide apply cost button (auto-calculated) */
.compact-mode .cost-info button {
  display: none;
}
</style>
