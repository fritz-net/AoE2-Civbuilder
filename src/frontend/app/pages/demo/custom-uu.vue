<template>
  <div class="custom-uu-demo">
    <div class="demo-header">
      <h1>Custom Unique Unit Editor Demo</h1>
      <p class="demo-description">
        Design and customize your own unique units with full control over stats, abilities, and balance.
        This demo showcases the Custom UU Editor component that can be reused in /build and /draft pages.
      </p>
      <NuxtLink to="/demo" class="back-link">← Back to Demos</NuxtLink>
    </div>

    <div class="demo-content">
      <!-- Main Editor -->
      <div class="editor-container">
        <!-- Validation Dashboard - Always visible, positioned above editor -->
        <div class="dashboard-wrapper">
          <ValidationDashboard 
            v-if="editorUnit"
            :unit="editorUnit"
            :validation-errors="editorValidationErrors"
            :current-points="editorPowerBudget"
            :max-points="editorMaxPoints"
          />
          <div v-else class="dashboard-placeholder">
            <h3>Validation Dashboard</h3>
            <p>This dashboard will show real-time validation rules and budget status once you select a unit type below.</p>
            <p class="help-hint">👇 Click on a unit type (Infantry, Cavalry, Archer, or Siege) to get started</p>
          </div>
        </div>
        
        <CustomUUEditor :show-mode-selector="true" ref="editorRef" />
      </div>

      <!-- Documentation Sidebar -->
      <aside class="documentation">
        <h2>Documentation</h2>
        
        <section class="doc-section">
          <h3>What is this?</h3>
          <p>
            The Custom UU Editor allows you to design unique units by customizing their properties.
            Units are created based on existing unit templates and can be balanced using the point-based system.
          </p>
        </section>

        <section class="doc-section">
          <h3>Editor Modes</h3>
          <ul>
            <li><strong>Demo:</strong> Unlimited points for experimentation</li>
            <li><strong>Build Mode:</strong> 150 points budget for balanced play</li>
            <li><strong>Draft Mode:</strong> 100 points budget for competitive drafts</li>
          </ul>
          <p>In Build and Draft modes, the sliders automatically limit to available points.</p>
        </section>

        <section class="doc-section">
          <h3>Unit Types</h3>
          <ul>
            <li><strong>Infantry:</strong> Melee units trained in barracks</li>
            <li><strong>Cavalry:</strong> Fast mounted units from stables</li>
            <li><strong>Archer:</strong> Ranged units from archery range</li>
            <li><strong>Siege:</strong> Heavy weapons from workshop</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>Base Unit Selection</h3>
          <p>
            Choose from a list of vanilla units as templates. Each provides different animations and base properties.
            You can also enter a custom unit ID for advanced use.
          </p>
        </section>

        <section class="doc-section">
          <h3>Elite Units</h3>
          <p>
            Elite stats are automatically calculated with predictable improvements:
          </p>
          <ul>
            <li><strong>Infantry:</strong> +15% HP, +2 attack, +1 melee armor</li>
            <li><strong>Cavalry:</strong> +20% HP, +2 attack, +1 armor (both types)</li>
            <li><strong>Archer:</strong> +10% HP, +1 attack, +1 range, +1 pierce armor</li>
            <li><strong>Siege:</strong> +25% HP, +3 attack, +1 pierce armor, +1 range (if ranged)</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>Key Properties</h3>
          <ul>
            <li><strong>Health:</strong> Hit points (15-250)</li>
            <li><strong>Attack:</strong> Base damage (2-35)</li>
            <li><strong>Armor:</strong> Melee and Pierce defense</li>
            <li><strong>Speed:</strong> Movement rate (0.5-1.65)</li>
            <li><strong>Range:</strong> Attack distance (0 for melee)</li>
            <li><strong>Cost:</strong> Resource requirements</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>Balancing System</h3>
          <p>
            Each unit has a power budget calculated from its stats. Higher stats require higher costs.
            The editor recommends costs based on the unit's power level to maintain balance.
          </p>
          <p>
            <strong>Hero Mode:</strong> Enable this to create a powerful unit that can only be trained once.
            Hero units are more expensive but grant bonus points for other customizations.
          </p>
        </section>

        <section class="doc-section">
          <h3>Attack Bonuses</h3>
          <p>
            Add attack bonuses against specific unit classes (e.g., +4 vs Cavalry).
            Different unit types can have different numbers of bonuses:
          </p>
          <ul>
            <li>Infantry/Cavalry: Up to 3 bonuses</li>
            <li>Archers/Siege: Up to 4 bonuses</li>
          </ul>
        </section>

        <section class="doc-section">
          <h3>Validation</h3>
          <p>
            The editor validates your unit design against the ruleset to ensure:
          </p>
          <ul>
            <li>All values are within acceptable ranges</li>
            <li>Type-specific constraints are met</li>
            <li>No overpowered combinations exist</li>
            <li>Unit has appropriate trade-offs</li>
          </ul>
          <p>
            <span class="error-badge">Errors</span> prevent saving and must be fixed.
            <span class="warning-badge">Warnings</span> indicate potential balance issues but don't prevent saving.
          </p>
        </section>

        <section class="doc-section">
          <h3>Examples</h3>
          <p class="help-note">
            Click an example below to see pre-configured units (feature coming soon - examples will auto-load into editor)
          </p>
          <div class="example-buttons">
            <button @click="loadExample('infantry')" class="example-btn">Infantry Example</button>
            <button @click="loadExample('cavalry')" class="example-btn">Cavalry Example</button>
            <button @click="loadExample('archer')" class="example-btn">Archer Example</button>
            <button @click="loadExample('hero')" class="example-btn">Hero Mode Example</button>
          </div>
        </section>

        <section class="doc-section">
          <h3>Resources</h3>
          <ul>
            <li><a href="/docs/UNIQUE_UNITS.md" target="_blank">Technical Documentation</a></li>
            <li><a href="/docs/CUSTOM_UU_RULESET.md" target="_blank">Design Ruleset</a></li>
            <li><a href="/docs/CUSTOM_UU_API.md" target="_blank">API Specification</a></li>
          </ul>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import CustomUUEditor from '~/components/CustomUUEditor.vue';
