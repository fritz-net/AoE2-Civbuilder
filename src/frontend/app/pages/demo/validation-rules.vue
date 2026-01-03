<template>
  <div class="validation-rules-demo">
    <div class="demo-header">
      <h1>Custom UU Validation Rules Dashboard</h1>
      <p class="demo-description">
        Comprehensive overview of all validation rules for custom unique units, including constraints, balancing requirements, and examples.
      </p>
      <NuxtLink to="/demo" class="back-link">← Back to Demos</NuxtLink>
    </div>

    <div class="demo-content">
      <!-- Rule Categories -->
      <div class="rules-container">
        <!-- Required Fields Section -->
        <section class="rule-category">
          <h2>Required Fields</h2>
          <p class="category-description">All custom units must have the following fields defined:</p>
          
          <div class="rule-card">
            <h3>Unit Name</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Constraint:</strong> 1-30 characters
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>"Forest Guardian"</code>
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>""</code> (empty string)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>"VeryLongUnitNameThatExceedsTheMaximumAllowedLength"</code> (>30 chars)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Unit Type</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Constraint:</strong> Must be one of: infantry, cavalry, archer, siege
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>infantry</code>, <code>cavalry</code>, <code>archer</code>, <code>siege</code>
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Base Unit ID</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Constraint:</strong> Valid unit ID from the game
              </div>
              <div class="description">
                Determines the unit's appearance and animations
              </div>
            </div>
          </div>
        </section>

        <!-- Stat Ranges Section -->
        <section class="rule-category">
          <h2>Stat Ranges</h2>
          <p class="category-description">Each stat must fall within specific ranges to ensure game balance:</p>
          
          <div class="rule-card">
            <h3>Health (HP)</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> 15 - 400 HP
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>60</code> (infantry default)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>150</code> (high HP unit)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>350</code> (very high HP unit)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>10</code> (too low)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>450</code> (too high)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Attack</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> 1 - 35 damage
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>8</code> (infantry default)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>20</code> (high attack)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>0</code> (too low)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Armor (Melee & Pierce)</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> -3 to 10
              </div>
              <div class="description">
                Negative armor means the unit takes extra damage
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>0</code> (no armor)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>-3</code> (siege units)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>4</code> (heavy armor)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Movement Speed</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> 0.5 - 1.65
              </div>
              <div class="description">
                Relative speed multiplier (1.0 = standard speed)
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>0.7</code> (slow siege)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>1.0</code> (standard infantry)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>1.35</code> (fast cavalry)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Range</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> 0 - 12 tiles
              </div>
              <div class="description">
                0 = melee unit, higher values = ranged unit
              </div>
              <div class="type-specific">
                <strong>Type-Specific:</strong> Infantry limited to 0-1 range
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>0</code> (melee infantry)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>4</code> (archer)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>5</code> (infantry with >1 range)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Train Time</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Range:</strong> 6 - 90 seconds
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>14</code> (infantry default)
                </div>
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>36</code> (slow training)
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Cost Constraints -->
        <section class="rule-category">
          <h2>Cost Constraints</h2>
          
          <div class="rule-card">
            <h3>Minimum Total Cost</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Constraint:</strong> Total resources ≥ 30
              </div>
              <div class="description">
                Sum of food + wood + stone + gold must be at least 30
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  <code>{ food: 65, wood: 0, stone: 0, gold: 20 }</code> (total: 85)
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  <code>{ food: 15, wood: 0, stone: 0, gold: 10 }</code> (total: 25)
                </div>
              </div>
            </div>
          </div>
          
          <div class="rule-card">
            <h3>Asymmetric Cost Baselines by Type</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Infantry:</strong> 75% food, 25% gold (e.g., 65F + 20G)
              </div>
              <div class="constraint">
                <strong>Cavalry:</strong> 40% food, 60% gold (e.g., 60F + 85G) - expensive units
              </div>
              <div class="constraint">
                <strong>Archer:</strong> 70% wood, 30% gold (e.g., 55W + 20G)
              </div>
              <div class="constraint">
                <strong>Siege:</strong> 75% wood, 25% gold (e.g., 135W + 40G)
              </div>
              <div class="description">
                Cost distributions are intentionally asymmetric to reflect the game's economy.
                More expensive units (like cavalry) grant more points for customization.
                Cheaper units cost points from your budget.
              </div>
            </div>
          </div>
          
          <div class="rule-card">
            <h3>Cost-to-Points Relationship</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Expensive Units:</strong> +2 points per 10 resources above baseline
              </div>
              <div class="constraint">
                <strong>Cheap Units:</strong> -2 points per 10 resources below baseline
              </div>
              <div class="description">
                Making a unit more expensive grants additional customization points.
                Making a unit cheaper reduces available customization points.
                This ensures expensive units can be more powerful to justify their cost.
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">Example</span>
                  Infantry at 100 total cost (vs 85 baseline): +3 points
                </div>
                <div class="example pass">
                  <span class="badge">Example</span>
                  Cavalry at 180 total cost (vs 145 baseline): +7 points
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Attack Bonuses -->
        <section class="rule-category">
          <h2>Attack Bonuses</h2>
          
          <div class="rule-card">
            <h3>Maximum Bonuses</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Infantry/Cavalry:</strong> Maximum 3 bonuses
              </div>
              <div class="constraint">
                <strong>Archers/Siege:</strong> Maximum 4 bonuses
              </div>
              <div class="examples">
                <div class="example pass">
                  <span class="badge">✓ Pass</span>
                  Infantry with 2 bonuses: <code>[{class: 5, amount: 4}, {class: 8, amount: 2}]</code>
                </div>
                <div class="example fail">
                  <span class="badge">✗ Fail</span>
                  Infantry with 4 bonuses (exceeds limit)
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Common Armor Classes</h3>
            <div class="rule-details">
              <div class="armor-classes">
                <div class="class-item"><strong>1:</strong> Infantry</div>
                <div class="class-item"><strong>3:</strong> Archers</div>
                <div class="class-item"><strong>4:</strong> Base Melee</div>
                <div class="class-item"><strong>5:</strong> Cavalry</div>
                <div class="class-item"><strong>8:</strong> Cavalry Archers</div>
                <div class="class-item"><strong>11:</strong> Buildings</div>
                <div class="class-item"><strong>13:</strong> Stone Buildings</div>
                <div class="class-item"><strong>19:</strong> Unique Units</div>
                <div class="class-item"><strong>20:</strong> Siege Weapons</div>
                <div class="class-item"><strong>30:</strong> War Elephants</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Balance Warnings -->
        <section class="rule-category">
          <h2>Balance Warnings</h2>
          <p class="category-description">These combinations trigger warnings but don't prevent saving:</p>
          
          <div class="rule-card warning">
            <h3>High HP + High Speed</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Warning:</strong> HP > 120 AND Speed > 1.3
              </div>
              <div class="description">
                Fast units with high HP can be difficult to counter
              </div>
              <div class="examples">
                <div class="example warning-example">
                  <span class="badge">⚠ Warning</span>
                  HP: 130, Speed: 1.4
                </div>
              </div>
            </div>
          </div>

          <div class="rule-card warning">
            <h3>High Attack + High HP</h3>
            <div class="rule-details">
              <div class="constraint">
                <strong>Warning:</strong> Attack > 15 AND HP > 100
              </div>
              <div class="description">
                Units with both high attack and HP may lack meaningful trade-offs
              </div>
              <div class="examples">
                <div class="example warning-example">
                  <span class="badge">⚠ Warning</span>
                  Attack: 18, HP: 120
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Power Budget System -->
        <section class="rule-category">
          <h2>Power Budget System</h2>
          <p class="category-description">Units have a point-based power budget calculated from their stats:</p>
          
          <div class="rule-card">
            <h3>Base Points by Type</h3>
            <div class="rule-details">
              <div class="budget-list">
                <div class="budget-item"><strong>Infantry:</strong> 50 base points</div>
                <div class="budget-item"><strong>Cavalry:</strong> 65 base points</div>
                <div class="budget-item"><strong>Archer:</strong> 45 base points</div>
                <div class="budget-item"><strong>Siege:</strong> 70 base points</div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Point Costs</h3>
            <div class="rule-details">
              <div class="point-costs">
                <div class="cost-item"><strong>Health:</strong> 2 points per 10 HP above default</div>
                <div class="cost-item"><strong>Attack:</strong> 3 points per 1 attack above default</div>
                <div class="cost-item"><strong>Melee Armor:</strong> 4 points per 1 armor above default</div>
                <div class="cost-item"><strong>Pierce Armor:</strong> 4 points per 1 armor above default</div>
                <div class="cost-item"><strong>Speed:</strong> 5 points per 0.1 speed above default</div>
                <div class="cost-item"><strong>Range:</strong> 6 points per 1 range above default (all types)</div>
                <div class="cost-item"><strong>Attack Speed:</strong> 6 points per 0.2 seconds faster (increased cost)</div>
                <div class="cost-item"><strong>Train Time:</strong> 2 points per 5 seconds faster</div>
                <div class="cost-item"><strong>Attack Bonuses:</strong> 8 points per 5 bonus damage</div>
                <div class="cost-item"><strong>Cost Adjustment:</strong> +2 points per 10 resources above default (expensive units get points)</div>
                <div class="cost-item"><strong>Cost Adjustment:</strong> -2 points per 10 resources below default (cheap units cost points)</div>
              </div>
            </div>
          </div>

          <div class="rule-card">
            <h3>Mode Limits</h3>
            <div class="rule-details">
              <div class="mode-limits">
                <div class="mode-item">
                  <strong>Demo Mode:</strong> Unlimited points (for experimentation)
                </div>
                <div class="mode-item">
                  <strong>Build Mode:</strong> 150 points maximum
                </div>
                <div class="mode-item">
                  <strong>Draft Mode:</strong> 100 points maximum
                </div>
                <div class="mode-item">
                  <strong>Hero Mode Bonus:</strong> +30 points when hero mode is enabled
                </div>
              </div>
              <div class="description">
                In Build and Draft modes, sliders automatically limit to available points.
                Hero mode grants bonus points but makes the unit trainable only once and more expensive.
              </div>
            </div>
          </div>
        </section>

        <!-- Elite Upgrades -->
        <section class="rule-category">
          <h2>Elite Upgrades</h2>
          <p class="category-description">Elite stats are automatically calculated with predictable improvements:</p>
          
          <div class="elite-grid">
            <div class="rule-card">
              <h3>Infantry</h3>
              <div class="rule-details">
                <ul>
                  <li>+15% HP</li>
                  <li>+2 attack</li>
                  <li>+1 melee armor</li>
                </ul>
              </div>
            </div>

            <div class="rule-card">
              <h3>Cavalry</h3>
              <div class="rule-details">
                <ul>
                  <li>+20% HP</li>
                  <li>+2 attack</li>
                  <li>+1 melee armor</li>
                  <li>+1 pierce armor</li>
                </ul>
              </div>
            </div>

            <div class="rule-card">
              <h3>Archer</h3>
              <div class="rule-details">
                <ul>
                  <li>+10% HP</li>
                  <li>+1 attack</li>
                  <li>+1 pierce armor</li>
                  <li>+1 range</li>
                </ul>
              </div>
            </div>

            <div class="rule-card">
              <h3>Siege</h3>
              <div class="rule-details">
                <ul>
                  <li>+25% HP</li>
                  <li>+3 attack</li>
                  <li>+1 pierce armor</li>
                  <li>+1 range (if ranged)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No setup needed for now - this is a static information page