import ValidationDashboard from '~/components/ValidationDashboard.vue';
import { useCustomUU } from '~/composables/useCustomUU';

// Get shared state from composable
const {
  customUnit,
  validateUnit,
  calculatePowerBudget,
  maxPoints
} = useCustomUU();

// Computed properties for dashboard
const editorUnit = computed(() => customUnit.value);
const editorValidationErrors = computed(() => {
  return customUnit.value ? validateUnit(customUnit.value) : [];
});
const editorPowerBudget = computed(() => {
  return customUnit.value ? calculatePowerBudget(customUnit.value) : 0;
});
const editorMaxPoints = computed(() => maxPoints.value);

const loadExample = (type: string) => {
  // Feature to be implemented - would load example unit into editor
  console.log(`Loading ${type} example...`);
};
</script>

<style scoped>
.custom-uu-demo {
  min-height: 100vh;
  background: #f5f5f5;
}

.demo-header {
  background: linear-gradient(135deg, #4d3617 0%, #2a1f10 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.demo-header h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #d4af37;
}

.demo-description {
  max-width: 800px;
  margin: 0 auto 1.5rem;
  font-size: 1.1rem;
  line-height: 1.6;
}

.back-link {
  display: inline-block;
  color: #d4af37;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #b8941f;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 1200px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
  
  .documentation {
    order: -1;
  }
}

.editor-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.documentation {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: sticky;
  top: 2rem;
}

.documentation h2 {
  color: #d4af37;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #d4af37;
  padding-bottom: 0.5rem;
}

.doc-section {
  margin-bottom: 2rem;
}

.doc-section h3 {
  color: #4d3617;
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}

.doc-section p {
  color: #333;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.doc-section ul {
  list-style: disc;
  padding-left: 1.5rem;
  color: #333;
}

.doc-section ul li {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.doc-section a {
  color: #d4af37;
  text-decoration: none;
}

.doc-section a:hover {
  text-decoration: underline;
}

.error-badge {
  display: inline-block;
  background: #dc3545;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
}

.warning-badge {
  display: inline-block;
  background: #ffc107;
  color: #333;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: bold;
}

.example-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.help-note {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-bottom: 0.5rem;
}

.example-btn {
  background: #d4af37;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.example-btn:hover {
  background: #b8941f;
  transform: translateX(5px);
}

/* Scrollbar styling for documentation */
.documentation::-webkit-scrollbar {
  width: 8px;
}

.documentation::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.documentation::-webkit-scrollbar-thumb {
  background: #d4af37;
  border-radius: 4px;
}

.documentation::-webkit-scrollbar-thumb:hover {
  background: #b8941f;
}

/* Dashboard Wrapper */
.dashboard-wrapper {
  margin-bottom: 2rem; /* Changed from margin-top to margin-bottom since it's now above editor */
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  border: 2px solid #e0e0e0;
}

.dashboard-placeholder {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.dashboard-placeholder h3 {
  color: #4d3617;
  margin-bottom: 0.5rem;
}

.dashboard-placeholder p {
  font-style: italic;
  margin-bottom: 0.5rem;
}

.dashboard-placeholder .help-hint {
  font-size: 1.1rem;
  color: #d4af37;
  font-weight: 500;
  margin-top: 1rem;
}
</style>