</script>

<style scoped>
.validation-rules-demo {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 4rem;
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
  color: #f0f0f0; /* Light text color for dark gradient background */
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.rules-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.rule-category {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.rule-category h2 {
  color: #d4af37;
  font-size: 2rem;
  margin-bottom: 0.5rem;
  border-bottom: 3px solid #d4af37;
  padding-bottom: 0.5rem;
}

.category-description {
  color: #333; /* Darker text for better contrast on white background */
  margin-bottom: 1.5rem;
  font-size: 1.05rem;
}

.rule-card {
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.rule-card.warning {
  border-color: #ffc107;
  background: #fffbf0;
}

.rule-card h3 {
  color: #4d3617;
  font-size: 1.4rem;
  margin-bottom: 1rem;
}

.rule-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.constraint {
  font-size: 1.05rem;
  color: #333;
}

.type-specific {
  font-size: 1.05rem;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
  padding: 0.5rem;
  border-radius: 4px;
}

.description {
  color: #555; /* Darker text for better contrast on light background */
  font-style: italic;
  font-size: 0.95rem;
}

.examples {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.example {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.example.pass {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.example.fail {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.example.warning-example {
  background: #fff9e6;
  border-left: 4px solid #ffc107;
}

.example .badge {
  font-weight: bold;
  font-family: system-ui;
  min-width: 60px;
}

.example.pass .badge {
  color: #4caf50;
}

.example.fail .badge {
  color: #f44336;
}

.example.warning-example .badge {
  color: #ff9800;
}

.example code {
  background: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.9rem;
}

.armor-classes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.75rem;
}

.class-item {
  background: white;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.budget-list,
.point-costs,
.mode-limits {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.budget-item,
.cost-item,
.mode-item {
  background: white;
  padding: 0.75rem;
  border-radius: 4px;
  border-left: 4px solid #d4af37;
}

.elite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.elite-grid .rule-card {
  margin-bottom: 0;
}

.elite-grid ul {
  list-style: none;
  padding: 0;
}

.elite-grid li {
  padding: 0.5rem;
  background: white;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid #4caf50;
}

@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 1.8rem;
  }
  
  .demo-content {
    padding: 1rem;
  }
  
  .armor-classes {
    grid-template-columns: 1fr;
  }
  
  .elite-grid {
    grid-template-columns: 1fr;
  }
}
</style>
